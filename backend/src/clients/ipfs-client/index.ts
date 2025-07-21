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
  DocumentWithVersions,
  File,
  GeneralTemplateOfItemInWorkspace,
  LanguageRequest,
  Perspective,
  PerspectiveRequest,
  Tag,
  TagRequest,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from "../../types/interfaces/truspace";
import { checkPermissionForWorkspace } from "../../utility/permissions";
import { deleteMultipleJobStatusesDb } from "../db";
import { IClient } from "./IClient";

const { ipfsPinningServiceHost, ipfsClusterHost, ipfsGatewayHost } = config;

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
    cid: string
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
      }
    );
    const data = result.data[0];
    return data.cid;
  }

  async pinSvcStatus(): Promise<boolean> {
    const pinSvcStatus = (await this.#pinSvcAxios.get("/pins?limit=10")).status;
    return pinSvcStatus === 200;
  }

  async gatewayStatus(): Promise<boolean> {
    const status = (
      await this.#gatewayAxios.get("/", {
        // don't throw error on status
        validateStatus: function (_status: any) {
          return true;
        },
      })
    ).status;
    return status < 500;
  }

  async clusterStatus(): Promise<boolean> {
    const clusterSvcStatus = await this.#clusterAxios.get("/health");
    return clusterSvcStatus.status === 204;
  }

  async #getLanguageForVersion(
    versionCid: string
  ): Promise<string | undefined> {
    try {
      const res = await this.#pinSvcAxios.get(
        `/pins?limit=1&meta={"type":"language","versionCid":"${versionCid}"}`
      );
      if (res.data && res.data.results && res.data.results.length > 0) {
        const languagePin = res.data.results[0].pin;
        let language = languagePin.meta.language;

        try {
          const parsed = JSON.parse(language);
          if (parsed && parsed.language) {
            language = parsed.language;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          logger.warn(
            `Could not parse language metadata for version CID ${versionCid}. Metadata was: "${language}". This might be expected if the language is stored as a plain string.`
          );
        }
        return language;
      }
      return undefined;
    } catch (error) {
      logger.error(
        `Error fetching language for version CID ${versionCid}:`,
        error
      );
      return undefined;
    }
  }

  async getDocumentVersionDetailsByCid(cid: string): Promise<Document> {
    const clusterRes = (await this.#clusterAxios.get(`/allocations/${cid}`))
      .data;
    const language = await this.#getLanguageForVersion(cid);

    return {
      docId: clusterRes.metadata.docId,
      cid: clusterRes.cid,
      meta: {
        creator: clusterRes.metadata.creator,
        creatorUiid: clusterRes.metadata.creatorUiid,
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
  }

  /**
   *
   * @param docId
   * @returns
   */
  async getDocumentDetailsById(docId: string): Promise<DocumentWithVersions> {
    const res = await this.#pinSvcAxios.get(
      `/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`
    );

    const documentPins = res.data.results as DocumentPinRequest[];

    const documentVersionsPromises = documentPins.map(
      async (r: DocumentPinRequest) => {
        const language = await this.#getLanguageForVersion(r.pin.cid);
        return this.#transformPinToDocument(r.pin, language);
      }
    );

    let documentVersions = await Promise.all(documentVersionsPromises);

    documentVersions = documentVersions.sort((a: Document, b: Document) => {
      return Number(b.meta.timestamp) - Number(a.meta.timestamp);
    });

    if (documentVersions.length === 0) {
      logger.warn(
        `No document versions found for docId: ${docId}. Returning minimal structure.`
      );
      return {
        docId: docId,
        cid: "", // No primary CID if no versions
        meta: {
          // Minimal meta
          filename: "",
          timestamp: "",
          version: "",
          creator: "",
          creatorUiid: "",
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
  }

  async getDocumentsByDocumentId(docId: string): Promise<Document[]> {
    const res = await this.#pinSvcAxios.get(
      `/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`
    );

    return res.data.results.map((r: DocumentPinRequest) =>
      this.#transformPinToDocument(r.pin)
    );
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
    cid: string
  ): Promise<void> {
    try {
      const docInfo = await this.getDocumentVersionDetailsByCid(cid);
      const metadata = docInfo.meta;

      await checkPermissionForWorkspace(
        req.user?.email as string,
        res,
        metadata.workspaceOrigin
      );

      const result = await this.#gatewayAxios.get(`/ipfs/${cid}`, {
        responseType: "arraybuffer",
      });

      const fileBuffer = Buffer.from(result.data);
      let modifiedBuffer = fileBuffer;
      if (metadata.encrypted === "true") {
        modifiedBuffer = await decrypt(
          fileBuffer,
          await getWorkspacePassword(metadata.workspaceOrigin)
        );
      }

      res.setHeader("Content-Type", result.headers["content-type"]);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(metadata.filename) || cid}"`
      );

      res.end(modifiedBuffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(err);
      res.status(404);
    }
  }

  async getDocumentVersionContentByCid(
    cid: string
  ): Promise<{ data: Buffer; size: number }> {
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
  }

  /**
   * Fetches all workspaces
   * @returns Workspace[ ]
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get('/pins?limit=1000&meta={"type":"workspace"}')
    ).data;

    return pinRes.results
      .sort((a, b) => a.pin.meta.name.localeCompare(b.pin.meta.name))
      .map((r: PinRequest) => this.#transformPinToWorkspace(r.pin));
  }

  /**
   *
   * @param workspace
   * @returns
   */
  async createWorkspace(
    workspace: WorkspaceRequest
  ): Promise<WorkspaceCreateResponse> {
    const json = JSON.stringify(workspace, null);
    const form = new FormData();

    form.append("file", json, {
      filename: workspace.uuid,
      contentType: "application/json",
    });

    let metadataQuery = "";

    for (const [key, value] of Object.entries(workspace.meta)) {
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
      }
    );
    const data = result.data[0];
    return { cid: data.cid, uuid: data.name };
  }

  /**
   * Deletes everything associated with workspace, all file versions, tags, perspectives, chats and job status from DB
   * @param wCID
   * @param wUID
   */
  async deleteWorkspaceById(wCID: string, wUID: string): Promise<void> {
    const workspace = await this.getWorkspaceById(wUID);
    if (!workspace.length) {
      throw new Error(`No workspace found for ID: ${wUID}`);
    }

    const everythingInWorkspace = await this.getEverythingInWorkspace(wUID);
    await this.deleteDocumentsAndAssociatedItems(everythingInWorkspace);
    await this.#clusterAxios.delete(`/pins/${wCID}`);
  }

  async getWorkspaceById(wId: string): Promise<Workspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"workspace","workspace_uuid":"${wId}"}`
      )
    ).data;
    const result = pinRes.results.map((r: PinRequest) =>
      this.#transformPinToWorkspace(r.pin)
    );
    return result;
  }

  async getWorkspaceByName(name: string): Promise<Workspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"workspace","name":"${encodeURIComponent(name)}"}`
      )
    ).data;

    const result = pinRes.results.map((r: PinRequest) =>
      this.#transformPinToWorkspace(r.pin)
    );
    return result;
  }

  async getPublicWorkspaces(): Promise<Workspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"workspace","is_public":"true"}`
      )
    ).data;

    const result = pinRes.results.map((r: PinRequest) =>
      this.#transformPinToWorkspace(r.pin)
    );
    return result;
  }

  async updateWorkspaceType(
    workspaceId: string,
    isPublic: boolean
  ): Promise<void> {
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
  }

  /**
   *
   * @param doc
   * @param file
   * @returns
   */
  async createDocument(
    doc: DocumentRequest,
    file: File
  ): Promise<DocumentCreateResponse> {
    const form = new FormData();

    form.append("file", file.data, {
      filename: file.name,
      contentType: file.mimetype,
    });

    let metadataQuery = "";

    for (const [key, value] of Object.entries(doc.meta)) {
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
      }
    );
    const data = result.data[0];
    return { cid: data.cid, uuid: doc.docId };
  }

  async getAllDocuments(): Promise<Document[]> {
    const pinRes: DocumentPinningResponse = (
      await this.#pinSvcAxios.get('/pins?limit=1000&meta={"type":"document"}')
    ).data;

    const result = this.#pins2Docs(pinRes.results);
    return result;
  }

  async getDocumentsByWorkspace(wId: string): Promise<Document[]> {
    const pinRes: DocumentPinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"document","workspaceOrigin":"${wId}"}`
      )
    ).data;

    const result = this.#pins2Docs(pinRes.results);
    return result;
  }

  /**
   * @param message
   * @returns
   */
  async createMessage(message: ChatMessageRequest): Promise<string> {
    const json = JSON.stringify(message, null);
    const form = new FormData();

    form.append("file", json, {
      contentType: "application/json",
    });

    let metadataQuery = "";

    for (const [key, value] of Object.entries(message.meta)) {
      metadataQuery += `&meta-${key}=${value}`;
    }

    const clusterResp = await this.#clusterAxios.post(
      `/add?stream-channels=false${metadataQuery}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );
    const result = clusterResp.data[0].cid;
    return result;
  }

  async getPeers() {
    const peers = await this.#clusterAxios.get("/peers");

    return peers;
  }

  async getMessagesByDocumentId(docId: string): Promise<ChatMessage[]> {
    const res = await this.#pinSvcAxios.get(
      `/pins?limit=1000&meta={"type":"chat","docId":"${docId}"}`
    );

    const pins: PinningResponse = res.data;
    const result = pins.results
      .map((el) => this.#transformPinToChatMessage(el.pin))
      .sort((a: ChatMessage, b: ChatMessage) => {
        return Number(a.meta.timestamp) - Number(b.meta.timestamp);
      });
    return result;
  }

  async createPerspective(_perspective: PerspectiveRequest): Promise<string> {
    try {
      const json = JSON.stringify(_perspective, null);
      const form = new FormData();

      form.append("file", json, {
        contentType: "application/json",
      });

      let metadataQuery = "";

      for (const [key, value] of Object.entries(_perspective.meta)) {
        metadataQuery += `&meta-${key}=${value}`;
      }

      const clusterResp = await this.#clusterAxios.post(
        `/add?stream-channels=false${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        }
      );
      const result = clusterResp.data[0].cid;
      return result;
    } catch (error) {
      logger.error(
        `Error storing perspective in IPFS! ${JSON.stringify(error, null, 2)}`
      );
      throw error;
    }
  }

  async getPerspectivesByDocumentId(docId: string): Promise<Perspective[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"perspective","docId":"${docId}"}`
      )
    ).data;

    const perspectives = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToPerspective(r.pin);
    });
    return this.#fetchPerspectiveFiles(perspectives);
  }

  async getPerspectivesByVersionCid(cid: string): Promise<Perspective[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"perspective","versionCid":"${cid}"}`
      )
    ).data;

    const perspectives = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToPerspective(r.pin);
    });
    return (await this.#fetchPerspectiveFiles(perspectives)).sort(
      (a: Perspective, b: Perspective) =>
        Number(new Date(a.meta.timestamp).getTime()) -
        Number(new Date(b.meta.timestamp).getTime())
    );
  }

  /**
   * Returns everything associated with workspace, docs, their respective versions, tags, perspectives, chats
   * @param workspaceId
   */
  async getEverythingInWorkspace(
    workspaceId: string
  ): Promise<GeneralTemplateOfItemInWorkspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"workspaceOrigin":"${workspaceId}"}`
      )
    ).data;

    const everythingInWorkspace = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToGeneralWorkspaceItem(r.pin);
    });

    return everythingInWorkspace;
  }

  /**
   * Returns everything associated with document id, doc versions, tags, perspectives, chats
   * @param workspaceId
   */
  async getEverythingByDocId(
    docId: string
  ): Promise<GeneralTemplateOfItemInWorkspace[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(`/pins?limit=1000&meta={"docId":"${docId}"}`)
    ).data;

    const docsAndAssociatedItems = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToGeneralWorkspaceItem(r.pin);
    });

    return docsAndAssociatedItems;
  }

  async createTag(tag: TagRequest): Promise<string> {
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
      }
    );
    const result = clusterResp.data[0].cid;
    return result;
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.#clusterAxios.delete(`/pins/${tagId}`);
  }

  async deleteDocument(docId: string): Promise<void> {
    const docsAndAssociatedItems = await this.getEverythingByDocId(docId);
    this.deleteDocumentsAndAssociatedItems(docsAndAssociatedItems);
  }

  async deleteDocumentsAndAssociatedItems(
    allItems: GeneralTemplateOfItemInWorkspace[]
  ) {
    const allItemCids = allItems.map((item) => item.cid);

    const allDocuments = allItems.filter(
      (item) => item.meta.type === "document"
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
          this.#clusterAxios.delete(`/pins/${itemCid}`)
        )
      );
    }

    await deleteMultipleJobStatusesDb(requestIds);
  }

  async getTagsByDocumentId(docId: string): Promise<Tag[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"tag","docId":"${docId}"}`
      )
    ).data;

    const result = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToTag(r.pin);
    });
    return result;
  }

  async getTagsByVersionCid(cid: string): Promise<Tag[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        `/pins?limit=1000&meta={"type":"tag","versionCid":"${cid}"}`
      )
    ).data;

    const result = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToTag(r.pin);
    });
    return result;
  }

  async getAllPerspectives(): Promise<Perspective[]> {
    const pinRes: PinningResponse = (
      await this.#pinSvcAxios.get(
        '/pins?limit=1000&meta={"type":"perspective"}'
      )
    ).data;

    const perspectives = pinRes.results.map((r: PinRequest) => {
      return this.#transformPinToPerspective(r.pin);
    });
    return this.#fetchPerspectiveFiles(perspectives);
  }

  #transformPinToWorkspace(pin: Pin): Workspace {
    // todo add check for all properties
    const workspace: Workspace = {
      cid: pin.cid,
      uuid: pin.meta.workspace_uuid,
      meta: {
        creator_id: pin.meta.creator_id,
        creator_name: pin.meta.creator_name,
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
        creator: pin.meta.creator,
        creatorUiid: pin.meta.creatorUiid,
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
        creator: pin.meta.creator,
        creatorUiid: pin.meta.creatorUiid,
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
        creator: pin.meta.creator,
        creatorUiid: pin.meta.creatorUiid,
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
        creator: pin.meta.creator,
        creatorUiid: pin.meta.creatorUiid,
        creatorType: pin.meta.creatorType,
      },
    };
    return tag;
  }

  #transformPinToGeneralWorkspaceItem(
    pin: Pin
  ): GeneralTemplateOfItemInWorkspace {
    const generalTemplate = {
      cid: pin.cid,
      meta: {
        type: pin.meta.type,
        workspaceOrigin: pin.meta.workspaceOrigin,
        docId: pin.meta.docId,
        timestamp: pin.meta.timestamp,
        creator: pin.meta.creator,
        creatorUiid: pin.meta.creatorUiid,
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
            a.findIndex((t) => t.pin.meta.docId === v.pin.meta.docId) === i
        )
        .map((el) => this.#transformPinToDocument(el.pin))
    );
  }

  /** If `data` field is too large, IPFS pinning service won't return it. It is necessary to get the files themselves */
  async #fetchPerspectiveFiles(
    perspectives: Perspective[]
  ): Promise<Perspective[]> {
    const perspectiveCids = perspectives.map((p) => p.cid);
    const perspectiveFilesResponse = await Promise.all(
      perspectiveCids.map(async (perspectiveCid) => {
        const response = await this.#gatewayAxios.get(
          `/ipfs/${perspectiveCid}`
        );
        return { ...response, perspectiveCid };
      })
    );
    const result = perspectiveFilesResponse.map((r) => ({
      ...r.data,
      cid: r.perspectiveCid,
    }));
    return result;
  }

  async createLanguage(langRequest: LanguageRequest) {
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
      }
    );
    const result = clusterResp.data[0].cid;
    return result;
  }
}
