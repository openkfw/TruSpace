import axios, { AxiosInstance } from "axios";
import { Response } from "express";
import FormData from "form-data";
import { config } from "../../config/config";
import logger from "../../config/winston";
import { decrypt } from "../../encryption";
import { getWorkspacePassword } from "../../handlers/documents";
import { AuthenticatedRequest } from "../../types";
import {
  ChatMessageRequest,
  DocumentPin,
  DocumentPinningResponse,
  DocumentPinRequest,
  IpfsClientConfig,
  Pin,
  PinningResponse,
  PinRequest,
} from "../../types/interfaces";
import {
  ChatMessage,
  Document,
  DocumentCreateResponse,
  DocumentRequest,
  DocumentsResponse,
  DocumentWithVersions,
  File,
  GeneralTemplateOfItemInWorkspace,
  LanguageRequest,
  Perspective,
  PerspectiveRequest,
  Tag,
  TagRequest,
  UserData,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from "../../types/interfaces/truspace";
import { checkPermissionForWorkspace } from "../../utility/permissions";
import { assertAndEncodeURIComponent } from "../../utility/validation";
import { deleteMultipleJobStatusesDb } from "../db";
import { IClient } from "./IClient";

const {
  ipfsPinningServiceHost,
  ipfsClusterHost,
  ipfsGatewayHost,
  maxNumberOfFetchedPins,
} = config;

const ipfsConfig: IpfsClientConfig = {
  pinSvcBaseUrl: ipfsPinningServiceHost,
  clusterApiBaseUrl: ipfsClusterHost,
  gatewayApiBaseUrl: ipfsGatewayHost,
};

// instance stores a reference to the Singleton
let instance: IpfsClient;

/**
 * Facade for IPFS, Gateway API, Pinning Service clients
 */
export class IpfsClient implements IClient {
  // separate axios instances for isolation
  #pinSvcAxios!: AxiosInstance;
  #clusterAxios!: AxiosInstance;
  #gatewayAxios!: AxiosInstance;

  constructor() {
    if (!instance) {
      this.#pinSvcAxios = axios.create({ baseURL: ipfsConfig.pinSvcBaseUrl });
      this.#clusterAxios = axios.create({
        baseURL: ipfsConfig.clusterApiBaseUrl,
      });
      this.#gatewayAxios = axios.create({
        baseURL: ipfsConfig.gatewayApiBaseUrl,
      });
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      instance = this;
    }
    return instance;
  }
  async downloadAvatar(
    req: AuthenticatedRequest,
    res: Response,
    cid: string,
  ): Promise<any> {
    try {
      const result = await this.#gatewayAxios.get(`/ipfs/${cid}`, {
        responseType: "arraybuffer",
      });

      const fileBuffer = Buffer.from(result.data);

      res.setHeader("Content-Type", result.headers["content-type"]);
      res.setHeader("Content-Disposition", `attachment; filename="${cid}"`);

      res.end(fileBuffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(err);
      res.status(404);
    }
  }
  async uploadAvatar(file: File): Promise<any> {
    try {
      const form = new FormData();

      form.append("file", file.data, {
        filename: file.name,
        contentType: file.mimetype,
      });

      const result = await this.#clusterAxios.post(
        `/add?stream-channels=false`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000,
          maxContentLength: Infinity,
        },
      );
      const data = result.data[0];
      return data.cid;
    } catch (error) {
      logger.error("Error uploading avatar:", error);
      throw error;
    }
  }

  #buildUserDataPath(nodeId: string, userId: string): string {
    return `users/${nodeId}/${userId}/userdata.json`;
  }

  async #getUserDataPins(
    nodeId: string,
    userId: string,
  ): Promise<PinRequest[]> {
    const metaQuery = encodeURIComponent(
      JSON.stringify({
        type: "userdata",
        nodeId,
        userId,
      }),
    );
    const res = await this.#pinSvcAxios.get(`/pins?limit=1000&meta=${metaQuery}`);
    const pins: PinningResponse = res.data;
    return pins.results || [];
  }

  async createUserData(userData: UserData): Promise<void> {
    try {
      const json = JSON.stringify(userData, null);
      const form = new FormData();

      form.append("file", json, {
        filename: "userdata.json",
        contentType: "application/json",
      });

      const safeNodeId = encodeURIComponent(userData.nodeId);
      const safeUserId = encodeURIComponent(userData.userId);
      const userDataPath = this.#buildUserDataPath(
        userData.nodeId,
        userData.userId,
      );

      await this.#clusterAxios.post(
        `/add?stream-channels=false&name=${encodeURIComponent(
          userDataPath,
        )}&meta-type=userdata&meta-nodeId=${safeNodeId}&meta-userId=${safeUserId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000,
          maxContentLength: Infinity,
        },
      );
    } catch (error) {
      logger.error("Error creating user data:", error);
      throw error;
    }
  }

  async modifyUserData(userData: UserData): Promise<void> {
    try {
      await this.deleteUserData(userData.nodeId, userData.userId);
      await this.createUserData(userData);
    } catch (error) {
      logger.error("Error modifying user data:", error);
      throw error;
    }
  }

  async deleteUserData(nodeId: string, userId: string): Promise<void> {
    try {
      const pins = await this.#getUserDataPins(nodeId, userId);
      if (!pins.length) return;

      await Promise.all(
        pins.map((pin) =>
          this.#clusterAxios.delete(
            `/pins/${assertAndEncodeURIComponent(pin.pin.cid)}`,
          ),
        ),
      );
    } catch (error) {
      logger.error(
        `Error deleting user data for nodeId=${nodeId}, userId=${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUserData(nodeId: string, userId: string): Promise<UserData> {
    try {
      if (!nodeId || !userId) {
        return { nodeId, userId, userName: "UNKNOWN" };
      }

      const pins = await this.#getUserDataPins(nodeId, userId);
      if (!pins.length) {
        return { nodeId, userId, userName: "UNKNOWN" };
      }

      const latestPin = pins.sort(
        (a: PinRequest, b: PinRequest) =>
          Number(new Date(b.created).getTime()) -
          Number(new Date(a.created).getTime()),
      )[0];

      const safeCid = assertAndEncodeURIComponent(latestPin.pin.cid);
      const result = await this.#gatewayAxios.get(`/ipfs/${safeCid}`, {
        responseType: "arraybuffer",
      });

      const fileBuffer = Buffer.from(result.data);
      const parsed = JSON.parse(fileBuffer.toString("utf-8"));
      const userName =
        typeof parsed?.userName === "string" && parsed.userName.trim().length > 0
          ? parsed.userName
          : "UNKNOWN";

      return {
        nodeId,
        userId,
        userName,
      };
    } catch (error) {
      logger.error(
        `Error getting user data for nodeId=${nodeId}, userId=${userId}:`,
        error,
      );
      return { nodeId, userId, userName: "UNKNOWN" };
    }
  }

  async pinSvcStatus(): Promise<boolean> {
    try {
      const pinSvcStatus = (await this.#pinSvcAxios.get("/pins?limit=10"))
        .status;
      return pinSvcStatus === 200;
    } catch (error) {
      logger.error("Error checking pinSvc status:", error);
      return false;
    }
  }

  async gatewayStatus(): Promise<boolean> {
    try {
      const status = (
        await this.#gatewayAxios.get("/", {
          // don't throw error on status
          validateStatus: function (_status: any) {
            return true;
          },
        })
      ).status;
      return status < 500;
    } catch (error) {
      logger.error("Error checking gateway status:", error);
      return false;
    }
  }

  async clusterStatus(): Promise<boolean> {
    try {
      const clusterSvcStatus = await this.#clusterAxios.get("/health");
      return clusterSvcStatus.status === 204;
    } catch (error) {
      logger.error("Error checking cluster status:", error);
      return false;
    }
  }

  async clusterId(): Promise<{
    id: string;
    addresses: string[];
    cluster_peers: string[];
    cluster_peers_addresses: string[];
    version: string;
    commit: string;
    rpc_protocol_version: string;
    error: string;
    ipfs: {
      id: string;
      addresses: string[];
      error: string;
    };
    peername: string;
  }> {
    try {
      const clusterId = (await this.#clusterAxios.get("/id")).data;
      return clusterId;
    } catch (error) {
      logger.error("Error getting cluster ID:", error);
      throw error;
    }
  }

  async #getLanguageForVersion(
    versionCid: string,
  ): Promise<string | undefined> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1&meta={"type":"language","versionCid":"${versionCid}"}`,
      );
      if (res.data && res.data.results && res.data.results.length > 0) {
        const languagePin = res.data.results[0].pin;
        return languagePin.meta.language;
      }
      return undefined;
    } catch (error) {
      logger.error(
        `Error fetching language for version CID ${versionCid}:`,
        error,
      );
      return undefined;
    }
  }

  async getDocumentVersionDetailsByCid(cid: string): Promise<Document> {
    try {
      const safeCid = assertAndEncodeURIComponent(cid);
      const clusterRes = (
        await this.#clusterAxios.get(`/allocations/${safeCid}`)
      ).data;
      const language = await this.#getLanguageForVersion(cid);
      const userData = await this.getUserData(
        clusterRes.metadata.creatorNodeId || "",
        clusterRes.metadata.creatorUserId || "",
      );

      return {
        docId: clusterRes.metadata.docId,
        cid: clusterRes.cid,
        meta: {
          creatorNodeId: clusterRes.metadata.creatorNodeId || "",
          creatorUserId: clusterRes.metadata.creatorUserId || "",
          creatorName: userData.userName,
          workspaceOrigin: clusterRes.metadata.workspaceOrigin,
          filename: clusterRes.metadata.filename,
          timestamp: clusterRes.metadata.timestamp,
          version: clusterRes.metadata.version,
          encrypted: clusterRes.metadata.encrypted,
          language: language,
          size: clusterRes.metadata.size
            ? Number(clusterRes.metadata.size)
            : undefined,
          versionTagName: clusterRes.metadata.versionTagName || "",
          // mimetype: clusterRes.metadata.mimetype, // If available and needed
        },
      };
    } catch (error) {
      logger.error(
        `Error getting document version details for CID ${cid}:`,
        error,
      );
      throw error;
    }
  }

  /**
   *
   * @param docId
   * @returns
   */
  async getDocumentDetailsById(docId: string): Promise<DocumentWithVersions> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`,
      );

      const documentPins = res.data.results as DocumentPinRequest[];

      const documentVersionsPromises = documentPins.map(
        async (r: DocumentPinRequest) => {
          const language = await this.#getLanguageForVersion(r.pin.cid);
          const doc = this.#transformPinToDocument(r.pin, language);
          const userData = await this.getUserData(
            doc.meta.creatorNodeId,
            doc.meta.creatorUserId,
          );
          return {
            ...doc,
            meta: {
              ...doc.meta,
              creatorName: userData.userName,
            },
          };
        },
      );

      let documentVersions = await Promise.all(documentVersionsPromises);

      documentVersions = documentVersions.sort((a: Document, b: Document) => {
        return Number(b.meta.timestamp) - Number(a.meta.timestamp);
      });

      if (documentVersions.length === 0) {
        logger.warn(
          `No document versions found for docId: ${docId}. Returning minimal structure.`,
        );
        return {
          docId: docId,
          cid: "", // No primary CID if no versions
          meta: {
            // Minimal meta
            filename: "",
            timestamp: "",
            version: "",
            creatorNodeId: "",
            creatorUserId: "",
            workspaceOrigin: "", // This might need to be fetched differently if no versions
            language: undefined,
            size: 0,
            encrypted: "false",
            versionTagName: "",
          },
          documentVersions: [],
        };
      }

      return { ...documentVersions[0], documentVersions };
    } catch (error) {
      logger.error(`Error getting document details for docId ${docId}:`, error);
      throw error;
    }
  }

  async getDocumentsByDocumentId(docId: string): Promise<Document[]> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`,
      );

      const docs = res.data.results.map((r: DocumentPinRequest) =>
        this.#transformPinToDocument(r.pin),
      );
      return await Promise.all(
        docs.map(async (doc: Document) => {
          const userData = await this.getUserData(
            doc.meta.creatorNodeId,
            doc.meta.creatorUserId,
          );
          return {
            ...doc,
            meta: {
              ...doc.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
    } catch (error) {
      logger.error(`Error getting documents by document ID ${docId}:`, error);
      throw error;
    }
  }

  /**
   *
   * @param cid
   * @param res
   * @returns
   */
  async downloadDocumentVersionByCid(
    req: AuthenticatedRequest,
    res: Response,
    cid: string,
  ): Promise<void> {
    try {
      const docInfo = await this.getDocumentVersionDetailsByCid(cid);
      const metadata = docInfo.meta;

      await checkPermissionForWorkspace(
        req.user?.email as string,
        res,
        metadata.workspaceOrigin,
      );

      const safeCid = assertAndEncodeURIComponent(cid);
      const result = await this.#gatewayAxios.get(`/ipfs/${safeCid}`, {
        responseType: "arraybuffer",
      });

      const fileBuffer = Buffer.from(result.data);
      let modifiedBuffer = fileBuffer;
      if (metadata.encrypted === "true") {
        modifiedBuffer = await decrypt(
          fileBuffer,
          await getWorkspacePassword(metadata.workspaceOrigin),
        );
      }

      res.setHeader("Content-Type", result.headers["content-type"]);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(metadata.filename) || cid}"`,
      );

      res.end(modifiedBuffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(err);
      res.status(404);
    }
  }

  async getDocumentVersionContentByCid(
    cid: string,
  ): Promise<{ data: Buffer; size: number }> {
    try {
      const docInfo = await this.getDocumentVersionDetailsByCid(cid);
      const metadata = docInfo.meta;

      const result = await this.#gatewayAxios.get(`/ipfs/${cid}`, {
        responseType: "arraybuffer",
      });
      const fileBuffer = Buffer.from(result.data);

      let modifiedBuffer = fileBuffer;

      if (metadata.encrypted === "true") {
        modifiedBuffer = await decrypt(fileBuffer, metadata.workspaceOrigin);
      }
      return {
        data: modifiedBuffer,
        size: Number(metadata.size),
      };
    } catch (error) {
      logger.error(
        `Error getting document version content for CID ${cid}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches all workspaces
   * @returns Workspace[ ]
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          '/pins?limit=1000&meta={"type":"workspace"}',
        )
      ).data;

      const workspaces = await Promise.all(
        pinRes.results
          .sort((a, b) => a.pin.meta.name.localeCompare(b.pin.meta.name))
          .map(async (r: PinRequest) => {
            const workspace = this.#transformPinToWorkspace(r.pin);
            const userData = await this.getUserData(
              workspace.meta.creatorNodeId,
              workspace.meta.creatorUserId,
            );
            return {
              ...workspace,
              meta: {
                ...workspace.meta,
                creatorName: userData.userName,
              },
            };
          }),
      );
      return workspaces;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(`Error getting workspace pins: ${JSON.stringify(err)}`);
      return [];
    }
  }

  /**
   *
   * @param workspace
   * @returns
   */
  async createWorkspace(
    workspace: WorkspaceRequest,
  ): Promise<WorkspaceCreateResponse> {
    try {
      const workspaceMeta = { ...workspace.meta };
      delete workspaceMeta.creatorName;
      const json = JSON.stringify({ ...workspace, meta: workspaceMeta }, null);
      const form = new FormData();

      form.append("file", json, {
        filename: workspace.uuid,
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(workspaceMeta)) {
        if (key === "name") {
          metadataQuery += `&meta-${key}=${encodeURIComponent(value)}`;
        } else {
          metadataQuery += `&meta-${key}=${value}`;
        }
      }

      const result = await this.#clusterAxios.post(
        `/add?stream-channels=false&name=${workspace.uuid}${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );
      const data = result.data[0];
      return { cid: data.cid, uuid: data.name };
    } catch (error) {
      logger.error(`Error creating workspace:`, error);
      throw error;
    }
  }

  /**
   * Deletes everything associated with workspace, all file versions, tags, perspectives, chats and job status from DB
   * @param wCID
   * @param wUID
   */
  async deleteWorkspaceById(wCID: string, wUID: string): Promise<void> {
    try {
      const workspace = await this.getWorkspaceById(wUID);
      if (!workspace.length) {
        throw new Error(`No workspace found for ID: ${wUID}`);
      }

      const everythingInWorkspace = await this.getEverythingInWorkspace(wUID);
      await this.deleteDocumentsAndAssociatedItems(everythingInWorkspace);
      const safeWCID = assertAndEncodeURIComponent(wCID);
      await this.#clusterAxios.delete(`/pins/${safeWCID}`);
    } catch (error) {
      logger.error(`Error deleting workspace ${wUID}:`, error);
      throw error;
    }
  }

  async getWorkspaceById(wId: string): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"workspace","workspace_uuid":"${wId}"}`,
        )
      ).data;
      const result = await Promise.all(
        pinRes.results.map(async (r: PinRequest) => {
          const workspace = this.#transformPinToWorkspace(r.pin);
          const userData = await this.getUserData(
            workspace.meta.creatorNodeId,
            workspace.meta.creatorUserId,
          );
          return {
            ...workspace,
            meta: {
              ...workspace.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return result;
    } catch (error) {
      logger.error(`Error getting workspace by ID ${wId}:`, error);
      throw error;
    }
  }

  async getWorkspaceByName(name: string): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"workspace","name":"${encodeURIComponent(name)}"}`,
        )
      ).data;

      const result = await Promise.all(
        pinRes.results.map(async (r: PinRequest) => {
          const workspace = this.#transformPinToWorkspace(r.pin);
          const userData = await this.getUserData(
            workspace.meta.creatorNodeId,
            workspace.meta.creatorUserId,
          );
          return {
            ...workspace,
            meta: {
              ...workspace.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return result;
    } catch (error) {
      logger.error(`Error getting workspace by name ${name}:`, error);
      throw error;
    }
  }

  async getPublicWorkspaces(): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"workspace","is_public":"true"}`,
        )
      ).data;

      const result = await Promise.all(
        pinRes.results.map(async (r: PinRequest) => {
          const workspace = this.#transformPinToWorkspace(r.pin);
          const userData = await this.getUserData(
            workspace.meta.creatorNodeId,
            workspace.meta.creatorUserId,
          );
          return {
            ...workspace,
            meta: {
              ...workspace.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return result;
    } catch (error) {
      logger.error(`Error getting public workspaces:`, error);
      throw error;
    }
  }

  async updateWorkspaceType(
    workspaceId: string,
    isPublic: boolean,
  ): Promise<void> {
    try {
      const workspace = await this.getWorkspaceById(workspaceId);

      const pinRequest: WorkspaceRequest = {
        uuid: workspaceId,
        meta: {
          ...workspace[0].meta,
          is_public: isPublic,
          type: "workspace",
        },
      };
      await this.createWorkspace(pinRequest);

      await this.#clusterAxios.delete(`/pins/${workspace[0].cid}`);
    } catch (error) {
      logger.error(`Error updating workspace type for ${workspaceId}:`, error);
      throw error;
    }
  }

  /**
   *
   * @param doc
   * @param file
   * @returns
   */
  async createDocument(
    doc: DocumentRequest,
    file: File,
  ): Promise<DocumentCreateResponse> {
    try {
      const form = new FormData();

      form.append("file", file.data, {
        filename: file.name,
        contentType: file.mimetype,
      });

      const docMeta = { ...doc.meta };
      delete docMeta.creatorName;
      let metadataQuery = "";

      for (const [key, value] of Object.entries(docMeta)) {
        if (key === "filename") {
          metadataQuery += `&meta-${key}=${encodeURIComponent(value)}`;
        } else {
          metadataQuery += `&meta-${key}=${value}`;
        }
      }

      const result = await this.#clusterAxios.post(
        `/add?stream-channels=false&name=${encodeURIComponent(file.name)}${metadataQuery}&meta-docId=${doc.docId}&meta-type=document`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000,
          maxContentLength: Infinity,
        },
      );
      const data = result.data[0];
      return { cid: data.cid, uuid: doc.docId };
    } catch (error) {
      logger.error(`Error creating document:`, error);
      throw error;
    }
  }

  async getAllDocuments(
    from: number = 0,
    limit: number = 100,
  ): Promise<DocumentsResponse> {
    try {
      const pinRes: DocumentPinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"document"}`,
        )
      ).data;

      const count = pinRes.count || 0;
      const result = this.#pins2Docs(pinRes.results);
      const sliced = result.slice(from, from + limit);
      const data = await Promise.all(
        sliced.map(async (doc: Document) => {
          const userData = await this.getUserData(
            doc.meta.creatorNodeId,
            doc.meta.creatorUserId,
          );
          return {
            ...doc,
            meta: {
              ...doc.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );

      return {
        count,
        from,
        limit,
        data,
      };
    } catch (error) {
      logger.error(`Error getting all documents:`, error);
      throw error;
    }
  }

  async getDocumentsByWorkspace(
    wId: string,
    from: number,
    limit: number,
    searchString: string = "",
  ): Promise<DocumentsResponse> {
    try {
      const pinRes: DocumentPinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"document","workspaceOrigin":"${wId}"}`,
        )
      ).data;

      const result = this.#pins2Docs(pinRes.results);
      const filteredResult = result.filter((doc) =>
        searchString && searchString.length > 0
          ? doc.meta.filename.toLowerCase().includes(searchString.toLowerCase())
          : true,
      );
      const sliced = filteredResult.slice(from, from + limit);
      const data = await Promise.all(
        sliced.map(async (doc: Document) => {
          const userData = await this.getUserData(
            doc.meta.creatorNodeId,
            doc.meta.creatorUserId,
          );
          return {
            ...doc,
            meta: {
              ...doc.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return {
        data,
        count: filteredResult.length,
      };
    } catch (error) {
      logger.error(`Error getting documents by workspace ${wId}:`, error);
      throw error;
    }
  }

  /**
   * @param message
   * @returns
   */
  async createMessage(message: ChatMessageRequest): Promise<string> {
    try {
      const messageMeta = { ...message.meta };
      delete messageMeta.creatorName;
      const json = JSON.stringify({ ...message, meta: messageMeta }, null);
      const form = new FormData();

      form.append("file", json, {
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(messageMeta)) {
        metadataQuery += `&meta-${key}=${value}`;
      }

      const clusterResp = await this.#clusterAxios.post(
        `/add?stream-channels=false${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );
      const result = clusterResp.data[0].cid;
      return result;
    } catch (error) {
      logger.error(`Error creating message:`, error);
      throw error;
    }
  }

  async getPeers() {
    try {
      const response = await this.#clusterAxios.get("/peers");
      const peers = this.#parseMultipleJSON(response.data);
      return peers;
    } catch (error) {
      logger.error(`Error getting peers:`, error);
      throw error;
    }
  }

  async getMessagesByDocumentId(docId: string): Promise<ChatMessage[]> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"chat","docId":"${docId}"}`,
      );

      const pins: PinningResponse = res.data;
      const result = await Promise.all(
        pins.results.map(async (el) => {
          const chat = this.#transformPinToChatMessage(el.pin);
          const userData = await this.getUserData(
            chat.meta.creatorNodeId,
            chat.meta.creatorUserId,
          );
          return {
            ...chat,
            meta: {
              ...chat.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return result.sort((a: ChatMessage, b: ChatMessage) => {
        return Number(a.meta.timestamp) - Number(b.meta.timestamp);
      });
    } catch (error) {
      logger.error(`Error getting messages by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"chat"}`,
      );

      const pins: PinningResponse = res.data;
      const result = await Promise.all(
        pins.results.map(async (el) => {
          const chat = this.#transformPinToChatMessage(el.pin);
          const userData = await this.getUserData(
            chat.meta.creatorNodeId,
            chat.meta.creatorUserId,
          );
          return {
            ...chat,
            meta: {
              ...chat.meta,
              creatorName: userData.userName,
            },
          };
        }),
      );
      return result.sort((a: ChatMessage, b: ChatMessage) => {
        return Number(a.meta.timestamp) - Number(b.meta.timestamp);
      });
    } catch (error) {
      logger.error(`Error getting all messages:`, error);
      throw error;
    }
  }

  async createPerspective(_perspective: PerspectiveRequest): Promise<string> {
    try {
      const perspectiveMeta = { ..._perspective.meta };
      delete perspectiveMeta.creatorName;
      const json = JSON.stringify(
        { ..._perspective, meta: perspectiveMeta },
        null,
      );
      const form = new FormData();

      form.append("file", json, {
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(perspectiveMeta)) {
        metadataQuery += `&meta-${key}=${value}`;
      }

      const clusterResp = await this.#clusterAxios.post(
        `/add?stream-channels=false${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );
      const result = clusterResp.data[0].cid;
      return result;
    } catch (error) {
      logger.error(
        `Error storing perspective in IPFS! ${JSON.stringify(error, null, 2)}`,
      );
      throw error;
    }
  }

  async getPerspectivesByDocumentId(docId: string): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"perspective","docId":"${docId}"}`,
        )
      ).data;

      const perspectives = pinRes.results.map((r: PinRequest) => {
        return this.#transformPinToPerspective(r.pin);
      });
      const fetched = await this.#fetchPerspectiveFiles(perspectives);
      const enriched = await Promise.all(
        fetched.map(async (perspective) => {
          const userData = await this.getUserData(
            perspective.meta.creatorNodeId,
            perspective.meta.creatorUserId,
          );
          return {
            ...perspective,
            meta: {
              ...perspective.meta,
              creatorName:
                (perspective.meta.creatorType ?? "user") === "user"
                  ? userData.userName
                  : perspective.meta.creatorUserId,
            },
          };
        }),
      );
      return enriched;
    } catch (error) {
      logger.error(
        `Error getting perspectives by document ID ${docId}:`,
        error,
      );
      throw error;
    }
  }

  async getPerspectivesByVersionCid(cid: string): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"perspective","versionCid":"${cid}"}`,
        )
      ).data;

      const perspectives = pinRes.results.map((r: PinRequest) => {
        return this.#transformPinToPerspective(r.pin);
      });
      const fetched = await this.#fetchPerspectiveFiles(perspectives);
      const enriched = await Promise.all(
        fetched.map(async (perspective) => {
          const userData = await this.getUserData(
            perspective.meta.creatorNodeId,
            perspective.meta.creatorUserId,
          );
          return {
            ...perspective,
            meta: {
              ...perspective.meta,
              creatorName:
                (perspective.meta.creatorType ?? "user") === "user"
                  ? userData.userName
                  : perspective.meta.creatorUserId,
            },
          };
        }),
      );
      return enriched.sort(
        (a: Perspective, b: Perspective) =>
          Number(new Date(a.meta.timestamp).getTime()) -
          Number(new Date(b.meta.timestamp).getTime()),
      );
    } catch (error) {
      logger.error(`Error getting perspectives by version CID ${cid}:`, error);
      throw error;
    }
  }

  /**
   * Returns everything associated with workspace, docs, their respective versions, tags, perspectives, chats
   * @param workspaceId
   */
  async getEverythingInWorkspace(
    workspaceId: string,
  ): Promise<GeneralTemplateOfItemInWorkspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"workspaceOrigin":"${workspaceId}"}`,
        )
      ).data;

      const everythingInWorkspace = pinRes.results.map((r: PinRequest) => {
        return this.#transformPinToGeneralWorkspaceItem(r.pin);
      });

      return everythingInWorkspace;
    } catch (error) {
      logger.error(
        `Error getting everything in workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Returns everything associated with document id, doc versions, tags, perspectives, chats
   * @param workspaceId
   */
  async getEverythingByDocId(
    docId: string,
  ): Promise<GeneralTemplateOfItemInWorkspace[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"docId":"${docId}"}`,
        )
      ).data;

      const docsAndAssociatedItems = pinRes.results.map((r: PinRequest) => {
        return this.#transformPinToGeneralWorkspaceItem(r.pin);
      });

      return docsAndAssociatedItems;
    } catch (error) {
      logger.error(`Error getting everything by doc ID ${docId}:`, error);
      throw error;
    }
  }

  async createTag(tag: TagRequest): Promise<string> {
    try {
      const json = JSON.stringify(tag, null);
      const form = new FormData();

      form.append("file", json, {
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(tag.meta)) {
        metadataQuery += `&meta-${key}=${value}`;
      }

      const clusterResp = await this.#clusterAxios.post(
        `/add?stream-channels=false${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );
      const result = clusterResp.data[0].cid;
      return result;
    } catch (error) {
      logger.error(`Error creating tag:`, error);
      throw error;
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    try {
      const safeTagId = assertAndEncodeURIComponent(tagId);
      await this.#clusterAxios.delete(`/pins/${safeTagId}`);
    } catch (error) {
      logger.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    try {
      const docsAndAssociatedItems = await this.getEverythingByDocId(docId);
      this.deleteDocumentsAndAssociatedItems(docsAndAssociatedItems);
    } catch (error) {
      logger.error(`Error deleting document ${docId}:`, error);
      throw error;
    }
  }

  async deleteDocumentsAndAssociatedItems(
    allItems: GeneralTemplateOfItemInWorkspace[],
  ) {
    try {
      const allItemCids = allItems.map((item) => item.cid);

      const allDocuments = allItems.filter(
        (item) => item.meta.type === "document",
      );
      const allDocCids = allDocuments.map((doc) => doc.cid);

      const requestIds: string[] = [];
      allDocCids.forEach((docCid) => {
        requestIds.push(`req_tags_${docCid}`);
        requestIds.push(`req_perspectives_${docCid}`);
      });

      if (allItemCids.length) {
        await Promise.all(
          allItemCids.map((itemCid) =>
            this.#clusterAxios.delete(`/pins/${itemCid}`),
          ),
        );
      }

      await deleteMultipleJobStatusesDb(requestIds);
    } catch (error) {
      logger.error(`Error deleting documents and associated items:`, error);
      throw error;
    }
  }

  async getTagsByDocumentId(docId: string): Promise<Tag[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"tag","docId":"${docId}"}`,
        )
      ).data;

      const result = await Promise.all(
        pinRes.results.map(async (r: PinRequest) => {
          const tag = this.#transformPinToTag(r.pin);
          const userData = await this.getUserData(
            tag.meta.creatorNodeId,
            tag.meta.creatorUserId,
          );
          return {
            ...tag,
            meta: {
              ...tag.meta,
              creatorName:
                (tag.meta.creatorType ?? "user") === "user"
                  ? userData.userName
                  : tag.meta.creatorUserId,
            },
          };
        }),
      );
      return result;
    } catch (error) {
      logger.error(`Error getting tags by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getTagsByVersionCid(cid: string): Promise<Tag[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          `/pins?limit=1000&meta={"type":"tag","versionCid":"${cid}"}`,
        )
      ).data;

      const result = await Promise.all(
        pinRes.results.map(async (r: PinRequest) => {
          const tag = this.#transformPinToTag(r.pin);
          const userData = await this.getUserData(
            tag.meta.creatorNodeId,
            tag.meta.creatorUserId,
          );
          return {
            ...tag,
            meta: {
              ...tag.meta,
              creatorName:
                (tag.meta.creatorType ?? "user") === "user"
                  ? userData.userName
                  : tag.meta.creatorUserId,
            },
          };
        }),
      );
      return result;
    } catch (error) {
      logger.error(`Error getting tags by version CID ${cid}:`, error);
      throw error;
    }
  }

  async getAllPerspectives(): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (
        await this.#pinSvcAxios.get(
          '/pins?limit=1000&meta={"type":"perspective"}',
        )
      ).data;

      const perspectives = pinRes.results.map((r: PinRequest) => {
        return this.#transformPinToPerspective(r.pin);
      });
      const fetched = await this.#fetchPerspectiveFiles(perspectives);
      const enriched = await Promise.all(
        fetched.map(async (perspective) => {
          const userData = await this.getUserData(
            perspective.meta.creatorNodeId,
            perspective.meta.creatorUserId,
          );
          return {
            ...perspective,
            meta: {
              ...perspective.meta,
              creatorName:
                (perspective.meta.creatorType ?? "user") === "user"
                  ? userData.userName
                  : perspective.meta.creatorUserId,
            },
          };
        }),
      );
      return enriched;
    } catch (error) {
      logger.error(`Error getting all perspectives:`, error);
      throw error;
    }
  }

  #transformPinToWorkspace(pin: Pin): Workspace {
    // todo add check for all properties
    const workspace: Workspace = {
      cid: pin.cid,
      uuid: pin.meta.workspace_uuid,
      meta: {
        creatorNodeId: pin.meta.creatorNodeId || pin.meta.creator_id || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName:
          pin.meta.creatorName || pin.meta.creator_name || pin.meta.creator || "",
        created_at: pin.meta.created_at,
        type: "workspace",
        workspace_uuid: pin.meta.workspace_uuid,
        name: pin.meta.name,
        is_public: pin.meta.is_public === "true",
      },
    };
    return workspace;
  }

  #transformPinToDocument(pin: DocumentPin, language?: string): Document {
    const doc: Document = {
      docId: pin.meta.docId,
      cid: pin.cid,
      meta: {
        creatorNodeId: pin.meta.creatorNodeId || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName: pin.meta.creatorName || pin.meta.creator || "",
        workspaceOrigin: pin.meta.workspaceOrigin,
        filename: pin.meta.filename,
        timestamp: pin.meta.timestamp,
        version: pin.meta.version,
        encrypted: pin.meta.encrypted || "false",
        size: pin.meta.size ? Number(pin.meta.size) : 0,
        language: language,
        versionTagName: pin.meta.versionTagName || "",
        // mimetype: pin.meta.mimetype, // If available and needed
      },
    };
    return doc;
  }

  #transformPinToChatMessage(pin: Pin): ChatMessage {
    // todo add check for all properties
    const chat: ChatMessage = {
      cid: pin.cid,
      meta: {
        type: "chat",
        cid: pin.meta.cid,
        timestamp: pin.meta.timestamp,
        docId: pin.meta.docId,
        perspectiveType: pin.meta.perspectiveType,
        data: pin.meta.data,
        creatorNodeId: pin.meta.creatorNodeId || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName: pin.meta.creatorName || pin.meta.creator || "",
        workspaceOrigin: pin.meta.workspaceOrigin,
      },
    };
    return chat;
  }

  #transformPinToPerspective(pin: Pin): Perspective {
    const perspective: Perspective = {
      cid: pin.cid,
      meta: {
        type: "perspective",
        perspectiveType: pin.meta.perspectiveType,
        workspaceOrigin: pin.meta.workspaceOrigin,
        docId: pin.meta.docId,
        versionCid: pin.meta.versionCid,
        timestamp: pin.meta.timestamp,
        data: pin.meta.data,
        creatorNodeId: pin.meta.creatorNodeId || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName: pin.meta.creatorName || pin.meta.creator || "",
        creatorType: pin.meta.creatorType,
        prompt: pin.meta.prompt,
      },
    };
    return perspective;
  }

  #transformPinToTag(pin: Pin): Tag {
    const tag: Tag = {
      cid: pin.cid,
      meta: {
        type: "tag",
        workspaceOrigin: pin.meta.workspaceOrigin,
        docId: pin.meta.docId,
        versionCid: pin.meta.versionCid,
        timestamp: pin.meta.timestamp,
        name: pin.meta.name,
        color: pin.meta.color,
        creatorNodeId: pin.meta.creatorNodeId || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName: pin.meta.creatorName || pin.meta.creator || "",
        creatorType: pin.meta.creatorType,
      },
    };
    return tag;
  }

  #transformPinToGeneralWorkspaceItem(
    pin: Pin,
  ): GeneralTemplateOfItemInWorkspace {
    const generalTemplate = {
      cid: pin.cid,
      meta: {
        type: pin.meta.type,
        workspaceOrigin: pin.meta.workspaceOrigin,
        docId: pin.meta.docId,
        timestamp: pin.meta.timestamp,
        creatorNodeId: pin.meta.creatorNodeId || "",
        creatorUserId: pin.meta.creatorUserId || "",
        creatorName:
          pin.meta.creatorName || pin.meta.creator_name || pin.meta.creator || "",
        creatorType: pin.meta.creatorType || "user",
      },
    };
    return generalTemplate;
  }

  #pins2Docs(pins: DocumentPinRequest[]) {
    return (
      pins
        // sort by timestamp from most recent
        .sort((a: DocumentPinRequest, b: DocumentPinRequest) => {
          return Number(b.pin.meta.timestamp) - Number(a.pin.meta.timestamp);
        })
        // unique by docId
        .filter(
          (v, i, a) =>
            a.findIndex((t) => t.pin.meta.docId === v.pin.meta.docId) === i,
        )
        .map((el) => this.#transformPinToDocument(el.pin))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #parseMultipleJSON(data: any) {
    if (!data) return [];

    const str = data.toString();

    const objects = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === "{") depth++;
      if (str[i] === "}") depth--;

      if (depth === 0 && str[i] === "}") {
        objects.push(JSON.parse(str.slice(start, i + 1)));
        start = i + 1;
      }
    }

    return objects;
  }

  /** If `data` field is too large, IPFS pinning service won't return it. It is necessary to get the files themselves */
  async #fetchPerspectiveFiles(
    perspectives: Perspective[],
  ): Promise<Perspective[]> {
    try {
      const perspectiveCids = perspectives.map((p) => p.cid);
      const perspectiveFilesResponse = await Promise.all(
        perspectiveCids.map(async (perspectiveCid) => {
          try {
            const response = await this.#gatewayAxios.get(
              `/ipfs/${perspectiveCid}`,
            );
            return { ...response, perspectiveCid };
          } catch (error) {
            logger.error(
              `Error fetching perspective file ${perspectiveCid}:`,
              error,
            );
            return null;
          }
        }),
      );

      const result = perspectiveFilesResponse
        .filter((r) => r !== null)
        .map((r) => ({
          ...r!.data,
          cid: r!.perspectiveCid,
        }));
      return result;
    } catch (error) {
      logger.error("Error fetching perspective files:", error);
      throw error;
    }
  }

  async createLanguage(langRequest: LanguageRequest) {
    try {
      const json = JSON.stringify(langRequest, null);
      const form = new FormData();

      form.append("file", json, {
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(langRequest.meta)) {
        metadataQuery += `&meta-${key}=${value}`;
      }

      const clusterResp = await this.#clusterAxios.post(
        `/add?stream-channels=false${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );
      const result = clusterResp.data[0].cid;
      return result;
    } catch (error) {
      logger.error(`Error creating language:`, error);
      throw error;
    }
  }
}
