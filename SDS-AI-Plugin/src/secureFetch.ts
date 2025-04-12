import { decrypt, encrypt } from "./crypto";
import { logoutAndReload } from "./session";

/**
 * Attempts to refresh the access token using the refresh token,
 * and if successful, proceeds with the original POST request.
 * If refresh fails (203 or missing token), logs the user out and reloads.
 */
export const refreshTokenAndPost = async (
  url: string,
  payload: any,
  authUrl: string,
  extraHeaders: Record<string, string> = {}
): Promise<any | null> => {
  try {
    console.log("🔄secureFetch Component: refreshTokenAndPost called");
    console.log("secureFetch Component: authUrl passed:", authUrl);
    console.log("🔁secureFetch Component: Final POST Target URL:", url);
    console.log("secureFetch Component: Expected refresh URL:", `${authUrl}/proxy/refresh-token`);

    if (!authUrl || !authUrl.startsWith("http")) {
      console.warn("⚠️secureFetch Component: Malformed or missing authUrl in refreshTokenAndPost:", authUrl);
    }

    const accessToken = decrypt(Office.context.roamingSettings.get("accessTokenEncrypted"));
    const refreshToken = decrypt(Office.context.roamingSettings.get("refreshToken"));
    console.log("🔁secureFetch Component: access token:", accessToken);
    console.log("🔁secureFetch Component: refresh token:", refreshToken);
    const refreshResponse = await fetch(`${authUrl}/proxy/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 600,
        },
      }),
    });
    console.log("🔁secureFetch Component: Refresh response:", refreshResponse);

    if (refreshResponse.status === 203) {
      console.warn("🔐secureFetch Component: Refresh token expired or invalid. Logging out.");
      logoutAndReload();
      return null;
    }

    const tokenData = await refreshResponse.json();
/*
    if (!tokenData?.access_token) {
      console.warn("❌secureFetch Component: No access_token in refresh response. Logging out.");
      logoutAndReload();
      return null;
    }

    Office.context.roamingSettings.set("accessTokenEncrypted", encrypt(tokenData.access_token));
    Office.context.roamingSettings.saveAsync();*/

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...extraHeaders,
    };

    return await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }).then((res) => res.json());
  } catch (error) {
    console.error("❌ Error in refreshTokenAndPost:", error);
    logoutAndReload();
    return null;
  }
};
