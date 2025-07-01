"use client";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserLocale } from "@/i18n/service";
import { forgotPassword } from "@/lib/services";
import { validateEmail } from "@/lib/validateEmail";

export default function ForgotPassword() {
   const translations = useTranslations("forgotPassword");
   const {
      register,
      handleSubmit,
      formState: { errors }
   } = useForm();

   const onSubmit = async (data) => {
      const locale = await getUserLocale();
      const enhancedData = {
         ...data,
         lang: locale,
         resetPasswordLink: `${window.location.origin}/reset-password`
      };
      const result = await forgotPassword(enhancedData);
      if (result.status === "success") {
         toast.success(translations("success"));
      }
   };

   const emailValidation = register("email", {
      required: translations("emailRequired"),
      validate: (value) => validateEmail(value) || translations("emailPattern"),
      setValueAs: (value) => value.trim()
   });

   return (
      <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10">
         <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
               <Card>
                  <CardHeader>
                     <CardTitle className="flex justify-between text-2xl">
                        {translations("title")}
                        <LanguageToggle />
                     </CardTitle>
                     <CardDescription>{translations("text")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                           <div className="grid gap-2">
                              <Label htmlFor="email">
                                 {translations("label")}
                              </Label>
                              <Input
                                 id="email"
                                 type="email"
                                 {...emailValidation}
                                 className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                                 placeholder={translations("placeholder")}
                                 onChange={(e) => {
                                    emailValidation.onChange(e);
                                 }}
                                 data-test-id="forgot-password-email"
                              />
                              {errors.email?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.email.message)}
                                 </p>
                              )}
                           </div>
                           <Button
                              type="submit"
                              className="w-full"
                              data-test-id="forgot-password-submit"
                           >
                              {translations("button")}
                           </Button>
                           <div className="mt-4 text-center text-sm">
                              <Link
                                 href="/login"
                                 className="underline underline-offset-4"
                              >
                                 {translations("backToLogin")}
                              </Link>
                           </div>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
