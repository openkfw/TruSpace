import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "./ui/tooltip";
import CopyToClipboardButton from "./CopyToClipboardButton";

export default function KPIBox({
   kpi,
   value,
   valueLabel,
   valueTooltip,
   delta,
   deltaColor = "green-400",
   icon,
   bgColor
}: {
   kpi: string;
   value: string;
   valueLabel?: string;
   valueTooltip?: string;
   delta?: string | React.ReactNode;
   deltaColor?: string;
   icon?: React.ReactNode;
   bgColor?: string;
}) {
   return (
      <div
         className={`p-4 rounded-md shadow-md border w-full${bgColor ? ` bg-${bgColor}` : ""}`}
      >
         <div className="grid grid-cols-4 gap-4">
            {icon && (
               <div className="col-span-4 w-full text-xl flex items-center justify-center">
                  <div className="rounded-full flex items-center justify-center">
                     {icon}
                  </div>
               </div>
            )}

            <div className="col-span-4 lg:col-span-2">{kpi}</div>

            <div
               className={`flex text-center col-span-4 lg:col-span-1 text-${deltaColor}`}
            >
               {delta}
            </div>

            <div className="col-span-3 mt-3">
               <div className="flex items-center gap-2 flex-nowrap w-full">
                  {valueTooltip ? (
                     <>
                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <span
                                    className="text-4xl font-bold truncate flex-1"
                                    title={valueTooltip}
                                 >
                                    {value}
                                 </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                 <span>{valueTooltip}</span>
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>

                        <div className="shrink-0">
                           <CopyToClipboardButton value={valueTooltip} />
                        </div>
                     </>
                  ) : (
                     <span className="text-4xl font-bold truncate flex-1">
                        {value}
                     </span>
                  )}

                  {valueLabel && (
                     <span className="text-base shrink-0">{valueLabel}</span>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
