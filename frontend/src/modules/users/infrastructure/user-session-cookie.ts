import Cookies from "js-cookie";

export const USER_SESSION_COOKIE_NAME = "login";

export const getLoginCookie = () => {
   return Cookies.get(USER_SESSION_COOKIE_NAME);
};

export const setLoginCookie = (data: unknown) => {
   Cookies.set(USER_SESSION_COOKIE_NAME, JSON.stringify(data));
};

export const deleteLoginCookie = () => {
   return Cookies.remove(USER_SESSION_COOKIE_NAME);
};
