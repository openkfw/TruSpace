"use client";
import React from "react";
import { useForm } from "react-hook-form";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useUser } from "@/contexts/UserContext";
import { COOKIE_OPTIONS, setLoginCookie } from "@/lib/";
import { loginUser } from "@/lib/services";
import { validateEmail } from "@/lib/validateEmail";

export default function Login({}: React.ComponentPropsWithoutRef<"div">) {
   const { refreshUser } = useUser();
   const [loginError, setLoginError] = React.useState(false);
   const [statusError, setStatusError] = React.useState(false);
   const translations = useTranslations("login");
   const t = useTranslations("register");
   const router = useRouter();
   const {
      register,
      handleSubmit,
      formState: { errors }
   } = useForm();

   const onSubmit = async (data) => {
      const result = await loginUser(data);
      if (result.status === "success") {
         setLoginCookie(result.user, COOKIE_OPTIONS);
         refreshUser();
         router.push("/home");
      }
      if (result.status === "failure") {
         if (result.message === "Account inactive") {
            setStatusError(true);
         } else {
            setLoginError(true);
         }
      }
   };

   const emailValidation = register("email", {
      required: t("emailRequired"),
      validate: (value) => validateEmail(value) || t("emailPattern")
   });

   const passwordValidation = register("password", {
      required: t("passwordRequired")
   });

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
                     <CardDescription>
                        {translations("subtitle")}
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                           {loginError && (
                              <div className="rounded-md border border-red-500 bg-red-100 px-4 py-2 text-sm text-red-700">
                                 {translations("invalidCredentials")}
                              </div>
                           )}
                           {statusError && (
                              <div className="rounded-md border border-orange-500 bg-orange-100 px-4 py-2 text-sm text-orange-700">
                                 {translations("activationRequired")}
                              </div>
                           )}
                           <div className="grid gap-2">
                              <Label htmlFor="email">
                                 {translations("email")}
                              </Label>
                              <Input
                                 id="email"
                                 type="text"
                                 {...emailValidation}
                                 className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                                 placeholder={translations("email")}
                                 data-test-id="login-username"
                              />
                              {errors.email?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.email.message)}
                                 </p>
                              )}
                           </div>
                           <div className="grid gap-2">
                              <Label htmlFor="password">
                                 {translations("password")}
                              </Label>
                              <Input
                                 id="password"
                                 type="password"
                                 {...passwordValidation}
                                 className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                                 autoComplete="current-password"
                                 placeholder={translations(
                                    "passwordPlaceholder"
                                 )}
                                 data-test-id="login-password"
                              />
                              {errors.password?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.password.message)}
                                 </p>
                              )}
                           </div>
                           <Button
                              type="submit"
                              className="w-full"
                              data-test-id="login-submit"
                           >
                              {translations("logInButton")}
                           </Button>
                           <div className="mt-4 text-center text-sm">
                              {translations("noAccount")}{" "}
                              <Link
                                 href="/register"
                                 className="underline underline-offset-4"
                                 data-test-id="login-signup-link"
                              >
                                 {translations("signUp")}
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
