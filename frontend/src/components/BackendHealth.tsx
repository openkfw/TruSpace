import { Button } from "@/components/ui/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { getHealth } from "@/lib/services";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const READY = "🟢";
const ERROR = "🔴";
const LIMITED_AI = "🍊";

const defaultState = {
   status: false,
   services: { Backend: false }
};

export function BackendHealth() {
   const t = useTranslations("backendHealth");
   const [health, setHealth] = useState(defaultState);

   useEffect(() => {
      async function fetchHealth() {
         const state = await getHealth();
         if (state.status === "failure") {
            setHealth(defaultState);
         } else {
            setHealth(state);
         }
      }
      fetchHealth();
   }, []);

   const overallStatus = () => {
      if (health.services?.Backend && health.services["Open WebUI"] !== true) {
         return LIMITED_AI;
      } else if (health.status === true) {
         return READY;
      }
      return ERROR;
   };

   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button size="icon" variant="ghost" className="rounded-full">
                  {overallStatus()}
               </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded-md shadow-md">
               <ul className="list-none space-y-1">
                  {health.services ? (
                     Object.entries(health.services).map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-2">
                           <span className="font-medium">{k}:</span>
                           <span className="text-gray-600 dark:text-gray-400">
                              {v === true ? (
                                 <CheckCircle className="text-green-500 w-4 h-4" />
                              ) : (
                                 <XCircle className="text-red-400 w-4 h-4" />
                              )}
                           </span>
                        </li>
                     ))
                  ) : (
                     <li className="flex justify-between gap-2">
                        <span className="font-medium">
                           {t("errors_detected")}
                        </span>
                     </li>
                  )}
               </ul>
            </TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}
