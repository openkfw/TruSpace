"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";

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
import {
   Popover,
   PopoverContent,
   PopoverTrigger
} from "@/components/ui/popover";
import { resetPassword } from "@/lib/services";

export default function ResetPassword() {
   const translations = useTranslations("resetPassword");
   const router = useRouter();
   const token = useSearchParams().get("token");
   const {
      register,
      handleSubmit,
      watch,
      formState: { errors }
   } = useForm();

   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const passwordChecks = [
      {
         label: translations("passwordMinLength"),
         check: (password) => password.length >= 12
      },
      {
         label: translations("passwordUppercase"),
         check: (password) => /[A-Z]/.test(password)
      },
      {
         label: translations("passwordNumber"),
         check: (password) => /\d/.test(password)
      },
      {
         label: translations("passwordPattern"),
         check: (password) =>
            /[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(password)
      }
   ];

   const onSubmit = async (data) => {
      const enhancedData = {
         password: data.password,
         token: token
      };
      const result = await resetPassword(enhancedData);
      if (result.status === "success") {
         toast.success(translations("success"));
         router.push("/login");
      } else if (result.message === "invalid token") {
         toast.error(translations("invalidToken"));
      }
   };

   const password = watch("password", "");

   const passwordValidation = register("password", {
      required: translations("passwordRequired"),
      minLength: {
         value: 12,
         message: translations("passwordMinLength")
      },
      pattern: {
         value: /^(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{12,}$/,
         message: translations("passwordPattern")
      }
   });

   const confirmPasswordValidation = register("confirmPassword", {
      required: translations("confirmPasswordRequired"),
      validate: (value) =>
         value === password || translations("confirmPasswordError"),
      setValueAs: (value) => value.trim()
   });

   return (
      <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10">
         <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
               <Card>
                  <CardHeader>
                     <CardTitle className="text-2xl">
                        {translations("title")}
                     </CardTitle>
                     <CardDescription>{translations("text")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                           <div className="grid gap-2 relative">
                              <Label htmlFor="password">
                                 {translations("password")}
                              </Label>
                              <Popover>
                                 <div className="relative">
                                    <PopoverTrigger asChild>
                                       <Input
                                          id="password"
                                          type={
                                             showPassword ? "text" : "password"
                                          }
                                          autoComplete="new-password"
                                          {...passwordValidation}
                                          className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white pr-10"
                                          placeholder={translations(
                                             "passwordPlaceholder"
                                          )}
                                          data-test-id="reset-password"
                                       />
                                    </PopoverTrigger>

                                    <Button
                                       type="button"
                                       size="icon"
                                       variant="ghost"
                                       onClick={() =>
                                          setShowPassword((prev) => !prev)
                                       }
                                       className="absolute inset-y-0 right-1 flex items-center hover:bg-transparent focus:ring-offset-1 focus:ring-offset-transparent dark:text-white text-slate-800 z-10"
                                    >
                                       {showPassword ? <Eye /> : <EyeOff />}
                                    </Button>
                                 </div>
                                 {errors.password?.message && (
                                    <p className="text-red-500 text-sm">
                                       {translations("passwordError")}
                                    </p>
                                 )}
                                 <PopoverContent
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    data-password-popover="true"
                                    className="w-[--radix-popover-trigger-width] p-3 space-y-1 mb-6 bg-slate-100 dark:bg-slate-700 text-sm shadow-md border border-slate-300 dark:border-slate-600"
                                    side="top"
                                    align="center"
                                 >
                                    <div className="font-medium text-slate-800 dark:text-white mb-1">
                                       {translations("passwordDescription")}
                                    </div>
                                    {passwordChecks.map(
                                       ({ label, check }, idx) => (
                                          <div
                                             key={idx}
                                             className="flex items-center gap-2"
                                          >
                                             {check(password) ? (
                                                <CheckCircle className="text-green-500 w-4 h-4" />
                                             ) : (
                                                <XCircle className="text-red-400 w-4 h-4" />
                                             )}
                                             <span>{label}</span>
                                          </div>
                                       )
                                    )}
                                 </PopoverContent>
                              </Popover>
                           </div>
                           <div className="grid gap-2">
                              <Label htmlFor="confirmPassword">
                                 {translations("confirmPassword")}
                              </Label>
                              <div className="relative">
                                 <Input
                                    id="confirmPassword"
                                    type={
                                       showConfirmPassword ? "text" : "password"
                                    }
                                    autoComplete="new-password"
                                    {...confirmPasswordValidation}
                                    className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white pr-10"
                                    placeholder={translations(
                                       "confirmPasswordPlaceholder"
                                    )}
                                    data-test-id="reset-password-confirm"
                                 />
                                 <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                       setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="absolute inset-y-0 right-1 flex items-center hover:bg-transparent focus:ring-offset-1
                                       focus:ring-offset-transparent dark:text-white text-slate-800"
                                 >
                                    {showConfirmPassword ? <Eye /> : <EyeOff />}
                                 </Button>
                              </div>
                              {errors.confirmPassword?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.confirmPassword.message)}
                                 </p>
                              )}
                           </div>
                           <Button
                              type="submit"
                              className="w-full"
                              data-test-id="reset-password-submit"
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
