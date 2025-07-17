"use client";
import React, { useState } from "react";

import { useTranslations } from "next-intl";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

interface AiSettingsDialogProps {
   open?: boolean;
   setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const PROVIDERS = [
   { label: "OpenAI", value: "openai" },
   { label: "Qwen", value: "qwen" },
   { label: "Mistral", value: "mistral" }
];

const MODELS = [
   { label: "o4-mini", value: "o4-mini", provider: "openai" },
   { label: "GPT4-1-mini", value: "gpt4-1-mini", provider: "openai" },
   { label: "Custom...", value: "custom", provider: "openai" },
   { label: "qwen2.5-72b", value: "qwen2.5-72b", provider: "qwen" },
   { label: "gwen-plus", value: "gwen-plus", provider: "qwen" },
   { label: "Custom...", value: "custom", provider: "qwen" },
   { label: "mistral nemo", value: "mistral-nemo", provider: "mistral" },
   {
      label: "mistral small 3.1",
      value: "mistral-small-3.1",
      provider: "mistral"
   },
   { label: "Custom...", value: "custom", provider: "mistral" }
];

export default function AiSettingsDialog({
   open,
   setOpen
}: AiSettingsDialogProps) {
   const [isCreating, setIsCreating] = useState(false);
   const { workspace } = useWorkspaceContext();
   const translations = useTranslations("homePage");
   const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].value);
   const [selectedModel, setSelectedModel] = useState(null);
   const [customModelName, setCustomModelName] = useState("");
   const [apiKey, setAPIKey] = useState("");

   const filteredModels = MODELS.filter((m) => m.provider === selectedProvider);

   const handleSubmit = async (e: React.FormEvent) => {
      //   e.preventDefault();
      //   setIsCreating(true);
      //   const formData = new FormData();
      //   formData.append("workspace", workspace?.uuid);
      //   const blob = new Blob([""], { type: "application/json" });
      //   formData.append("file", blob, `${documentName}.editableFile`);
      //   try {
      //      await documentUpload(formData, null, translations("uploadError"));
      //      await fetchDocuments(workspace?.uuid);
      //      setDocumentName("");
      //      setOpen(false);
      //   } catch (err) {
      //      console.error(err);
      //      toast.error(documentTranslations("documentCreateError"));
      //   } finally {
      //      setIsCreating(false);
      //      toast.success(documentTranslations("documentCreated"));
      //   }
   };

   return (
      <>
         <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogContent
               className="sm:max-w-lg"
               onEscapeKeyDown={(e) => e.preventDefault()}
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>Change AI Settings</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                     <div className="flex gap-6 items-center p-6">
                        <DropdownMenu.Root>
                           <DropdownMenu.Trigger asChild>
                              <button className="border rounded-xl px-4 py-2 min-w-[120px] bg-white shadow">
                                 {
                                    PROVIDERS.find(
                                       (p) => p.value === selectedProvider
                                    )?.label
                                 }
                              </button>
                           </DropdownMenu.Trigger>
                           <DropdownMenu.Content
                              sideOffset={8}
                              className="bg-white shadow rounded-xl"
                           >
                              {PROVIDERS.map((provider) => (
                                 <DropdownMenu.Item
                                    key={provider.value}
                                    onSelect={() => {
                                       setSelectedProvider(provider.value);
                                       setSelectedModel(null);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                 >
                                    {provider.label}
                                 </DropdownMenu.Item>
                              ))}
                           </DropdownMenu.Content>
                        </DropdownMenu.Root>

                        <DropdownMenu.Root>
                           <DropdownMenu.Trigger asChild>
                              <button
                                 className={`border rounded-xl px-4 py-2 min-w-[180px] bg-white shadow
      ${!selectedModel ? "border-red-500" : "border-gray-300"}`}
                              >
                                 {selectedModel
                                    ? filteredModels.find(
                                         (m) => m.value === selectedModel
                                      )?.label
                                    : "Select model"}
                              </button>
                           </DropdownMenu.Trigger>
                           <DropdownMenu.Content
                              sideOffset={8}
                              className="bg-white shadow rounded-xl"
                           >
                              {filteredModels.map((model) => (
                                 <DropdownMenu.Item
                                    key={model.value}
                                    onSelect={() =>
                                       setSelectedModel(model.value)
                                    }
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                 >
                                    {model.label}
                                 </DropdownMenu.Item>
                              ))}
                           </DropdownMenu.Content>
                        </DropdownMenu.Root>
                     </div>
                     {selectedModel === "custom" && (
                        <input
                           type="text"
                           className={`mt-2 border rounded-xl px-3 py-2 min-w-[180px] 
      ${selectedModel === "custom" && !customModelName.trim() ? "border-red-500" : "border-blue-400"}`}
                           placeholder="Enter custom model name"
                           value={customModelName}
                           onChange={(e) => setCustomModelName(e.target.value)}
                           required
                        />
                     )}
                     <input
                        type="text"
                        className={`mt-2 border rounded-xl px-3 py-2 min-w-[180px] 
      ${!apiKey.trim() ? "border-red-500" : "border-blue-400"}`}
                        placeholder="Enter your API Key"
                        value={apiKey}
                        onChange={(e) => setAPIKey(e.target.value)}
                        required
                     />
                  </div>
                  <DialogFooter className="flex flex-row justify-between space-x-4">
                     <Button
                        className="w-1/2 sm:w-auto"
                        type="button"
                        variant="destructive"
                        onClick={() => setOpen(false)}
                     >
                        {translations("cancel")}
                     </Button>
                     <Button
                        disabled={
                           isCreating ||
                           !selectedModel ||
                           (selectedModel === "custom" &&
                              !customModelName.trim()) ||
                           !apiKey.trim()
                        }
                        type="submit"
                        className="w-1/2 sm:w-auto"
                     >
                        {isCreating ? (
                           <>
                              <Loader2 className="animate-spin" />
                              {"Saving..."}
                           </>
                        ) : (
                           "Save"
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </>
   );
}
