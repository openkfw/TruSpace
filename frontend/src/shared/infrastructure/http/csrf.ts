const CSRF_COOKIE_NAME = "XSRF-TOKEN";

export const getCsrfToken = (): string | null => {
   if (typeof document === "undefined") {
      return null;
   }

   const match = document.cookie.match(
      new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`)
   );

   return match ? decodeURIComponent(match[1]) : null;
};

export const withCsrf = (options: RequestInit): RequestInit => {
   const method = (options.method || "GET").toUpperCase();
   if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return options;
   }

   const token = getCsrfToken();
   if (!token) {
      return options;
   }

   const headers = new Headers(options.headers || {});
   headers.set("X-CSRF-Token", token);

   return { ...options, headers };
};
