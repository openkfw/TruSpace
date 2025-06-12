"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { registerUser } from "@/lib/services";

import { validateEmail } from "../helper/validateEmail";

export default function Register() {
   const translations = useTranslations("register");
   const router = useRouter();
   const {
      register,
      handleSubmit,
      watch,
      formState: { errors }
   } = useForm();

   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [emailTaken, setEmailTaken] = useState(false);

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
      const result = await registerUser(data);
      if (result.status === "success") {
         setEmailTaken(false);
         toast.success(translations("registerSuccess"));
         router.push("/login");
      }
      if (result.status === "failure") {
         if (result.message === "Email address is already registered") {
            setEmailTaken(true);
         }
         toast.error(translations("registerError"));
      }
   };

   const password = watch("password", "");

   const nameValidation = register("name", {
      required: translations("nameRequired"),
      minLength: {
         value: 3,
         message: translations("nameMinLength")
      },
      pattern: {
         value: /^[\p{L} .,'-]+(?: [\p{L} .,'-]+)*$/u,
         message: translations("namePattern")
      },
      setValueAs: (value) => value.trim()
   });

   const emailValidation = register("email", {
      required: translations("emailRequired"),
      validate: (value) => validateEmail(value) || translations("emailPattern"),
      setValueAs: (value) => value.trim()
   });

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
                     <CardDescription>
                        {translations("subtitle")}
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                           <div className="grid gap-2">
                              <Label htmlFor="name">
                                 {translations("name")}
                              </Label>
                              <Input
                                 id="name"
                                 type="text"
                                 {...nameValidation}
                                 className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                                 placeholder={translations("namePlaceholder")}
                                 data-test-id="register-name"
                              />
                              {errors.name?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.name.message)}
                                 </p>
                              )}
                           </div>
                           <div className="grid gap-2">
                              <Label htmlFor="email">
                                 {translations("email")}
                              </Label>
                              <Input
                                 id="email"
                                 type="email"
                                 {...emailValidation}
                                 className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                                 placeholder={translations("emailPlaceholder")}
                                 onChange={(e) => {
                                    setEmailTaken(false);
                                    emailValidation.onChange(e);
                                 }}
                                 data-test-id="register-email"
                              />
                              {errors.email?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.email.message)}
                                 </p>
                              )}
                              {emailTaken && (
                                 <p className="text-red-500 text-sm">
                                    {translations("emailAlreadyTaken")}
                                 </p>
                              )}
                           </div>
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
                                          data-test-id="register-password"
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
                                    data-test-id="register-password-confirm"
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
                              data-test-id="register-submit"
                           >
                              {translations("registerButton")}
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
