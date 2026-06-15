import { Response } from 'express';
import { Document } from '../../../shared/types/interfaces/truspace';
import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { chatsIpfsRepository } from '../../chats/infrastructure/chats-ipfs.repository';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';
import { workspacesIpfsRepository } from '../../workspaces/infrastructure/workspaces-ipfs.repository';

// Compute contributor count cheaply from already-fetched allocations.
// Avoids calling getContributorsDocument which fires 4 extra IPFS queries per doc.
async function countContributors(docId: string): Promise<number> {
  const allocations = await documentsIpfsRepository.getAllocationsByDocId(docId);
  const uniqueCreators = new Set(
    allocations
      .map((a) => a.metadata?.creatorUserId)
      .filter((id) => id && id !== 'ai' && !id.includes(':'))
  );
  return uniqueCreators.size;
}

export async function getDocumentsByWorkspaceId(
  workspaceId: string,
  from: number,
  limit: number,
  searchString: string,
  email: string,
  res: Response,
  tagFilter: string[] = [],
  creatorFilter: string[] = [],
  sortBy: 'name' | 'timestamp' = 'timestamp',
  sortOrder: 'asc' | 'desc' = 'desc',
) {
  const publicWorkspacesPromise = workspacesIpfsRepository.getPublicWorkspaces();

  if (!workspaceId || workspaceId === 'undefined') {
    const [publicWorkspaces, { data: documents }, allowedWs] = await Promise.all([
      publicWorkspacesPromise,
      documentsIpfsRepository.getAllDocuments(),
      findPermissionsByEmail(email).then((permissions) => permissions.map((p) => p.workspaceId)),
    ]);

    const search = searchString?.toLowerCase() ?? '';
    const result = documents.filter(
      (d) =>
        (allowedWs.includes(d.meta.workspaceOrigin) ||
          publicWorkspaces.some((ws) => ws.meta.workspace_uuid === d.meta.workspaceOrigin)) &&
        (search.length > 0
          ? d.meta.filename.toLowerCase().includes(search) ||
            (d.meta.creatorName ?? '').toLowerCase().includes(search)
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
    const [_permissionResult, documentsResult] = await Promise.all([
      checkPermissionForWorkspace(email, res, workspaceId, await publicWorkspacesPromise),
      documentsIpfsRepository.getDocumentsByWorkspace(
        workspaceId,
        from,
        limit,
        searchString,
        tagFilter,
        creatorFilter,
        sortBy,
        sortOrder,
      ),
    ]);

    const { data: documents, count, availableTags, availableCreators } = documentsResult;

    const documentsWithDetails = await Promise.all(
      documents.map(async (doc: Document) => {
        const [chats, versionCount, uniqueContributorsLength] = await Promise.all([
          chatsIpfsRepository.getMessagesByDocumentId(doc.docId),
          documentsIpfsRepository.countDocumentVersions(doc.docId),
          countContributors(doc.docId),
        ]);

        return {
          ...doc,
          chatsLength: chats.length,
          uniqueContributorsLength,
          documentVersionsLength: versionCount,
        };
      }),
    );

    return {
      count,
      from,
      limit,
      data: documentsWithDetails,
      availableTags,
      availableCreators,
    };
  }
}