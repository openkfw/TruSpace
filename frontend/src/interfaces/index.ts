export * from "@/modules/chats/domain";
export * from "@/modules/documents/domain";
export * from "@/modules/languages/domain";
export * from "@/modules/perspectives/domain";
export * from "@/modules/tags/domain";
export * from "@/modules/workspaces/domain";

export interface GeneralTemplateOfItemInWorkspace {
   cid: string;
   meta: GeneralTemplateOfItemInWorkspaceMeta;
}

interface GeneralTemplateOfItemInWorkspaceMeta {
   type: string;
   workspaceOrigin: string;
   docId: string;
   timestamp: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
   creatorType?: string;
}
