// Login.tsx
import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import Footer from "./Footer";
import { CustomSingleValue, CustomOption } from "./Memo";
import "../../styles/global.css";

interface Option {
  value: string;
  label: string;
  flag: string;
}

interface LoginProps {
  appSettings: {
    AuthenticationUrls: Record<string, string>;
    AgencyFlags: Record<string, string>;
  };
  encrypt: (value: string) => string;
  showLoggedInUI: (accessToken: string) => void;
}

const Login: React.FC<LoginProps> = ({ appSettings, encrypt, showLoggedInUI }) => {
  const [selectedAgency, setSelectedAgency] = useState<Option | null>(null);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const options: Option[] = useMemo(
    () =>
      Object.entries(appSettings.AuthenticationUrls).map(([agency, baseUrl]) => ({
        value: `${baseUrl}/login`, // Append /login dynamically
        label: agency,
        flag: appSettings.AgencyFlags[agency],
      })),
    [appSettings]
  );

  useEffect(() => {
    if (options.length > 0) {
      setSelectedAgency(options[0]);
    }
  }, [options]);

  useEffect(() => {
    Office.onReady(() => {
      const savedToken = Office.context.roamingSettings.get("accessToken");
      const savedUser = Office.context.roamingSettings.get("userName");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUsername(savedUser);
        showLoggedInUI(savedToken);
      }
    });
  }, [showLoggedInUI]);

  const handleLogin = async () => {
    if (!selectedAgency || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const url = selectedAgency.value; // Use the dynamically appended URL
    const payload = {
      userName: username,
      password: password,
      loginRsponse: {}
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const receivedAccessToken = result?.token?.access_token;
      const receivedRefreshToken = result?.token?.refresh_token;

      if (!receivedAccessToken || !receivedRefreshToken) {
        setError("Login failed. Please check your credentials.");
        return;
      }

      const encryptedAccessToken = encrypt(receivedAccessToken);
      const encryptedRefreshToken = encrypt(receivedRefreshToken);

      // Save tokens in roaming settings
      Office.context.roamingSettings.set("accessToken", encryptedAccessToken);
      Office.context.roamingSettings.set("refreshToken", encryptedRefreshToken);
      Office.context.roamingSettings.set("userName", username);
      Office.context.roamingSettings.saveAsync();

      setToken(encryptedAccessToken);
      showLoggedInUI(encryptedAccessToken);
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    }
  };

  const handleLogout = () => {
    // Clear tokens from roaming settings
    Office.context.roamingSettings.remove("accessToken");
    Office.context.roamingSettings.remove("refreshToken");
    Office.context.roamingSettings.remove("userName");
    Office.context.roamingSettings.saveAsync();

    // Clear local state
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