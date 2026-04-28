import * as React from "react";

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
   const [isMobile, setIsMobile] = React.useState<boolean>(() => {
      if (typeof window === "undefined") {
         return false;
      }

      return window.innerWidth < MOBILE_BREAKPOINT;
   });

   React.useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }

      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = (event: MediaQueryListEvent) => {
         setIsMobile(event.matches);
      };

      mql.addEventListener("change", onChange);
      setIsMobile(mql.matches);
      return () => mql.removeEventListener("change", onChange);
   }, []);

   return isMobile;
}
