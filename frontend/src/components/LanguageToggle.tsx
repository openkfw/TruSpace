"use client";

import { useLocale, useTranslations } from "next-intl";

import { setUserLocale } from "@/i18n/service";
import { locales } from "@/lib/constants";

import { Button } from "./ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "./ui/dropdown-menu";

export function LanguageToggle() {
   const translations = useTranslations("general");
   const locale = useLocale();

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
               <span>{translations(locale)}</span>
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            {locales.map((loc) => (
               <DropdownMenuItem key={loc} onClick={() => setUserLocale(loc)}>
                  {translations(loc)}
               </DropdownMenuItem>
            ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
