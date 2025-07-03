import Cookies from "js-cookie";

export const COOKIE_NAME = "login";

export const setLoginCookie = (data) => {
   Cookies.set(COOKIE_NAME, JSON.stringify(data));
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
      return expirationDate <= new Date();
   } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
   }
};
