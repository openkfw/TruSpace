import { USERS_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

export const registerUser = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/register`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         name: data.name,
         email: data.email,
         password: data.password,
         confirmPassword: data.confirmPassword,
         lang: data.lang,
         confirmationLink: data.confirmationLink
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

export const loginUser = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/login`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         email: data.email,
         password: data.password
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

export const logout = async (): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const response = await fetchWithCredentials(
         `${USERS_ENDPOINT}/logout`,
         withCsrf({
            method: "POST",
            credentials: "include"
         })
      );

      if (!response.ok) {
         throw new Error("Failed to log out");
      }

      return await response.json();
   } catch (error) {
      console.error("Error during logout:", error);
      throw error;
   }
};

export const confirmRegistration = async (
   token: string,
   formData: {
      lang: string;
      confirmationLink: string;
   }
): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const url = `${USERS_ENDPOINT}/confirm-registration?token=${token}`;
      const options: RequestInit = {
         method: "POST",
         headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify({
            lang: formData.lang,
            confirmationLink: formData.confirmationLink
         }),
         credentials: "include"
      };
      const response = await fetchWithCredentials(url, withCsrf(options));

      return await response.json();
   } catch (error) {
      console.error("Error during registration confirmation:", error);
      throw error;
   }
};

export const updateUserSettings = async (formData: FormData) => {
   try {
      const res = await fetchWithCredentials(
         `${USERS_ENDPOINT}/user-settings`,
         withCsrf({
            method: "POST",
            credentials: "include",
            body: formData
         })
      );

      if (!res.ok) {
         throw new Error("Failed to update user settings");
      }
      return res.json();
   } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
   }
};

export const updateUserName = async (name: string) => {
   try {
      const res = await fetchWithCredentials(
         `${USERS_ENDPOINT}/reset-name`,
         withCsrf({
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
         })
      );

      if (!res.ok) {
         throw new Error("Failed to update user name");
      }
      return res.json();
   } catch (error) {
      console.error("Error updating user name:", error);
      throw error;
   }
};

export const deleteUser = async () => {
   try {
      const res = await fetchWithCredentials(
         `${USERS_ENDPOINT}/delete-user`,
         withCsrf({
            method: "DELETE",
            credentials: "include"
         })
      );

      if (!res.ok) {
         throw new Error("Failed to delete user");
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
   } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
   }
};

export const downloadAvatarCid = async () => {
   try {
      const res = await fetchWithCredentials(`${USERS_ENDPOINT}/avatar-cid`, {
         method: "GET",
         credentials: "include"
      });

      if (res.status === 404) {
         return null;
      }

      if (!res.ok) {
         throw new Error("Failed to download avatar CID");
      }

      const result = await res.json();
      return result.cid;
   } catch (error) {
      console.error("Error downloading avatar CID:", error);
      throw error;
   }
};

export const downloadAvatar = async (avatarCid: string) => {
   try {
      const res = await fetchWithCredentials(
         `${USERS_ENDPOINT}/avatar/${encodeURIComponent(avatarCid)}`,
         {
            method: "GET",
            credentials: "include"
         }
      );

      if (res.status === 404) {
         return null;
      }

      if (!res.ok) {
         throw new Error("Failed to download avatar");
      }

      return res;
   } catch (error) {
      console.error("Error downloading avatar:", error);
      throw error;
   }
};

export const downloadUserSettings = async () => {
   try {
      const res = await fetchWithCredentials(`${USERS_ENDPOINT}/user-settings`, {
         method: "GET",
         credentials: "include"
      });

      if (res.status === 404) {
         return {};
      }

      if (!res.ok) {
         throw new Error("Failed to download user settings");
      }

      const result = await res.json();
      return result;
   } catch (error) {
      console.error("Error downloading user settings:", error);
      throw error;
   }
};

export const forgotPassword = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/forgot-password`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         email: data.email,
         resetPasswordLink: data.resetPasswordLink,
         lang: data.lang
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

export const resetPassword = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/reset-password`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         password: data.password,
         token: data.token
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};
