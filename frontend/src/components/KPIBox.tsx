export default function KPIBox({
   kpi,
   value,
   valueLabel,
   delta,
   deltaColor = "green-400",
   icon,
   bgColor,
   iconBgColor
}: {
   kpi: string;
   value: string;
   valueLabel?: string;
   delta?: string | React.ReactNode;
   deltaColor?: string;
   icon?: React.ReactNode;
   bgColor?: string;
   iconBgColor?: string;
}) {
   return (
      <div
         className={`p-4 rounded-md shadow-md border${bgColor ? ` bg-${bgColor}` : ""}`}
      >
         <div className={`grid grid-cols-${icon ? "4" : "3"} gap-4`}>
            {icon && (
               <div className="col-span-4 w-full text-xl flex items-center justify-center ">
                  <div
                     className={`rounded-full flex items-center justify-center w-20 h-20 ${iconBgColor ? ` bg-${iconBgColor}` : ""}`}
                  >
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
            <div className="col-span-2 mt-3">
               <span className="text-4xl font-bold ">{value}</span>{" "}
               <span>{valueLabel}</span>
            </div>
         </div>
      </div>
   );
}
