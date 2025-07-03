"use client";
import React from "react";
import { toast } from "react-toastify";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle
} from "@/components/ui/card";
import { confirmRegistration } from "@/lib/services";

export default function ConfirmRegistration({}: React.ComponentPropsWithoutRef<"div">) {
   const translations = useTranslations("confirmRegistration");
   const token = useSearchParams().get("token");

   const onConfirmClick = async () => {
      const response = await confirmRegistration(token);
      if (response.status === "success") {
         toast.success(translations("confirmSuccess"));
      } else if (response.message === "invalid token") {
         toast.error(translations("confirmErrorToken"));
      } else {
         toast.error(translations("confirmError"));
      }
   };

   return (
      <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10">
         <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
               <Image
                  src="/images/TruSpaceLogo.svg"
                  alt="TruSpace Logo"
                  width={500}
                  height={400}
                  priority
               />
               <Card>
                  <CardHeader>
                     <CardTitle className="flex justify-between text-2xl">
                        {translations("title")}
                        <LanguageToggle />
                     </CardTitle>
                     <CardDescription>{translations("text")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="flex flex-col gap-6">
                        <Button
                           type="submit"
                           className="w-full"
                           data-test-id="confirm-registration"
                           onClick={onConfirmClick}
                        >
                           {translations("confirmButton")}
                        </Button>
                        <div className="mt-4 text-center text-sm">
                           <Link
                              href="/login"
                              className="underline underline-offset-4"
                           >
                              {translations("continueToLogin")}
                           </Link>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
