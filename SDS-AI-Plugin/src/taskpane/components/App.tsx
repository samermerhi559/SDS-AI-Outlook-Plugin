import React, { useState } from "react";
import Login from "./Login";
import InvoiceAISender from "./InvoiceAISender";

// Assume APP_SETTINGS is injected via Webpack and declared in a globals.d.ts file
const appSettings = APP_SETTINGS;

// Example encryption function
const encrypt = (value: string): string => {
  return btoa(value); // Simple Base64 "encryption" for demonstration
};

const App: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const showLoggedInUI = (token: string): void => {
    setAccessToken(token); // Save the access token and switch to InvoiceAISender
  };

  return (
    <div>
      {accessToken ? (
        <InvoiceAISender accessToken={accessToken} />
      ) : (
        <Login appSettings={appSettings} encrypt={encrypt} showLoggedInUI={showLoggedInUI} />
      )}
    </div>
  );
};

export default App;