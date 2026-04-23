import { Response } from 'express';
import { Document } from '../../../shared/types/interfaces/truspace';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { getContributorsDocument } from '../../../shared/handlers/documents';
import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { chatsIpfsRepository } from '../../chats/infrastructure/chats-ipfs.repository';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function getDocumentsByWorkspaceId(
  workspaceId: string,
  from: number,
  limit: number,
  searchString: string,
  email: string,
  res: Response,
) {
  const publicWorkspacesPromise = new IpfsClient().getPublicWorkspaces();

  if (!workspaceId || workspaceId === 'undefined') {
    const [publicWorkspaces, { data: documents }, allowedWs] = await Promise.all([
      publicWorkspacesPromise,
      documentsIpfsRepository.getAllDocuments(),
      findPermissionsByEmail(email).then((permissions) => permissions.map((p) => p.workspaceId)),
    ]);

    const result = documents.filter(
      (d) =>
        (allowedWs.includes(d.meta.workspaceOrigin) ||
          publicWorkspaces.some((ws) => ws.meta.workspace_uuid === d.meta.workspaceOrigin)) &&
        (searchString && searchString.length > 0
          ? d.meta.filename.toLowerCase().includes(searchString.toLowerCase())
          : true),
    );

    const paginatedResult = result.slice(from, from + limit);
    return {
      count: result.length,
      from,
      limit,
      data: paginatedResult,
    };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_permissionResult, { data: documents, count }] = await Promise.all([
      checkPermissionForWorkspace(email, res, workspaceId),
      documentsIpfsRepository.getDocumentsByWorkspace(workspaceId, from, limit, searchString),
    ]);

    const documentsWithDetails = await Promise.all(
      documents.map(async (doc: Document) => {
        const [chats, documentDetails, docContributors] = await Promise.all([
          chatsIpfsRepository.getMessagesByDocumentId(doc.docId),
          documentsIpfsRepository.getDocumentDetailsById(doc.docId),
          getContributorsDocument(doc.docId),
        ]);

        const documentVersions = documentDetails.documentVersions as Document[];

        return {
          ...doc,
          chatsLength: chats.length,
          uniqueContributorsLength: docContributors.count,
          documentVersionsLength: documentVersions.length,
        };
      }),
    );

    return {
      count,
      from,
      limit,
      data: documentsWithDetails,
    };
  }
}
