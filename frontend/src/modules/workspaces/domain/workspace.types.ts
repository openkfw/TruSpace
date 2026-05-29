interface WorkspaceMeta {
   workspace_uuid: string;
   type: "workspace";
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
   name: string;
   password_hash?: string;
   is_public: boolean;
   created_at: string;
}

export interface WorkspaceRequest {
   uuid: string;
   meta: WorkspaceMeta;
}

export interface WorkspaceCreateResponse {
   uuid: string;
   cid: string;
}

export interface Workspace extends WorkspaceRequest {
   cid: string;
}
