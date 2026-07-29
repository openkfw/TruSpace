import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { getHealth } from "@/lib/services";

const READY = "🟢";
const ERROR = "🔴";

const defaultState = {
   status: false,
   services: { Backend: false }
};

export function BackendHealth() {
   const router = useRouter();
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
      if (health.status === true) {
         return READY;
      }
      return ERROR;
   };

   return (
      <Button
         variant="ghost"
         className="rounded-full flex justify-between items-center"
         onClick={() => router.push("/appStatus")}
         data-test-id="nav-app-status-button"
      >
         <span>{overallStatus()}</span>
         <span>{t("appStatus")}</span>
      </Button>
   );
}
