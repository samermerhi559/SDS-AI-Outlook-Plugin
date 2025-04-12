export const logoutAndReload = () => {
    console.warn("🔐 Session invalid or expired. Logging out...");
  
    Office.context.roamingSettings.remove("accessTokenEncrypted");
    Office.context.roamingSettings.remove("refreshToken");
    Office.context.roamingSettings.remove("userName");
    Office.context.roamingSettings.saveAsync();
  
    localStorage.clear();
    window.location.reload();
  };