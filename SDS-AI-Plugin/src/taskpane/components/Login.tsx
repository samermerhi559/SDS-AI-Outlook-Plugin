import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import Footer from "./Footer";
import { CustomSingleValue, CustomOption } from "./Memo"; // Adjust the import path as necessary

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
  const [error, setError] = useState<string>("");

  const options: Option[] = useMemo(
    () =>
      Object.entries(appSettings.AuthenticationUrls).map(([agency, url]) => ({
        value: url,
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

  const handleLogin = async () => {
    if (!selectedAgency || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const url = selectedAgency.value;
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
      const token = result?.token?.access_token;

      if (!token) {
        setError("Login failed. Please check your credentials.");
        return;
      }

      const encryptedToken = encrypt(token);
      showLoggedInUI(encryptedToken); // Pass the encrypted token to App
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Login</h2>
      <div>
        <label htmlFor="agency-select">Select Agency:</label>
        <Select
          id="agency-select"
          value={selectedAgency}
          onChange={(option) => setSelectedAgency(option as Option)}
          options={options}
          components={{ SingleValue: CustomSingleValue, Option: CustomOption }}
        />
      </div>
      <div>
        <label htmlFor="username">User Name:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleLogin} style={{ width: "100%", padding: "10px", backgroundColor: "#0078d4", color: "#fff", border: "none", borderRadius: "4px" }}>
        Log In
      </button>
      <Footer />
    </div>
  );
};

export default Login;