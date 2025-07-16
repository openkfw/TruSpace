"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import parse from "html-react-parser";
import {
   Bot,
   CircleHelp,
   Info,
   Loader2,
   MessageCircleQuestion,
   Plus
} from "lucide-react";
import { marked } from "marked";
import TurndownService from "turndown";

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
import { formatDate } from "@/lib/formatDate";
import {
   createPerspective,
   customPerspective,
   usePerspectives,
   usePerspectivesStatus
} from "@/lib/services";
import { isTouchDevice } from "@/lib/utils";

import { Checkbox } from "../../../../../../components/ui/checkbox";

const turndownService = new TurndownService();

export default function DocumentPerspectives({ cid, docId, workspaceOrigin }) {
   const t = useTranslations("perspectives");
   const [currentPerspective, setCurrentPerspective] = useState(null);
   const [html, setHtml] = useState(t("noPerspective"));
   const [promptModelDialogOpen, setPromptModelDialogOpen] = useState(false);
   const [newPerspectiveDialogOpen, setNewPerspectiveDialogOpen] =
      useState(false);
   const [customPromptDialogOpen, setCustomPromptDialogOpen] = useState(false);
   const [customPromptTooltipOpen, setCustomPromptTooltipOpen] =
      useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [perspectiveType, setPerspectiveType] = useState("");
   const [perspectiveText, setPerspectiveText] = useState("");
   const [promptTitle, setPromptTitle] = useState("");
   const [promptText, setPromptText] = useState("");
   const [editorHasError, setEditorHasError] = useState(false);
   const [savePromptForWorkspace, setSavePromptForWorkspace] = useState(false);
   const { perspectives, mutate } = usePerspectives(cid);
   const { status: perspectivesStatus } = usePerspectivesStatus(cid);
   const buttonRef = useRef(null);
   const promptButtonRef = useRef(null);
   const selectRef = useRef(null);
   const [isWrapped, setIsWrapped] = useState(false);
   const [isPromptWrapped, setIsPromptWrapped] = useState(false);

   const [selectedPerspective, setSelectedPerspective] = useState<
      string | undefined
   >(undefined);

   useEffect(() => {
      const checkSelectWrap = () => {
         if (buttonRef.current && selectRef.current) {
            const buttonTopPosition =
               buttonRef.current.getBoundingClientRect().top;
            const selectTopPosition =
               selectRef.current.getBoundingClientRect().top;
            setIsWrapped(selectTopPosition > buttonTopPosition + 5);
         }
      };

      const checkPromptWrap = () => {
         if (buttonRef.current && promptButtonRef.current) {
            const buttonTopPosition =
               buttonRef.current.getBoundingClientRect().top;
            const promptTopPosition =
               promptButtonRef.current.getBoundingClientRect().top;
            setIsPromptWrapped(promptTopPosition > buttonTopPosition + 5);
         }
      };

      checkSelectWrap();
      checkPromptWrap();
      window.addEventListener("resize", checkSelectWrap);
      window.addEventListener("resize", checkPromptWrap);

      return () => {
         window.removeEventListener("resize", checkSelectWrap);
         window.removeEventListener("resize", checkPromptWrap);
      };
   }, []);

   const uploadButtonTitle = t("create");

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
         await marked.parse(currentPerspective?.text || t("noPerspective"))
      );
   }, [currentPerspective, t]);

   useEffect(() => {
      getHtml();
   }, [getHtml]);

   const isGenerating =
      perspectivesStatus?.status === "processing" ||
      perspectivesStatus?.status === "pending";
   const isPending = perspectivesStatus?.status === "pending";

   useEffect(() => {
      if (perspectivesStatus?.status === "failed") {
         toast.error(t("perspectiveGenerationError"));
      }
   }, [perspectivesStatus, t]);

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

   // TODO check each line
   const handleCustomSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!promptTitle.trim().length || !promptText.trim().length) {
         console.error("prompt title or text missing");
         setEditorHasError(true); //
      } else {
         setIsCreating(true);
         const formData = new FormData();
         formData.append("promptTitle", promptTitle);
         formData.append("prompt", promptText);
         formData.append("workspaceOrigin", workspaceOrigin);
         formData.append("docId", docId);
         formData.append("cid", cid);

         try {
            await customPerspective(formData, null);
            setCustomPromptDialogOpen(false);
            setPromptTitle("");
            setPromptText("");
            setEditorHasError(false); //
         } catch (err) {
            console.error(err);
         } finally {
            setIsCreating(false);
            setTimeout(() => mutate(), 1000);
         }
      }
   };

   const handleTooltipClick = () => {
      if (isTouchDevice()) {
         setCustomPromptTooltipOpen((prev) => !prev);
      }
   };

   useEffect(() => {
      if (perspectivesStatus?.status === "completed") {
         mutate();
      }
   }, [mutate, perspectivesStatus]);

   useEffect(() => {
      if (
         !isGenerating &&
         perspectives &&
         perspectives.length > 0 &&
         selectedPerspective == null
      ) {
         const first = perspectives[0].id;
         setSelectedPerspective(first);
         changeCurrentPerspective(first);
      }
   }, [isGenerating, perspectives, selectedPerspective]);

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
                  <DialogTitle>{t("promptModelDialogTitle")}</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <div>
                  <p>
                     <strong>{t("info")}:</strong> {t("aiNote")}
                  </p>
                  <p>
                     <strong>{t("prompt")}:</strong>{" "}
                  </p>
                  <blockquote className="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
                     <p className="text-l italic font-medium leading-relaxed text-gray-900 dark:text-white">
                        {currentPerspective?.prompt}
                     </p>
                  </blockquote>
                  <p>
                     <strong>{t("model")}:</strong> {currentPerspective?.model}
                  </p>
                  <p>
                     <strong>{t("created")}:</strong>{" "}
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
                  <DialogTitle>{t("createPerspectiveTitle")}</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                     <div>
                        <Label htmlFor="author">{t("perspectiveName")}</Label>
                        <Input
                           className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                           id="perspectiveType"
                           type="text"
                           value={perspectiveType}
                           onChange={(e) => setPerspectiveType(e.target.value)}
                           placeholder={t("perspectiveNamePlaceholder")}
                           required
                        />
                     </div>
                     <div className="flex flex-col">
                        <Label htmlFor="author">{t("perspectiveText")}</Label>
                        <Editor
                           onChange={onChangePerspectiveText}
                           isRequired
                           hasError={editorHasError}
                           errorMessage={t("editorEmptyError")}
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
                        {t("cancel")}
                     </Button>
                     <Button
                        disabled={isCreating}
                        type="submit"
                        className="w-1/2 sm:w-auto"
                     >
                        {isCreating ? (
                           <>
                              <Loader2 className="animate-spin" />
                              {t("creating")}
                           </>
                        ) : (
                           uploadButtonTitle
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

         <Dialog
            open={customPromptDialogOpen}
            onOpenChange={(open) => setCustomPromptDialogOpen(open)}
         >
            <DialogContent
               className="sm:max-w-2xl overflow-auto max-h-screen"
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>{t("askCustomPrompt")}</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <form onSubmit={handleCustomSubmit}>
                  <div className="grid gap-4 py-4">
                     <div>
                        <Label htmlFor="author">{t("promptTitle")}</Label>
                        <Input
                           className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                           id="promptTitle"
                           type="text"
                           value={promptTitle}
                           onChange={(e) => setPromptTitle(e.target.value)}
                           placeholder={t("promptTitlePlaceHolder")}
                           required
                        />
                     </div>
                     <div>
                        <Label htmlFor="author">{t("prompt")}</Label>
                        <Input
                           className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                           id="perspectiveType"
                           type="text"
                           value={promptText}
                           onChange={(e) => setPromptText(e.target.value)}
                           placeholder={t("promptBodyPlaceholder")}
                           required
                        />
                     </div>
                     <div className="flex flex-row items-center mt-4">
                        <Checkbox
                           checked={savePromptForWorkspace}
                           onCheckedChange={() =>
                              setSavePromptForWorkspace(!savePromptForWorkspace)
                           }
                           className="mr-2"
                        />
                        <span className="mr-2">{t("savePrompt")}</span>
                        <TooltipProvider>
                           <Tooltip
                              open={customPromptTooltipOpen}
                              onOpenChange={setCustomPromptTooltipOpen}
                           >
                              <TooltipTrigger asChild>
                                 <CircleHelp
                                    onClick={handleTooltipClick}
                                    className="text-muted-foreground h-5 w-5 cursor-pointer hover:text-primary transition-colors"
                                 />
                              </TooltipTrigger>
                              <TooltipContent
                                 className="text-sm shadow-md max-w-xs p-3 rounded-md"
                                 sideOffset={8}
                              >
                                 {t("saveCustomPromptHint")}
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     </div>
                  </div>
                  <DialogFooter className="flex flex-row justify-between space-x-4">
                     <Button
                        className="w-1/2 sm:w-auto"
                        type="button"
                        variant="destructive"
                        onClick={() => {
                           setCustomPromptDialogOpen(false);
                           setEditorHasError(false); //
                        }}
                     >
                        {t("cancel")}
                     </Button>
                     <Button
                        disabled={isCreating}
                        type="submit"
                        className="w-1/2 sm:w-auto"
                     >
                        {isCreating ? (
                           <>
                              <Loader2 className="animate-spin" />
                              {t("creating")}
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
                           ? `${t("generatingAIPerspectivesQueue1")}${perspectivesStatus?.jobsBefore}${t("generatingAIPerspectivesQueue2")}`
                           : t("generatingAIPerspectives")}
                     </div>
                  ) : null}
                  <div className="flex flew-row items-center justify-between flex-wrap">
                     <Button
                        ref={buttonRef}
                        variant="outline"
                        onClick={() => {
                           setNewPerspectiveDialogOpen(true);
                        }}
                        className="mr-4"
                     >
                        <Plus /> {t("addYourPerspective")}
                     </Button>

                     <div className={isWrapped ? "mt-2" : ""}>
                        <Button
                           ref={promptButtonRef}
                           variant="outline"
                           onClick={() => {
                              setCustomPromptDialogOpen(true);
                           }}
                           className={`mr-4 ${isPromptWrapped ? "mt-2" : ""}`}
                        >
                           <MessageCircleQuestion /> {t("askCustomPrompt")}
                        </Button>
                        <Button
                           ref={promptButtonRef}
                           variant="outline"
                           onClick={() => {
                              setPromptText(currentPerspective?.text || "");
                              setCustomPromptDialogOpen(true);
                           }}
                           className={`mr-4 ${isPromptWrapped ? "mt-2" : ""}`}
                        >
                           <MessageCircleQuestion />{" "}
                           {t("generateNewPerspectiveFromPrevious")}
                        </Button>
                     </div>
                     <div ref={selectRef} className={isWrapped ? "mt-2" : ""}>
                        <Select
                           value={selectedPerspective}
                           onValueChange={(value) => {
                              setSelectedPerspective(value);
                              changeCurrentPerspective(value);
                           }}
                           disabled={
                              (isGenerating && perspectives?.length < 1) ||
                              !perspectives ||
                              perspectives.length < 1
                           }
                        >
                           <SelectTrigger className="bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
                              <SelectValue
                                 placeholder={t("selectPerspective")}
                              />
                           </SelectTrigger>
                           <SelectContent>
                              {perspectives
                                 ?.sort(
                                    (
                                       a: { name: string },
                                       b: { name: string }
                                    ) => a.name.localeCompare(b.name)
                                 )
                                 .map((perspective) => (
                                    <SelectItem
                                       key={`${perspective.id}-${perspective.timestamp}`}
                                       value={perspective.id}
                                    >
                                       <div className="flex items-center mr-1">
                                          {perspective.name}
                                          {perspective?.creatorType ===
                                             "user" &&
                                             ` (${perspective.creator})`}
                                          {perspective?.creatorType ===
                                             "ai" && (
                                             <TooltipProvider>
                                                <Tooltip>
                                                   <TooltipTrigger>
                                                      <Bot className="ml-2" />
                                                   </TooltipTrigger>
                                                   <TooltipContent>
                                                      {t("aiPerspective")}
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
                  </div>
                  <div className="text-right" />

                  {parse(html as string)}

                  {currentPerspective?.creatorType === "user" && (
                     <div className="flex items-center flex-wrap">
                        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-800 rounded p-2 flex items-center text-sm">
                           <Info className="text-blue-700 dark:text-blue-300" />
                           <span className="text-blue-700 dark:text-blue-300 text-xs ml-2 mt-2">
                              {t("created")}:{" "}
                              {formatDate(
                                 new Date(currentPerspective?.timestamp)
                              )}{" "}
                              {t("by")}: {currentPerspective?.creator}
                           </span>
                        </div>
                     </div>
                  )}

                  {currentPerspective?.creatorType === "ai" && (
                     <div className="flex items-center flex-wrap">
                        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-800 rounded p-2 flex items-center text-sm">
                           <Info className="text-blue-700 dark:text-blue-300" />
                           <span className="text-blue-700 dark:text-blue-300 text-xs ml-2 mt-2">
                              {t("aiDisclaimer")}{" "}
                              <Button
                                 variant="link"
                                 className="text-xs p-0 text-blue-700 dark:text-blue-300 underline decoration-dotted hover:decoration-solid"
                                 onClick={() => setPromptModelDialogOpen(true)}
                              >
                                 {t("morePromptInfo")}
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
