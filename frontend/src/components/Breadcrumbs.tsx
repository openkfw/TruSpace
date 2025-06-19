import { Fragment, useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
   Breadcrumb,
   BreadcrumbItem,
   BreadcrumbList,
   BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export default function Breadcrumbs() {
   const pathname = usePathname();
   const translations = useTranslations("general");
   const { document } = useDocuments();
   const { workspace } = useWorkspaceContext();
   const [breadcrumbPaths, setBreadcrumbPaths] = useState([]);
   const staticPaths = ["dashboard", "statistics", "share", "userSettings"];

   const isVisibleBreadcrumb = (step) => {
      const { label } = step;
      return label !== "document" && label !== "workspace" && label !== "home";
   };

   const createBreadcrumbPaths = () => {
      const paths = pathname.split("/").filter(Boolean);
      const breadcrumbs = paths
         .map((path, index) => {
            let label = path;
            if (staticPaths.includes(path)) {
               label = translations(path);
            }
            // use regex to check if label is uuid
            else if (
               label.match(
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
               )
            ) {
               if (workspace?.uuid === label) {
                  label = workspace.meta.name;
               } else if (document?.docId === label) {
                  label = document.meta.filename;
               }
            }

            return {
               label,
               href: "/" + paths.slice(0, index + 1).join("/")
            };
         })
         .filter(isVisibleBreadcrumb);

      return breadcrumbs;
   };

   useEffect(() => {
      const paths = createBreadcrumbPaths();
      setBreadcrumbPaths(paths);
   }, [workspace, document, translations, pathname]);

   return (
      <Breadcrumb className="mt-4 mx-4 max-[1200px]:mx-0 px-4">
         <BreadcrumbList>
            <BreadcrumbItem
               key="home"
               className="hidden md:block font-semibold text-sm dark:text-gray-300"
            >
               <Link
                  className="transition-colors hover:text-foreground"
                  href="/home"
               >
                  {translations("homePage")}
               </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />

            {breadcrumbPaths.map((path) => (
               <Fragment key={path.href}>
                  <BreadcrumbItem className="dark:text-gray-300 font-semibold text-sm">
                     <Link
                        className="transition-colors hover:text-foreground"
                        href={path.href}
                     >
                        {path.label}
                     </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="last-of-type:hidden" />
               </Fragment>
            ))}
         </BreadcrumbList>
      </Breadcrumb>
   );
}
