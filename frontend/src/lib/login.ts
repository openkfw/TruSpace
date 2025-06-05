import Cookies from "js-cookie";

interface LoginCookie {
   name: string;
   email: string;
   expires: number; // milliseconds since UNIX epoch
}

export const getLoginCookie = (): LoginCookie | null => {
   try {
      const loginCookie = Cookies.get("login");
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
   return Cookies.remove("login");
};

export const isTokenExpired = (token) => {
   if (!token) return true;

   try {
      const expirationDate = new Date(token.expires * 1000);
      return expirationDate <= new Date();
   } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
   }
};

export const redirectToLogin = (router) => {
   router.push("/login");
};
