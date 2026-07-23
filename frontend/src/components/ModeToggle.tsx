"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Moon, Sun } from "lucide-react";

import { Button } from "./ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "./ui/dropdown-menu";

export function ModeToggle() {
   const { setTheme } = useTheme();
   const translations = useTranslations("theme");

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button
               variant="ghost"
               size="icon"
               className="rounded-full"
               data-test-id="theme-toggle-button"
            >
               <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
               <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
               <span className="sr-only">{translations("toggle")}</span>
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            <DropdownMenuItem
               onClick={() => setTheme("light")}
               data-test-id="theme-light-option"
            >
               {translations("light")}
            </DropdownMenuItem>
            <DropdownMenuItem
               onClick={() => setTheme("dark")}
               data-test-id="theme-dark-option"
            >
               {translations("dark")}
            </DropdownMenuItem>
            <DropdownMenuItem
               onClick={() => setTheme("system")}
               data-test-id="theme-system-option"
            >
               {translations("system")}
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
