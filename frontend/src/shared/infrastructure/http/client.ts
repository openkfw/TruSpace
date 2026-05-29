export const fetchWithCredentials = (
   input: RequestInfo | URL,
   options: RequestInit = {}
) => {
   return fetch(input, {
      ...options,
      credentials: options.credentials ?? "include"
   });
};

export const swrJsonFetcher = (url: string) => {
   return fetchWithCredentials(url).then((response) => response.json());
};
