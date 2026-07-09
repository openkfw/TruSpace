"use client";

import { useTranslations } from "next-intl";

import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/formatDate";

import { ActivityEvent } from "../domain";

interface ActivityEntryProps {
   event: ActivityEvent;
}

/**
 * Resolve the display name for the actor of an event. Translation keys are
 * scoped under `events.actor.*`.
 */
function getActorName(
   event: ActivityEvent,
   t: ReturnType<typeof useTranslations>
): string {
   if (event.meta.actorType === "ai") {
      // For AI, actorUserId stores the model name (e.g. "llama3"). Fall back to
      // a generic label if it's missing.
      return event.meta.actorUserId
         ? t("actor.aiNamed", { model: event.meta.actorUserId })
         : t("actor.ai");
   }

   return event.meta.actorName || t("actor.unknown");
}

/**
 * Build the human-readable label for an event. The translation file defines
 * one ICU message per `eventType.eventAction` combination so that wording can
 * be customised per language without touching this component.
 */
function getEventLabel(
   event: ActivityEvent,
   t: ReturnType<typeof useTranslations>
): string {
   const actor = getActorName(event, t);
   const objectName = event.meta.objectName ?? "";
   const version = event.meta.version ?? "";

   const key = `${event.meta.eventType}.${event.meta.eventAction}` as const;

   // ICU MessageFormat handles missing placeholders gracefully when not
   // referenced in the message, so we always pass the full set.
   return t(key, { actor, objectName, version });
}

export default function ActivityEntry({ event }: ActivityEntryProps) {
   const t = useTranslations("events");
   const label = getEventLabel(event, t);
   const fullTimestamp = formatDate(event.meta.timestamp);

   return (
      <div
         className="flex items-center gap-2 py-1 text-xs text-muted-foreground select-none"
         role="status"
         aria-label={label}
      >
         <span
            aria-hidden
            className="flex-1 border-t border-border/60"
         />
         <TooltipProvider>
            <Tooltip>
               <TooltipTrigger asChild>
                  <span className="cursor-default whitespace-nowrap px-1 italic">
                     {label}
                  </span>
               </TooltipTrigger>
               <TooltipContent>{fullTimestamp}</TooltipContent>
            </Tooltip>
         </TooltipProvider>
         <span
            aria-hidden
            className="flex-1 border-t border-border/60"
         />
      </div>
   );
}
