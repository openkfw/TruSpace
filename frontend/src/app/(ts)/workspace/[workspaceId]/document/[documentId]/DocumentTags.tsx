"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Bot, Loader2, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from "@/components/ui/select";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { deleteTag, loadTags, postTag } from "@/lib/services";

const colors = [
   { color: "bg-blue-600", borderColor: "border-blue-600", textColor: "text-white" },
   { color: "bg-red-600", borderColor: "border-red-600", textColor: "text-white" },
   { color: "bg-orange-500", borderColor: "border-orange-500", textColor: "text-white" },
   { color: "bg-yellow-500", borderColor: "border-yellow-500", textColor: "text-black" },
   { color: "bg-green-600", borderColor: "border-green-600", textColor: "text-white" },
   { color: "bg-blue-500", borderColor: "border-blue-500", textColor: "text-white" },
   { color: "bg-indigo-700", borderColor: "border-indigo-700", textColor: "text-white" },
   { color: "bg-violet-300", borderColor: "border-violet-300", textColor: "text-black" }
];
export default function DocumentTags({ cid, workspaceOrigin, docId, status }) {
   const [tags, setTags] = useState([]);
   const translations = useTranslations("tags");
   const [isAdding, setIsAdding] = useState(false);
   const [newTagName, setNewTagName] = useState("");
   const [selectedColor, setSelectedColor] = useState(null);
   const [emptyNameError, setEmptyNameError] = useState(false);

   const fetchTags = useCallback(async () => {
      if (!cid) {
         return;
      }
      const data = await loadTags(cid);
      if (data) {
         if (data.length === 0) {
            setTags([]);
         } else {
            setTags([
               ...data.map((tag) => ({
                  id: tag.cid,
                  name: tag.meta.name,
                  color: tag.meta.color,
                  creatorType: tag.meta.creatorType
               }))
            ]);
         }
      } else {
         console.error("Invalid response", data);
         throw new Error("Invalid response");
      }
   }, [cid]);

   useEffect(() => {
      fetchTags();
   }, [cid, fetchTags]);

   useEffect(() => {
      if (status?.status === "completed") {
         fetchTags();
      } else if (status?.status === "failed") {
         toast.error(translations("errorGeneratingAITags"));
      }
   }, [fetchTags, status?.status, translations]);

   const updateTagName = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagName(e.target.value);
      if (emptyNameError) {
         setEmptyNameError(false);
      }
   };

   const addTag = async () => {
      if (newTagName === "") {
         setEmptyNameError(true);
         return;
      }
      const formData = {
         name: newTagName,
         color: selectedColor,
         workspaceOrigin: workspaceOrigin,
         docId
      };
      const data = await postTag(formData, cid);
      setNewTagName("");
      setSelectedColor(null);
      setIsAdding(false);
      if (data) {
         setTimeout(fetchTags, 1000);
      } else {
         console.error("Invalid response", data);
         throw new Error("Invalid response");
      }
   };

   const removeTag = async (tagId) => {
      const data = await deleteTag(tagId);
      if (data) {
         setTags(tags.filter((tag) => tag.id !== tagId));
      } else {
         console.error("Invalid response", data);
         throw new Error("Invalid response");
      }
   };

   const getBadgeBorderColor = (color) => {
      const found = colors.find((c) => c.color === color);
      if (found) {
         return found.borderColor;
      }

      return colors[0].borderColor;
   }

   const getBadgeTextColor = (color) => {
      const found = colors.find((c) => c.color === color);
      if (found) {
         return found.textColor;
      }

      return colors[0].textColor;
   };

   const isGenerating =
      status?.status === "processing" || status?.status === "pending";
   const isPending = status?.status === "pending";

   return (
      <div className="flex flex-col">
         <div className="h-full">
            <div className="space-y-4 mb-2">
               {isGenerating ? (
                  <div className="flex flex-col items-center justify-center">
                     <Loader2 className="animate-spin h-10 w-10 mb-2" />
                     {isPending
                        ? `${translations("generatingAITagsQueue1")}${status?.jobsBefore}${translations("generatingAITagsQueue2")}`
                        : translations("generatingAITags")}
                  </div>
               ) : null}
               <div className="flex items-center flex-wrap">
                  {!isGenerating &&
                     tags.map((tag) => (
                        <Badge
                           key={tag.id}
                           variant="default"
                           className={`mr-1 pr-1 mt-2 min-h-[30px] bg-white bg-opacity-25 border-2 ${getBadgeBorderColor(tag.color)} text-black dark:bg-gray-700 dark:bg-opacity-75 dark:text-white hover:bg-white hover:bg-opacity-75 dark:hover:bg-gray-700 dark:hover:bg-opacity-100`}
                        >
                           {tag?.name.replace(/"/g, "")}
                           {tag?.creatorType === "ai" && (
                              <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger>
                                       <Bot className="ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                       {translations("aiTag")}
                                    </TooltipContent>
                                 </Tooltip>
                              </TooltipProvider>
                           )}

                           <Button
                              variant="ghost"
                              className="h-4 px-1.5 hover:text-gray-500 hover:bg-transparent"
                              onClick={() => removeTag(tag.id)}
                           >
                              <X />
                           </Button>
                        </Badge>
                     ))}
                  {!isAdding && !isGenerating && (
                     <Button
                        className="h-6 mt-2 min-h-[30px] bg-white bg-opacity-25 border-2 border-gray-400 text-gray-400 dark:bg-gray-700 dark:bg-opacity-75 dark:text-white hover:bg-white hover:bg-opacity-75 dark:hover:bg-gray-700 dark:hover:bg-opacity-100"
                        onClick={() => setIsAdding(true)}
                     >
                        <Plus />
                     </Button>
                  )}
               </div>
               {isAdding && (
                  <div>
                     <div className="inline-flex mb-2 mr-2">
                        <div className="flex flex-col">
                           <Input
                              type="text"
                              placeholder={translations("tagName")}
                              onChange={updateTagName}
                              className={`w-56 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white ${emptyNameError ? "border-red-500" : ""}`}
                           />
                           {emptyNameError && (
                              <p className="text-red-500 text-sm mt-1">
                                 {translations("emptyTagErrorText")}
                              </p>
                           )}
                        </div>
                        <Select onValueChange={setSelectedColor}>
                           <SelectTrigger className="w-15 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="w-15">
                              {[...colors].map((color) => (
                                 <SelectItem
                                    key={color.color}
                                    value={color.color}
                                 >
                                    <Badge
                                       variant="default"
                                       className={`mr-1 ${color.color} ${color.textColor} hover:${color.color}`}
                                    >
                                       &nbsp;
                                    </Badge>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <Button variant="secondary" onClick={addTag}>
                        {translations("addTag")}
                     </Button>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
