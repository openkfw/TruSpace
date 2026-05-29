interface TagMeta {
   type: "tag";
   workspaceOrigin: string;
   docId: string;
   versionCid: string;
   timestamp: string;
   name: string;
   color: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorType: string;
   creatorName?: string;
}

export interface TagRequest {
   meta: TagMeta;
}

export interface Tag extends TagRequest {
   cid: string;
}
