import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SearchBarProps {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
}

export default function SearchBar({
   value,
   onChange,
   placeholder
}: SearchBarProps) {
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
   };

   const handleClear = () => {
      onChange("");
   };

   return (
      <div className="relative">
         <Input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="max-w-sm w-64 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
         />
         {value && (
            <Button
               variant="ghost"
               onClick={handleClear}
               className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:bg-transparent dark:hover:text-black"
            >
               <X />
            </Button>
         )}
      </div>
   );
}
