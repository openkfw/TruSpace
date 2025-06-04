"use client";
import { formatDate } from "@/app/helper/formatDate";
import Editor from "@/components/tiptap-editor/Editor";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createPerspective, usePerspectivesStatus } from "@/lib/services";
import parse from "html-react-parser";
import { Bot, Info, Loader2, Plus } from "lucide-react";
import { marked } from "marked";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import TurndownService from "turndown";
import { usePerspectives } from "../../../../../../lib/services";

const turndownService = new TurndownService();

export default function DocumentPerspectives({ cid, docId, workspaceOrigin }) {
   const translations = useTranslations("perspectives");
   const [currentPerspective, setCurrentPerspective] = useState(null);
   const [html, setHtml] = useState(translations("noPerspective"));
   const [promptModelDialogOpen, setPromptModelDialogOpen] = useState(false);
   const [newPerspectiveDialogOpen, setNewPerspectiveDialogOpen] =
      useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [perspectiveType, setPerspectiveType] = useState("");
   const [perspectiveText, setPerspectiveText] = useState("");
   const [editorHasError, setEditorHasError] = useState(false);
   const { perspectives, mutate } = usePerspectives(cid);
   const {
      status: perspectivesStatus,
      error: prespectivesStatusError,
      refresh: perspectivesStatusRefresh
   } = usePerspectivesStatus(cid);

   const uploadButtonTitle = translations("create");

   function onChangePerspectiveText(editor) {
      const markdown = turndownService.turndown(editor.getHTML());
      setPerspectiveText(markdown);
      setEditorHasError(false);
   }

   function changeCurrentPerspective(perspectiveId) {
      const perspective = perspectives.find(
         (perspective) => perspective.id === perspectiveId
      );
      if (perspective) {
         setCurrentPerspective(perspective);
      }
   }

   const getHtml = useCallback(async () => {
      setHtml(
         await marked.parse(
            currentPerspective?.text || translations("noPerspective")
         )
      );
   }, [currentPerspective, translations]);

   useEffect(() => {
      getHtml();
   }, [getHtml]);

   const isGenerating =
      perspectivesStatus?.status === "processing" ||
      perspectivesStatus?.status === "pending";
   const isPending = perspectivesStatus?.status === "pending";

   useEffect(() => {
      if (perspectivesStatus?.status === "failed") {
         toast.error(translations("perspectiveGenerationError"));
      }
   }, [perspectivesStatus, translations]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!perspectiveText.trim().length) {
         setEditorHasError(true);
      } else {
         setIsCreating(true);
         const formData = new FormData();
         formData.append("perspectiveType", perspectiveType);
         formData.append("perspectiveText", perspectiveText);
         formData.append("workspaceOrigin", workspaceOrigin);
         formData.append("docId", docId);
         formData.append("cid", cid);

         try {
            await createPerspective(formData, null);
            setNewPerspectiveDialogOpen(false);
            setPerspectiveType("");
            setPerspectiveText("");
            setEditorHasError(false);
         } catch (err) {
            console.error(err);
         } finally {
            setIsCreating(false);
            setTimeout(() => mutate(), 1000);
         }
      }
   };

   useEffect(() => {
      if (perspectivesStatus?.status === "completed") {
         mutate();
      }
   }, [mutate, perspectivesStatus]);

   return (
      <>
         <Dialog
            open={promptModelDialogOpen}
            onOpenChange={(open) => setPromptModelDialogOpen(open)}
         >
            <DialogContent
               className="sm:max-w-lg"
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>
                     {translations("promptModelDialogTitle")}
                  </DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <div>
                  <p>
                     <strong>{translations("info")}:</strong>{" "}
                     {translations("aiNote")}
                  </p>
                  <p>
                     <strong>{translations("prompt")}:</strong>{" "}
                  </p>
                  <blockquote className="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
                     <p className="text-l italic font-medium leading-relaxed text-gray-900 dark:text-white">
                        {currentPerspective?.prompt}
                     </p>
                  </blockquote>
                  <p>
                     <strong>{translations("model")}:</strong>{" "}
                     {currentPerspective?.model}
                  </p>
                  <p>
                     <strong>{translations("created")}:</strong>{" "}
                     {formatDate(currentPerspective?.timestamp)}
                  </p>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog
            open={newPerspectiveDialogOpen}
            onOpenChange={(open) => setNewPerspectiveDialogOpen(open)}
         >
            <DialogContent
               className="sm:max-w-2xl overflow-auto max-h-screen"
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>
                     {translations("createPerspectiveTitle")}
                  </DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                     <div>
                        <Label htmlFor="author">
                           {translations("perspectiveName")}
                        </Label>
                        <Input
                           className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                           id="perspectiveType"
                           type="text"
                           value={perspectiveType}
                           onChange={(e) => setPerspectiveType(e.target.value)}
                           placeholder={translations(
                              "perspectiveNamePlaceholder"
                           )}
                           required
                        />
                     </div>
                     <div className="flex flex-col">
                        <Label htmlFor="author">
                           {translations("perspectiveText")}
                        </Label>
                        <Editor
                           onChange={onChangePerspectiveText}
                           isRequired={true}
                           hasError={editorHasError}
                           errorMessage={translations("editorEmptyError")}
                           stickyToolbarTopMargin="[-30px]"
                           allowedButtons={{
                              headings: true,
                              bold: true,
                              italic: true,
                              underline: true,
                              strike: true,
                              link: true,
                              bulletList: true,
                              orderedList: true,
                              blockquote: true,
                              history: true,
                              image: false
                           }}
                        />
                     </div>
                  </div>
                  <DialogFooter className="flex flex-row justify-between space-x-4">
                     <Button
                        className="w-1/2 sm:w-auto"
                        type="button"
                        variant="destructive"
                        onClick={() => {
                           setNewPerspectiveDialogOpen(false);
                           setEditorHasError(false);
                        }}
                     >
                        {translations("cancel")}
                     </Button>
                     <Button
                        disabled={isCreating}
                        type="submit"
                        className="w-1/2 sm:w-auto"
                     >
                        {isCreating ? (
                           <>
                              <Loader2 className="animate-spin" />
                              {translations("creating")}
                           </>
                        ) : (
                           uploadButtonTitle
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

         <div className="flex flex-col">
            <div className="h-full">
               <div className="space-y-4">
                  {isGenerating ? (
                     <div className="flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin h-10 w-10 mb-2" />
                        {isPending
                           ? `${translations("generatingAIPerspectivesQueue1")}${perspectivesStatus?.jobsBefore}${translations("generatingAIPerspectivesQueue2")}`
                           : translations("generatingAIPerspectives")}
                     </div>
                  ) : null}
                  <div className="flex flew-row items-center justify-between">
                     <Button
                        variant="outline"
                        onClick={() => {
                           setNewPerspectiveDialogOpen(true);
                        }}
                        className="mr-4"
                     >
                        <Plus /> {translations("addYourPerspective")}
                     </Button>

                     <Select
                        onValueChange={changeCurrentPerspective}
                        disabled={
                           (isGenerating && perspectives?.length < 1) ||
                           !perspectives ||
                           perspectives.length < 1
                        }
                     >
                        <SelectTrigger className="w-64 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
                           <SelectValue
                              placeholder={translations("selectPerspective")}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {perspectives?.map((perspective) => (
                              <SelectItem
                                 key={`${perspective.id}-${perspective.timestamp}`}
                                 value={perspective.id}
                              >
                                 <div className="flex">
                                    {perspective.name}
                                    {perspective?.creatorType === "user" &&
                                       ` (${perspective.creator})`}
                                    {perspective?.creatorType === "ai" && (
                                       <TooltipProvider>
                                          <Tooltip>
                                             <TooltipTrigger>
                                                <Bot className="ml-2" />
                                             </TooltipTrigger>
                                             <TooltipContent>
                                                {translations("aiPerspective")}
                                             </TooltipContent>
                                          </Tooltip>
                                       </TooltipProvider>
                                    )}
                                 </div>
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="text-right"></div>

                  {parse(html as string)}

                  {currentPerspective?.creatorType === "user" && (
                     <div className="flex items-center flex-wrap">
                        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-800 rounded p-2 flex items-center text-sm">
                           <Info className="text-blue-700 dark:text-blue-300" />
                           <span className="text-blue-700 dark:text-blue-300 text-xs ml-2 mt-2">
                              {translations("created")}:{" "}
                              {formatDate(
                                 new Date(currentPerspective?.timestamp)
                              )}{" "}
                              {translations("by")}:{" "}
                              {currentPerspective?.creator}
                           </span>
                        </div>
                     </div>
                  )}

                  {currentPerspective?.creatorType === "ai" && (
                     <div className="flex items-center flex-wrap">
                        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-800 rounded p-2 flex items-center text-sm">
                           <Info className="text-blue-700 dark:text-blue-300" />
                           <span className="text-blue-700 dark:text-blue-300 text-xs ml-2 mt-2">
                              {translations("aiDisclaimer")}{" "}
                              <Button
                                 variant="link"
                                 className="text-xs p-0 text-blue-700 dark:text-blue-300 underline decoration-dotted hover:decoration-solid"
                                 onClick={() => setPromptModelDialogOpen(true)}
                              >
                                 {translations("morePromptInfo")}
                              </Button>
                           </span>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </>
   );
}
