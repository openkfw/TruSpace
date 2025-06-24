"use client";
import Script from "next/script";

import Breadcrumbs from "@/components/Breadcrumbs";
import { Header } from "@/components/Header";

export default function App({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Script src="/runtime/config.js" strategy="beforeInteractive" />
         <Header />
         <Breadcrumbs />
         <div className="mx-4 max-[1200px]:mx-0 px-4 py-2">{children}</div>
      </>
   );
}
