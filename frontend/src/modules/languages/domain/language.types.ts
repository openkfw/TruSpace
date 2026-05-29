interface LanguageMeta {
   type: "language";
   workspaceOrigin: string;
   docId: string;
   versionCid: string;
   timestamp: string;
   creatorType: string;
   language: string;
}

export interface LanguageRequest {
   meta: LanguageMeta;
}
