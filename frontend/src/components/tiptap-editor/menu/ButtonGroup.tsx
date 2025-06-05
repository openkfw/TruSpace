export default function ButtonGroup({ children }) {
   return (
      <div className="m-0 p-0 mr-2 [&>button]:m-0.5 [&>button]:px-2 [&>div]:m-0.5 [&>div]:px-0 h-full flex items-center">
         {children}
         <span className="w-px h-full border-solid border bg-gray-300 dark:bg-gray-700 ml-2"></span>
      </div>
   );
}
