"use client";

/**
 * Lightweight in-browser pub/sub for "something just changed for this
 * document" signals. Used to drive timely UI refreshes (e.g. the document
 * timeline in {@link DocumentChat}) without resorting to interval polling
 * that hammers the IPFS allocations endpoint.
 *
 * The bus is intentionally minimal:
 * - Subscribers register interest for a specific `docId`.
 * - Producers (chat post, tag create/delete, perspective create, version
 *   upload, AI generation completion, ...) call {@link notifyDocumentActivity}.
 * - A {@link BroadcastChannel} relays notifications to other tabs of the
 *   same origin, so e.g. tagging a document in one tab still refreshes the
 *   chat opened in another tab of the same browser.
 *
 * NOTE: This bus does not cover the cross-user / cross-browser case. For
 * that we would need server-pushed updates (SSE or WebSocket). The
 * `visibilitychange` refresh in {@link DocumentChat} acts as a safety net
 * for users returning to the tab after activity from another participant.
 */

const CHANNEL_NAME = "truspace:document-activity";

type DocumentActivityListener = () => void;

interface DocumentActivityMessage {
   docId: string;
}

const listeners = new Map<string, Set<DocumentActivityListener>>();
let broadcastChannel: BroadcastChannel | null = null;
let broadcastChannelInitialized = false;

function getBroadcastChannel(): BroadcastChannel | null {
   if (broadcastChannelInitialized) {
      return broadcastChannel;
   }
   broadcastChannelInitialized = true;

   if (
      typeof window === "undefined" ||
      typeof BroadcastChannel === "undefined"
   ) {
      return null;
   }

   try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.addEventListener("message", (event: MessageEvent) => {
         const data = event.data as DocumentActivityMessage | undefined;
         if (data?.docId) {
            dispatchLocal(data.docId);
         }
      });
   } catch (error) {
      console.warn("DocumentActivity broadcast channel unavailable", error);
      broadcastChannel = null;
   }

   return broadcastChannel;
}

function dispatchLocal(docId: string): void {
   const bucket = listeners.get(docId);
   if (!bucket) return;
   // Copy first so a listener that unsubscribes during iteration cannot
   // mutate the set we're iterating over.
   Array.from(bucket).forEach((listener) => {
      try {
         listener();
      } catch (error) {
         console.error("DocumentActivity listener threw", error);
      }
   });
}

/**
 * Subscribe to activity notifications for a specific document.
 * Returns an unsubscribe function. Safe to call with falsy ids (no-op).
 */
export function subscribeToDocumentActivity(
   docId: string | null | undefined,
   listener: DocumentActivityListener
): () => void {
   if (!docId) {
      return () => undefined;
   }

   // Lazily wire up the cross-tab channel the first time anyone subscribes.
   getBroadcastChannel();

   let bucket = listeners.get(docId);
   if (!bucket) {
      bucket = new Set();
      listeners.set(docId, bucket);
   }
   bucket.add(listener);

   return () => {
      const current = listeners.get(docId);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
         listeners.delete(docId);
      }
   };
}

interface NotifyOptions {
   /**
    * Delay before firing the notification. Useful when the triggering
    * action writes to IPFS and the corresponding GET endpoint would not
    * yet reflect the change. Defaults to 0 (fire immediately).
    */
   delayMs?: number;
}

/**
 * Notify all local subscribers (and other tabs via BroadcastChannel) that
 * something changed for the given document. Cheap and idempotent - call
 * it after any mutation that should make the document timeline refresh
 * (new chat message, new/removed tag, new perspective, new version, AI
 * generation completion).
 */
export function notifyDocumentActivity(
   docId: string | null | undefined,
   { delayMs = 0 }: NotifyOptions = {}
): void {
   if (!docId) return;

   const emit = () => {
      dispatchLocal(docId);
      try {
         getBroadcastChannel()?.postMessage({
            docId
         } satisfies DocumentActivityMessage);
      } catch (error) {
         console.warn("DocumentActivity broadcast failed", error);
      }
   };

   if (delayMs > 0) {
      window.setTimeout(emit, delayMs);
   } else {
      emit();
   }
}
