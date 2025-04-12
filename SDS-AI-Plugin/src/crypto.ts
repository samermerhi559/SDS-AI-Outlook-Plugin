export const encrypt = (value: string | null): string => {
    try {
      if (!value || typeof value !== "string") return "";
      return btoa(value);
    } catch (error) {
      console.error("❌ Failed to encrypt value:", error);
      return "";
    }
  };
  
  
  export const decrypt = (value: string | null): string => {
    try {
      if (!value || typeof value !== "string") return "";
      return atob(value);
    } catch (error) {
      console.error("❌ Failed to decrypt token (not valid base64):", error);
      return "";
    }
  };
  