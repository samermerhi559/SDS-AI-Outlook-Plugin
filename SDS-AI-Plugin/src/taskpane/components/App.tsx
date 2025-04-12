const isDialogContext = () => {
  return window.location.pathname.includes("dialog.html");
};

import React, { useState } from "react";
import Login from "./Login";
import { MasterDataProvider } from "./MasterDataProvider";

const appSettings = APP_SETTINGS;

const encrypt = (value: string): string => {
  return btoa(value); // Simple encryption (Base64)
};

const App: React.FC = () => {
  console.log("App.tsx Component: Version:", APP_VERSION);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const showLoggedInUI = (token: string): void => {
    setAccessToken(token);

    Office.onReady(() => {
      console.log("App.tsx Component: Office is ready in App.tsx");

      if (localStorage.getItem("dialogReady") === "true") {
        console.warn("🛑 App.tsx: Dialog already open. Skipping dialog launch.");
        return;
      }

      if (Office.context.mailbox && Office.context.mailbox.item) {
        const attachments = Office.context.mailbox.item.attachments || [];
        console.log("App.tsx Component: Attachments in App.tsx:", attachments);

        const fetchAttachmentContent = async (attachment: any) => {
          return new Promise((resolve, reject) => {
            Office.context.mailbox.item.getAttachmentContentAsync(attachment.id, (result) => {
              if (result.status === Office.AsyncResultStatus.Succeeded) {
                resolve({
                  ...attachment,
                  fileBase64: result.value.content,
                });
              } else {
                reject(result.error);
              }
            });
          });
        };

        Promise.all(attachments.map(fetchAttachmentContent))
          .then((attachmentsWithContent) => {
            console.log("📦 App.tsx: attachmentsWithContent loaded:", attachmentsWithContent);

            // ✅ Save to localStorage instead of messageChild
            //localStorage.setItem("attachmentsPayload", JSON.stringify(attachmentsWithContent));
            sessionStorage.setItem("attachmentsPayload", JSON.stringify(attachmentsWithContent));

            Office.context.ui.displayDialogAsync(
              `${window.location.origin}/SDS-AI-Outlook-Plugin/tools/dialog.html?accessToken=${encodeURIComponent(token)}`,
              {
                width: 70,
                height: 70,
                displayInIframe: true,
              },
              (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                  const dialog = result.value;

                  dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
                    console.log("🔁 App.tsx: Dialog closed by user.");
                    localStorage.setItem("dialogReady", "false");
                  });

                  dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg) => {
                    if ("message" in arg && arg.message === "dialog-ready") {
                      console.log("✅ App.tsx: Received dialog-ready.");
                      // We already stored attachments in localStorage
                      localStorage.setItem("dialogReady", "true");
                    } else if ("message" in arg) {
                      console.log("📨 Received unexpected message:", arg.message);
                    } else {
                      console.log("📨 Received unexpected error:", arg.error);
                    }
                  });
                } else {
                  console.error("App.tsx Component: Failed to open dialog:", result.error.message);
                  localStorage.setItem("dialogReady", "false");
                }
              }
            );
          })
          .catch((error) => {
            console.error("App.tsx Component: Error fetching attachment content:", error);
            localStorage.setItem("dialogReady", "false");
          });
      } else {
        console.warn("App.tsx Component: Mailbox not available, skipping dialog.");
        localStorage.setItem("dialogReady", "false");
      }
    });
  };

  return (
    <MasterDataProvider>
      <Login appSettings={appSettings} showLoggedInUI={showLoggedInUI} />
    </MasterDataProvider>
  );
};

export default App;
