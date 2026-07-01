interface ChatMessageMeta {
   type: "chat";
   data: string;
   perspectiveType: string;
   cid: string;
   docId: string;
   workspaceOrigin: string;
   timestamp: string;
   /** Present when the author has edited the message. Epoch-millis string. */
   editedTimestamp?: string;
   /**
    * Stable per-message identifier (UUIDv4) preserved across edits. Used as
    * the like target so reactions survive message edits (which rewrite the
    * underlying IPFS pin and change its `cid`). Legacy messages without this
    * field fall back to their `cid` server-side.
    */
   chatId?: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
}

export interface ChatMessageRequest {
   meta: ChatMessageMeta;
}

export interface ChatLikeMeta {
   type: "chatLike";
   chatId: string;
   timestamp: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
}

export interface ChatLike {
   cid: string;
   meta: ChatLikeMeta;
}

export interface ChatMessage extends ChatMessageRequest {
   cid: string;
   isOwnMessage?: boolean;
   /** Users who liked this message. */
   likes?: ChatLike[];
   /** True when the authenticated user has liked this message. */
   isLikedByCurrentUser?: boolean;
}
