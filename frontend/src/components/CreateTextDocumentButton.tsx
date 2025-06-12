"use client";
import { useRouter } from "next/navigation";

import { Button } from "./ui/button";

export default function CreateTextDocumentButton() {
   const router = useRouter();

   const navigateToCreateTextDocument = () => {
      router.push("/document/new");
   };
   return (
      <Button variant="outline" onClick={navigateToCreateTextDocument}>
         Create text document
      </Button>
   );
}
