"use client";

import { ArrowDownAZ, ArrowUpAZ, CalendarArrowDown, CalendarArrowUp, ChevronDown, Tag, User, X } from "lucide-react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import SearchBar from "@/components/SearchBar";

interface DocumentFilterBarProps {
   searchQuery: string;
   onSearchChange: (value: string) => void;
   availableTags: { name: string; color: string }[];
   availableCreators: string[];
   selectedTags: string[];
   selectedCreators: string[];
   sortBy: "name" | "timestamp";
   sortOrder: "asc" | "desc";
   onTagToggle: (tag: string) => void;
   onCreatorToggle: (creator: string) => void;
   onSortChange: (sortBy: "name" | "timestamp", sortOrder: "asc" | "desc") => void;
   searchPlaceholder?: string;
}

/** Derives the Tailwind border class from a Tailwind bg class, e.g. "bg-blue-600" → "border-blue-600". */
function getBorderClass(bgClass: string): string {
   return bgClass.replace("bg-", "border-");
}

export default function DocumentFilterBar({
   searchQuery,
   onSearchChange,
   availableTags,
   availableCreators,
   selectedTags,
   selectedCreators,
   sortBy,
   sortOrder,
   onTagToggle,
   onCreatorToggle,
   onSortChange,
   searchPlaceholder
}: DocumentFilterBarProps) {
   const t = useTranslations("homePage");

   const sortOptions: Array<{
      label: string;
      sortBy: "name" | "timestamp";
      sortOrder: "asc" | "desc";
      icon: React.ReactNode;
   }> = [
      { label: t("sortNewest"), sortBy: "timestamp", sortOrder: "desc", icon: <CalendarArrowDown className="h-4 w-4 mr-2" /> },
      { label: t("sortOldest"), sortBy: "timestamp", sortOrder: "asc", icon: <CalendarArrowUp className="h-4 w-4 mr-2" /> },
      { label: t("sortNameAsc"), sortBy: "name", sortOrder: "asc", icon: <ArrowDownAZ className="h-4 w-4 mr-2" /> },
      { label: t("sortNameDesc"), sortBy: "name", sortOrder: "desc", icon: <ArrowUpAZ className="h-4 w-4 mr-2" /> }
   ];

   const activeSortOption =
      sortOptions.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder) ??
      sortOptions[0];

   return (
      <div className="flex items-start justify-between gap-2 w-full">
         {/* Left group: search + filters + active chips (wraps if needed) */}
         <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <SearchBar
               value={searchQuery}
               onChange={onSearchChange}
               placeholder={searchPlaceholder ?? t("searchPlaceholder")}
            />

            {/* Tag filter */}
            {availableTags.length > 0 && (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" size="sm" className="h-9 gap-1">
                        <Tag className="h-4 w-4" />
                        {t("filterByTag")}
                        {selectedTags.length > 0 && (
                           <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                              {selectedTags.length}
                           </Badge>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                     <DropdownMenuLabel>{t("filterByTag")}</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {availableTags.map((tag) => (
                        <DropdownMenuCheckboxItem
                           key={tag.name}
                           checked={selectedTags.includes(tag.name)}
                           onCheckedChange={() => onTagToggle(tag.name)}
                           onSelect={(e) => e.preventDefault()}
                        >
                           <span
                              className={`inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${tag.color || "bg-blue-600"}`}
                           />
                           {tag.name}
                        </DropdownMenuCheckboxItem>
                     ))}
                  </DropdownMenuContent>
               </DropdownMenu>
            )}

            {/* Creator filter */}
            {availableCreators.length > 0 && (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" size="sm" className="h-9 gap-1">
                        <User className="h-4 w-4" />
                        {t("filterByCreator")}
                        {selectedCreators.length > 0 && (
                           <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                              {selectedCreators.length}
                           </Badge>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                     <DropdownMenuLabel>{t("filterByCreator")}</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {availableCreators.map((creator) => (
                        <DropdownMenuCheckboxItem
                           key={creator}
                           checked={selectedCreators.includes(creator)}
                           onCheckedChange={() => onCreatorToggle(creator)}
                           onSelect={(e) => e.preventDefault()}
                        >
                           {creator}
                        </DropdownMenuCheckboxItem>
                     ))}
                  </DropdownMenuContent>
               </DropdownMenu>
            )}

            {/* Active filter chips */}
            {selectedTags.map((tagName) => {
               const tagData = availableTags.find((t) => t.name === tagName);
               return (
                  <Badge
                     key={tagName}
                     variant="outline"
                     className={`gap-1 h-7 cursor-pointer border-2 ${tagData ? getBorderClass(tagData.color) : ""}`}
                  >
                     {tagData && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tagData.color}`} />
                     )}
                     {tagName}
                     <X className="h-3 w-3 ml-0.5" onClick={() => onTagToggle(tagName)} />
                  </Badge>
               );
            })}
            {selectedCreators.map((creator) => (
               <Badge key={creator} variant="outline" className="gap-1 h-7 cursor-pointer">
                  {creator}
                  <X className="h-3 w-3 ml-0.5" onClick={() => onCreatorToggle(creator)} />
               </Badge>
            ))}
         </div>

         {/* Sort control – always pinned to the far right */}
         <div className="flex-shrink-0">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                     {activeSortOption.icon}
                     {activeSortOption.label}
                     <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("sortBy")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                     <DropdownMenuCheckboxItem
                        key={`${option.sortBy}-${option.sortOrder}`}
                        checked={option.sortBy === sortBy && option.sortOrder === sortOrder}
                        onCheckedChange={() => onSortChange(option.sortBy, option.sortOrder)}
                        onSelect={(e) => e.preventDefault()}
                     >
                        {option.icon}
                        {option.label}
                     </DropdownMenuCheckboxItem>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>
   );
}
