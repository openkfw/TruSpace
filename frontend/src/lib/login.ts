import Cookies from "js-cookie";

export const COOKIE_NAME = "login";

interface LoginCookie {
   name: string;
   email: string;
   expires: number; // milliseconds since UNIX epoch
}

export const getLoginCookie = (): LoginCookie | null => {
   try {
      const loginCookie = Cookies.get(COOKIE_NAME);
      console.log(loginCookie);
      if (loginCookie) {
         const parsedCookie = JSON.parse(loginCookie || null);

         const expires = new Date(parsedCookie?.expires * 1000);
         if (expires.getTime() < Date.now()) {
            console.log("4");
            deleteLoginCookie();
         } else {
            return parsedCookie;
         }
      }
   } catch (error) {
      console.error("Error parsing login cookie:", error);
      console.log("5");
      deleteLoginCookie();
   }
};

export const deleteLoginCookie = () => {
   console.log("deleteCookieCalled");
   return Cookies.remove(COOKIE_NAME);
};

export const isTokenExpired = (token) => {
   if (!token) {
      console.log("there is no token");
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
   router.push("/login");
};
