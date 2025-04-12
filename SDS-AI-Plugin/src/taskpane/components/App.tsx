import React, { useState } from "react";
import Login from "./Login";
import { MasterDataProvider } from "./MasterDataProvider";

const appSettings = APP_SETTINGS;

const encrypt = (value: string): string => {
  return btoa(value); // Simple encryption (Base64)
};

const App: React.FC = () => {
  console.log("Version:", APP_VERSION)
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const showLoggedInUI = (token: string): void => {
    setAccessToken(token);

    Office.onReady(() => {
      console.log("Office is ready in App.tsx");

      if (Office.context.mailbox && Office.context.mailbox.item) {
        const attachments = Office.context.mailbox.item.attachments || [];
        console.log("Attachments in App.tsx:", attachments);

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
                  console.log("Sending attachments to dialog:", attachmentsWithContent);

                  setTimeout(() => {
                    dialog.messageChild(JSON.stringify(attachmentsWithContent));
                  }, 1200);
                } else {
                  console.error("Failed to open dialog:", result.error.message);
                }
              }
            );
          })
          .catch((error) => {
            console.error("Error fetching attachment content:", error);
          });
      } else {
        console.error("Mailbox is not available in this context.");
      }
    });
  };

  return (
    <MasterDataProvider>
      <Login appSettings={appSettings} encrypt={encrypt} showLoggedInUI={showLoggedInUI} />
    </MasterDataProvider>
  );
};

export default App;
