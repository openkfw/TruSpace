"use client";

import React, { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";

interface IPFSLoaderProps {
   onComplete?: () => void;
   duration?: number;
}

const IPFSLoader: React.FC<IPFSLoaderProps> = ({
   onComplete,
   duration = 10000
}) => {
   const translations = useTranslations("general");
   const [currentMessage, setCurrentMessage] = useState(
      translations("loaderInitializing")
   );
   const [progress, setProgress] = useState(0);

   const statusMessages = React.useMemo(
      () => [
         translations("loaderContacting"),
         translations("loaderAligning"),
         translations("loaderNegotiating"),
         translations("loaderEstablishing"),
         translations("loaderRetrieving"),
         translations("loaderAlmostDone")
      ],
      [translations]
   );

   useEffect(() => {
      let messageIndex = 0;
      let currentProgress = 0;

      const interval = setInterval(() => {
         setCurrentMessage(
            statusMessages[messageIndex % statusMessages.length]
         );
         messageIndex++;

         currentProgress = Math.min(currentProgress + Math.random() * 18, 100);
         if (currentProgress >= 95) {
            currentProgress = 95;
         }
         setProgress(currentProgress);
      }, duration / statusMessages.length);

      return () => clearInterval(interval);
   }, [duration, statusMessages, onComplete]);

   return (
      <Card className="text-center max-w-2xl mx-auto my-12 border-cyan-400/40 shadow-[0_0_20px_rgba(0,255,200,0.3),inset_0_0_10px_rgba(0,255,200,0.1)] backdrop-blur-lg font-mono text-cyan-300">
         <CardContent className="px-8 py-5">
            <div className="text-xl min-h-[1.5em] text-cyan-900 dark:text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,195,0.7)] mb-5 animate-[fadeIn_0.6s_ease]">
               {currentMessage}
            </div>
            <div className="relative w-full h-3 bg-emerald-900/60 rounded-md overflow-hidden border border-cyan-400/40">
               <div
                  className="h-full transition-all duration-500 ease-out shadow-[0_0_10px_#00ffc3] bg-gradient-to-r from-cyan-300 to-blue-400"
                  style={{ width: `${progress}%` }}
               />
               <div className="absolute top-0 -left-[30%] w-[30%] h-full bg-white/30 animate-[scan_1.5s_linear_infinite]" />
            </div>
         </CardContent>
      </Card>
   );
};

export default IPFSLoader;
