"use client";
import clsx from "clsx";
import {
   Brain,
   Eye,
   FilePlus,
   Folder,
   MessagesSquare,
   Share2,
   Trash2,
   Upload
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const templates = [
   {
      title: "Create a workspace",
      description:
         "Create your own workspace with multiple documents and manage your documents, assisted by AI views",
      icon: <Folder className="w-8 h-8" />,
      color: "bg-blue-500"
   },
   {
      title: "Share a workspace",
      description: "Share your work with other contributors",
      icon: <Share2 className="w-8 h-8" />,
      color: "bg-blue-500"
   },
   {
      title: "Delete a workspace",
      description: "Remove unwanted workspaces to clear out your space",
      icon: <Trash2 className="w-8 h-8" />,
      color: "bg-red-500"
   },
   {
      title: "Create an editable document",
      description:
         "Create an editable document directly in the workspace and edit it using the editor",
      icon: <FilePlus className="w-8 h-8" />,
      color: "bg-blue-500"
   },
   {
      title: "Upload a document",
      description:
         "Upload multiple documents of different kinds(pdf, docx, png, jpg, etc) and leverage document features that TruSpace offers",
      icon: <Upload className="w-8 h-8" />,
      color: "bg-green-500"
   },
   {
      title: "Preview a document",
      description:
         "Preview your documents in document details to see the content of the document and add notes into it using app enhanced features",
      icon: <Eye className="w-8 h-8" />,
      color: "bg-indigo-500"
   },
   {
      title: "Delete a document",
      description:
         "Remove unwanted documents from workspaces to clear out your space",
      icon: <Trash2 className="w-8 h-8" />,
      color: "bg-red-500"
   },
   {
      title: "AI suggestions",
      description:
         "Use generative AI to see the aspects of the document that interest you",
      icon: <Brain className="w-8 h-8" />,
      color: "bg-yellow-500"
   },
   {
      title: "Collaborate",
      description:
         "Discuss document changes with other collaborators using imbedded chat in document details",
      icon: <MessagesSquare className="w-8 h-8" />,
      color: "bg-purple-500"
   }
];

export default function AppFeatures() {
   const translations = useTranslations("general");
   const t = useTranslations("navbar");

   const [flippedCards, setFlippedCards] = useState<number[]>([]);
   const afkTimeout = useRef<NodeJS.Timeout | null>(null);
   const flipInterval = useRef<NodeJS.Timeout | null>(null);
   const isAfk = useRef(false);

   const resetAfkTimer = () => {
      if (afkTimeout.current) clearTimeout(afkTimeout.current);
      if (flipInterval.current) {
         clearInterval(flipInterval.current);
         flipInterval.current = null;
      }

      if (isAfk.current) {
         isAfk.current = false;
         setFlippedCards([]);
      }

      afkTimeout.current = setTimeout(() => {
         isAfk.current = true;
         startRandomFlipping();
      }, 15 * 1000);
   };

   const startRandomFlipping = () => {
      flipInterval.current = setInterval(() => {
         setFlippedCards((prev) => {
            const newSet = new Set(prev);
            const index = Math.floor(Math.random() * templates.length);
            if (newSet.has(index)) {
               newSet.delete(index);
            } else {
               newSet.add(index);
            }
            return Array.from(newSet);
         });
      }, 1500);
   };

   useEffect(() => {
      const handleActivity = () => resetAfkTimer();
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("keydown", handleActivity);
      resetAfkTimer();

      return () => {
         window.removeEventListener("mousemove", handleActivity);
         window.removeEventListener("keydown", handleActivity);
         if (afkTimeout.current) clearTimeout(afkTimeout.current);
         if (flipInterval.current) clearInterval(flipInterval.current);
      };
   }, []);

   return (
      <div className="max-w-6xl mx-auto px-6 mt-12">
         <h2 className="text-2xl font-semibold text-center mb-4">
            {translations("welcomeText")}
         </h2>
         <p className="text-gray-500 mt-1 dark:text-gray-200">
            <span className="font-bold">{translations("appDescription")}</span>{" "}
            {translations("description")}
            <span className="font-bold">{t("addWorkspace")}</span>
         </p>
         <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {templates.map((feature, index) => {
               const isFlipped = flippedCards.includes(index);
               return (
                  <div key={feature.title} className="group perspective">
                     <div
                        className={clsx(
                           "relative w-full h-48 transition-transform duration-500 transform-style-preserve-3d",
                           "group-hover:rotate-y-180",
                           { "rotate-y-180": isFlipped }
                        )}
                     >
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 p-4 border rounded-xl flex flex-col items-center justify-center h-full">
                           <div
                              className={`${feature.color} p-2 rounded-md text-white`}
                           >
                              {feature.icon}
                           </div>
                           <h3 className="mt-2 font-semibold text-center">
                              {feature.title}
                           </h3>
                        </div>
                        <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gray-100 dark:bg-gray-700 p-4 rounded-xl flex flex-col items-center justify-center h-full">
                           <p className="text-sm text-center">
                              {feature.description}
                           </p>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
