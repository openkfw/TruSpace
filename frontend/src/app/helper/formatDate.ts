import { format } from "date-fns";

export const formatDate = (date: Date | number | string) => {
   switch (typeof date) {
      case "string":
         // if string is in timestamp format
         if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
            const parsedDate = new Date(date);
            return format(parsedDate, "dd/MM/yyyy 'at' HH:mm:ss");
         }
         return format(new Date(parseInt(date)), "dd/MM/yyyy 'at' HH:mm:ss");
      case "number":
         return format(new Date(date), "dd/MM/yyyy 'at' HH:mm:ss");
      case "undefined":
         return "";
      default: {
         const parsedDate = new Date(date);
         if (parsedDate.toString() === "Invalid Date") {
            return date.toString();
         }
         return format(parsedDate, "dd/MM/yyyy 'at' HH:mm:ss");
      }
   }
};

export const formatDateDays = (date: Date | number | string) => {
   switch (typeof date) {
      case "string":
         const parsedDate = new Date(parseInt(date));
         parsedDate.setHours(0, 0, 0, 0);
         const now = new Date();
         now.setHours(0, 0, 0, 0);
         const diffTime = Math.abs(now.getTime() - parsedDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays;
      case "number":
         const parsedDate2 = new Date(date);
         parsedDate2.setHours(0, 0, 0, 0);
         const now2 = new Date();
         now2.setHours(0, 0, 0, 0);
         const diffTime2 = Math.abs(now2.getTime() - parsedDate2.getTime());
         const diffDays2 = Math.ceil(diffTime2 / (1000 * 60 * 60 * 24));
         return diffDays2;
      case "undefined":
         return "";
      default: {
         const parsedDate = new Date(date);
         if (parsedDate.toString() === "Invalid Date") {
            return 0;
         }
         return format(parsedDate, "dd/MM/yyyy");
      }
   }
};
