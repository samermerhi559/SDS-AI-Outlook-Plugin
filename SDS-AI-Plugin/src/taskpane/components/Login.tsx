import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import Footer from "./Footer";
import { CustomSingleValue, CustomOption } from "./Memo";
import { useMasterData } from "./MasterDataProvider";
import { encrypt, decrypt } from "../../crypto";
import "../../styles/global.css";

interface Option {
  value: string;
  label: string;
  flag: string;
  financeUrl: string;
  agencyCode: string; // ✅ added
}

interface LoginProps {
  appSettings: {
    AuthenticationUrls: Record<string, string>;
    FinanceUrls: Record<string, string>;
    AgencyFlags: Record<string, string>;
    AgencyCodes: Record<string, string>; // ✅ used to inject codes
  };
  encrypt: (value: string) => string;
  showLoggedInUI: (accessToken: string) => void;
}

const Login: React.FC<LoginProps> = ({ appSettings, encrypt, showLoggedInUI }) => {
  const environment = window.location.hostname.includes("localhost") ? "development" : "test";
  localStorage.setItem("env", environment);

  const { loadMasterData, loadModuleContext, clearMasterData } = useMasterData();

  const [selectedAgency, setSelectedAgency] = useState<Option | null>(null);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const options: Option[] = useMemo(() => {
    return Object.entries(appSettings.AuthenticationUrls).map(([agency, authUrl]) => ({
      value: `${authUrl}/login`,
      label: agency,
      flag: appSettings.AgencyFlags[agency],
      financeUrl: appSettings.FinanceUrls[agency] || "",
      agencyCode: appSettings.AgencyCodes[agency] || "", // ✅ use AgencyCodes
    }));
  }, [appSettings]);

  useEffect(() => {
    if (options.length > 0) {
      setSelectedAgency(options[0]);
    }
  }, [options]);

  useEffect(() => {
    Office.onReady(() => {
      const encrypted = Office.context.roamingSettings.get("accessTokenEncrypted");
      const savedUser = Office.context.roamingSettings.get("userName");

      if (!encrypted || typeof encrypted !== "string") {
        console.warn("🔐 No encrypted token found. Clearing session.");
        handleLogout();
        return;
      }

      const savedToken = decrypt(encrypted);

      if (!savedToken || !savedUser) {
        console.warn("🔐 Invalid or missing token/user. Clearing session.");
        handleLogout();
        return;
      }

      setToken(savedToken);
      setUsername(savedUser);
      showLoggedInUI(savedToken);
    });
  }, [showLoggedInUI]);

  const handleLogin = async () => {
    if (!selectedAgency || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

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
        return;
      }

      Office.context.roamingSettings.set("accessTokenEncrypted", encrypt(receivedAccessToken));
      Office.context.roamingSettings.set("refreshToken", encrypt(receivedRefreshToken));
      Office.context.roamingSettings.set("userName", username);
      Office.context.roamingSettings.saveAsync();

      setToken(receivedAccessToken);
      showLoggedInUI(receivedAccessToken);

      localStorage.setItem("selectedAgency", selectedAgency.label);
      localStorage.setItem("agencycode", selectedAgency.agencyCode); // ✅ save real agency code

      const financeUrl = selectedAgency.financeUrl;
      const authUrl = selectedAgency.value.replace("/login", "");

      if (financeUrl && authUrl && receivedAccessToken) {
        await loadModuleContext(receivedAccessToken, authUrl); // ✅ no need to pass agencyCode anymore
        await loadMasterData(receivedAccessToken, financeUrl);
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    }
  };

  const handleLogout = () => {
    Office.context.roamingSettings.remove("accessTokenEncrypted");
    Office.context.roamingSettings.remove("refreshToken");
    Office.context.roamingSettings.remove("userName");
    Office.context.roamingSettings.saveAsync();

    clearMasterData();
    localStorage.removeItem("masterData");

    setToken(null);
    setUsername("");
    setPassword("");
    setSelectedAgency(null);
  };

  return (
    <div className="login-container">
      {!token ? (
        <>
          <h2 className="login-title">Sign in to Invoice AI</h2>
          <div className="login-field">
            <label htmlFor="agency-select">Select Agency:</label>
            <Select
              id="agency-select"
              value={selectedAgency}
              onChange={(option) => setSelectedAgency(option as Option)}
              options={options}
              components={{ SingleValue: CustomSingleValue, Option: CustomOption }}
            />
          </div>

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ textAlign: "center" }}>
            <button onClick={handleLogin}>Log In</button>
          </div>
        </>
      ) : (
        <div className="login-success">
          <p>✅ You are now connected as <strong>{username}</strong>.</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Login;
