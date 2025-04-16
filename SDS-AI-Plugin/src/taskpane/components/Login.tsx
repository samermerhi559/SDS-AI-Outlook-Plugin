// ✅ Login.tsx — improved layout with button spacing and centering
const isDialogContext = () => {
  return window.location.pathname.includes("dialog.html");
};

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Footer from "./Footer";
import { useMasterData } from "./MasterDataProvider";
import { decrypt, encrypt } from "../../crypto";
import { CustomSingleValue, CustomOption } from "./Memo";

interface Option {
  value: string;
  label: string;
  flag: string;
  financeUrl: string;
  agencyCode: string;
}

interface LoginProps {
  appSettings: any;
  showLoggedInUI: (accessToken: string) => void;
}

const Login: React.FC<LoginProps> = ({ appSettings, showLoggedInUI }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Option | null>(null);
  const [error, setError] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<"none" | "login" | "loadingData">("none");

  const { loadMasterData, loadModuleContext, clearMasterData } = useMasterData();

  const options: Option[] = useMemo(() => {
    return Object.entries(appSettings.AuthenticationUrls).map(([agency, url]) => ({
      value: `${url}/login`,
      label: agency,
      flag: appSettings.AgencyFlags[agency],
      financeUrl: appSettings.FinanceUrls[agency],
      agencyCode: appSettings.AgencyCodes[agency],
    }));
  }, [appSettings]);

  useEffect(() => {
    if (isDialogContext()) return;

    const encrypted = Office.context.roamingSettings.get("accessTokenEncrypted");
    const savedUser = Office.context.roamingSettings.get("userName");

    if (!encrypted || typeof encrypted !== "string") return;

    const savedToken = decrypt(encrypted);
    if (!savedToken || !savedUser) return;

    setAccessToken(savedToken);
    setUsername(savedUser);
    showLoggedInUI(savedToken);
  }, [showLoggedInUI]);

  const waitForDialogReady = () =>
    new Promise<void>((resolve) => {
      const maxWait = 5000;
      const start = Date.now();
      const check = () => {
        if (localStorage.getItem("dialogReady") === "true") {
          resolve();
        } else if (Date.now() - start > maxWait) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

  const handleLogin = async () => {
    if (!selectedAgency || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoadingPhase("login");
    const url = selectedAgency.value;
    const payload = {
      userName: username,
      password: password,
      loginRsponse: {},
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const receivedAccessToken = result?.token?.access_token;
      const receivedRefreshToken = result?.token?.refresh_token;

      if (!receivedAccessToken || !receivedRefreshToken) {
        setError("Login failed. Please check your credentials.");
        setLoadingPhase("none");
        return;
      }

      Office.context.roamingSettings.set("accessTokenEncrypted", encrypt(receivedAccessToken));
      Office.context.roamingSettings.set("refreshToken", encrypt(receivedRefreshToken));
      Office.context.roamingSettings.set("userName", username);

      Office.context.roamingSettings.saveAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const runAfterSave = async () => {
            await waitForDialogReady();
            setAccessToken(receivedAccessToken);
            setLoadingPhase("loadingData");

            localStorage.setItem("selectedAgency", selectedAgency.label);
            localStorage.setItem("agencycode", selectedAgency.agencyCode);

            const financeUrl = selectedAgency.financeUrl;
            const authUrl = selectedAgency.value.replace("/login", "");

            localStorage.setItem("FinanceUrl", financeUrl);
            localStorage.setItem("AuthenticationUrl", authUrl);

            if (financeUrl && authUrl) {
              await loadModuleContext(authUrl);
              await loadMasterData(financeUrl, authUrl);
              setLoadingPhase("none");
              showLoggedInUI(receivedAccessToken);
            }
          };

          runAfterSave();
        } else {
          setLoadingPhase("none");
        }
      });
    } catch (err) {
      console.error("Login error:", err);
      setError("Unexpected error during login.");
      setLoadingPhase("none");
    }
  };

  const handleLogout = () => {
    clearMasterData();
    localStorage.clear();
    sessionStorage.clear();
    Office.context.roamingSettings.remove("accessTokenEncrypted");
    Office.context.roamingSettings.remove("refreshToken");
    Office.context.roamingSettings.remove("userName");
    Office.context.roamingSettings.saveAsync();
    setAccessToken(null);
  };

  return (
    <div className="login-container">
      {loadingPhase !== "none" ? (
        <div className="login-loading">
          <img src="/SDS-AI-Outlook-Plugin/assets/ai-bot-icon.png" className="ai-bot-animated" alt="AI bot" />
          <p style={{ marginTop: "1rem" }}>
            {loadingPhase === "login"
              ? "Logging you in... just a sec, charging my AI circuits 🤖"
              : "Login successful! Gathering some brain juice... 🧠✨"}
          </p>
        </div>
      ) : !accessToken ? (
        <>
          <h2 className="login-title">Welcome to SDS Invoice AI</h2>
          <div className="login-field">
            <Select
              options={options}
              onChange={(val) => setSelectedAgency(val as Option)}
              value={selectedAgency}
              placeholder="Select your agency"
              components={{ SingleValue: CustomSingleValue, Option: CustomOption }}
            />
          </div>
          <div className="login-field">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-field">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button onClick={handleLogin}>Log In</button>
          </div>
        </>
      ) : (
        <div>
          <p>You are now connected as <strong>{username}</strong>.</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Login;