import { parse } from "tldts";
import { isEmail } from "validator";

export const validateEmail = (value: string) => {
   if (!isEmail(value)) return false;

   const domain = value.split("@")[1];
   const parsed = parse(domain);

   return Boolean(parsed.domain && parsed.isIcann);
};
