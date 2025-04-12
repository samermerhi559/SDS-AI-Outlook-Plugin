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
    const accessToken = decrypt(Office.context.roamingSettings.get("accessTokenEncrypted"));
    const refreshToken = decrypt(Office.context.roamingSettings.get("refreshToken"));

    const refreshResponse = await fetch(`${authUrl}/auth/refresh-token`, {
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

    if (refreshResponse.status === 203) {
      logoutAndReload();
      return null;
    }

    const tokenData = await refreshResponse.json();

    if (!tokenData?.access_token) {
      logoutAndReload();
      return null;
    }

    // ✅ Save refreshed access token
    Office.context.roamingSettings.set("accessTokenEncrypted", encrypt(tokenData.access_token));
    Office.context.roamingSettings.saveAsync();

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
      ...extraHeaders, // ✅ include any custom headers passed
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error("❌ Error in refreshTokenAndPost:", error);
    logoutAndReload();
    return null;
  }
};
