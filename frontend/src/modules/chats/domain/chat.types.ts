interface ChatMessageMeta {
   type: "chat";
   data: string;
   perspectiveType: string;
   cid: string;
   docId: string;
   workspaceOrigin: string;
   timestamp: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
}

export interface ChatMessageRequest {
   meta: ChatMessageMeta;
}

export interface ChatMessage extends ChatMessageRequest {
   cid: string;
}
