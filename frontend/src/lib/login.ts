import Cookies from "js-cookie";

export const COOKIE_NAME = "login";

export const COOKIE_OPTIONS = {
   secure: process.env.NODE_ENV === "production",
   sameSite: "strict" as const
};

interface LoginCookie {
   name: string;
   email: string;
   expires: number; // milliseconds since UNIX epoch
}

export const setLoginCookie = (data, options) => {
   Cookies.set(COOKIE_NAME, JSON.stringify(data), options);
};

export const getLoginCookie = (): LoginCookie | null => {
   try {
      const loginCookie = Cookies.get(COOKIE_NAME);
      console.log(loginCookie);
      if (loginCookie) {
         const parsedCookie = JSON.parse(loginCookie || null);

         const expires = new Date(parsedCookie?.expires * 1000);
         if (expires.getTime() < Date.now()) {
            deleteLoginCookie();
         } else {
            return parsedCookie;
         }
      }
   } catch (error) {
      console.error("Error parsing login cookie:", error);
      deleteLoginCookie();
   }
};

export const deleteLoginCookie = () => {
   return Cookies.remove(COOKIE_NAME);
};

export const isTokenExpired = (token) => {
   if (!token) {
      return true;
   }

   try {
      const expirationDate = new Date(token.expires * 1000);
      if (expirationDate <= new Date())
         console.log(
            `Token is valid until ${expirationDate.toISOString()}, it is now ${new Date().toISOString()}`
         );
      return expirationDate <= new Date();
   } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
   }
};

export const redirectToLogin = (router) => {
   console.log("redirectToLogin");
   router.push("/login");
};
