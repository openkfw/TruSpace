"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import { Header } from "@/components/Header";

export default function App({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Header />
         <Breadcrumbs />
         <div className="mx-4 max-[1200px]:mx-0 px-4 py-2">{children}</div>
      </>
   );
}
