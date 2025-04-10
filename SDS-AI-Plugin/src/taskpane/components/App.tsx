import React, { useState } from "react";
import Login from "./Login";

const appSettings = APP_SETTINGS;

// Example encryption function
const encrypt = (value: string): string => {
  return btoa(value); // Simple Base64 "encryption" for demonstration
};

const App: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const showLoggedInUI = (token: string): void => {
    setAccessToken(token);

    // Ensure Office.js is ready before accessing mailbox
    Office.onReady(() => {
      console.log("Office is ready in App.tsx");

      if (Office.context.mailbox && Office.context.mailbox.item) {
        const attachments = Office.context.mailbox.item.attachments || [];
        console.log("Attachments in App.tsx:", attachments);

        // Fetch content for each attachment
        const fetchAttachmentContent = async (attachment: any) => {
          return new Promise((resolve, reject) => {
            Office.context.mailbox.item.getAttachmentContentAsync(attachment.id, (result) => {
              if (result.status === Office.AsyncResultStatus.Succeeded) {
                resolve({
                  ...attachment,
                  fileBase64: result.value.content, // Add Base64 content to the attachment object
                });
              } else {
                reject(result.error);
              }
            });
          });
        };

        // Fetch all attachments' content
        Promise.all(attachments.map(fetchAttachmentContent))
          .then((attachmentsWithContent) => {
            // Open the modal dialog
            Office.context.ui.displayDialogAsync(
              `${window.location.origin}/SDS-AI-Outlook-Plugin/tools/dialog.html?accessToken=${encodeURIComponent(
                token
              )}`,
              {
                width: 70, // Adjusted width
                height: 70, // Adjusted height
                displayInIframe: true,
              },
              (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                  // Send the attachments to the modal dialog
                  const dialog = result.value;
                  console.log("Sending attachments to dialog:", attachmentsWithContent);

                  // Delay sending the attachments to ensure the dialog is ready
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
    <div>
      <Login appSettings={appSettings} encrypt={encrypt} showLoggedInUI={showLoggedInUI} />
    </div>
  );
};

export default App;