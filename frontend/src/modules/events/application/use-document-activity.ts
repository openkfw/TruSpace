"use client";

import { useEffect } from "react";

import { subscribeToDocumentActivity } from "./document-activity-bus";

/**
 * React hook wrapper around {@link subscribeToDocumentActivity}. Re-subscribes
 * whenever `docId` or `onActivity` changes and tears down on unmount.
 *
 * Use this in any component that wants to react to mutations made elsewhere
 * (same tab or another tab in the same browser) for a specific document.
 */
export function useDocumentActivitySubscription(
   docId: string | null | undefined,
   onActivity: () => void
): void {
   useEffect(() => {
      if (!docId) return undefined;
      return subscribeToDocumentActivity(docId, onActivity);
   }, [docId, onActivity]);
}
