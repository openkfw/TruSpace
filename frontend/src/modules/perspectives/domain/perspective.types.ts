interface PerspectiveMeta {
   type: "perspective";
   perspectiveType: string;
   workspaceOrigin: string;
   docId: string;
   versionCid: string;
   timestamp: string;
   data: string;
   creatorType: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
   prompt: string;
   model?: string;
}

export interface PerspectiveRequest {
   meta: PerspectiveMeta;
}

export interface Perspective extends PerspectiveRequest {
   cid: string;
}
