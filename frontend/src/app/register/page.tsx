"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle
} from "@/components/ui/card";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Popover,
   PopoverContent,
   PopoverTrigger
} from "@/components/ui/popover";
import { getUserLocale } from "@/i18n/service";
import { registerUser } from "@/lib/services";
import { validateEmail } from "@/lib/validateEmail";

export default function Register() {
   const translations = useTranslations("register");
   const router = useRouter();
   const locale = useLocale();
   const {
      register,
      handleSubmit,
      watch,
      formState: { errors }
   } = useForm();

   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [emailTaken, setEmailTaken] = useState(false);
   const [showTerms, setShowTerms] = useState(false);
   const [termsContent, setTermsContent] = useState("");

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
      const locale = await getUserLocale();
      const enhancedData = {
         ...data,
         lang: locale,
         confirmationLink: `${window.location.origin}/confirm`
      };
      const result = await registerUser(enhancedData);
      if (result.status === "success") {
         setEmailTaken(false);
         if (result.message === "email sent") {
            toast.success(translations("emailSent"));
         } else {
            toast.success(translations("registerSuccess"));
         }
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
   const terms = watch("terms", false);

   const nameValidation = register("name", {
      required: translations("nameRequired"),
      minLength: {
         value: 3,
         message: translations("nameMinLength")
      },
      pattern: {
         value: /^\p{L}+([ .,'-]\p{L}+)*$/u,
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

   useEffect(() => {
      const fetchTerms = async () => {
         const termsFile = `/terms/terms-${locale}.md`;
         try {
            const response = await fetch(termsFile);
            if (!response.ok) {
               throw new Error("Network response was not ok");
            }
            const markdown = await response.text();
            setTermsContent(markdown);
         } catch (error) {
            console.error("Failed to fetch terms:", error);
            setTermsContent(translations("termsLoadError"));
         }
      };

      fetchTerms();
   }, [locale]);

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

                           <div className="flex flex-col gap-1.5 border border-gray-200 dark:border-gray-700 p-3 rounded-md">
                              <div className="flex items-start gap-3">
                                 <Input
                                    type="checkbox"
                                    id="terms"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 mt-0.5"
                                    {...register("terms", {
                                       required: translations("termsRequired")
                                    })}
                                 />
                                 <div className="grid gap-1.5 leading-none">
                                    <Label
                                       htmlFor="terms"
                                       className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                       {translations("termsAccept")}{" "}
                                       <Button
                                          type="button"
                                          variant="link"
                                          className="text-blue-600 hover:underline p-0 h-auto"
                                          onClick={() => setShowTerms(true)}
                                       >
                                          {translations("termsLink")}
                                       </Button>
                                    </Label>
                                 </div>
                              </div>
                              {errors.terms?.message && (
                                 <p className="text-red-500 text-sm">
                                    {String(errors.terms.message)}
                                 </p>
                              )}
                           </div>

                           <Button
                              type="submit"
                              className="w-full"
                              data-test-id="register-submit"
                              disabled={!terms}
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
         <Dialog open={showTerms} onOpenChange={setShowTerms}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>
                     {translations("termsAndConditions")}
                  </DialogTitle>
               </DialogHeader>
               <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{termsContent}</ReactMarkdown>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
}
