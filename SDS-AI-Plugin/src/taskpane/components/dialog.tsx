import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import InvoiceAISender, { Attachment } from "./InvoiceAISender";

// Extract the accessToken from the query string
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("accessToken");

const DialogApp: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);

  useEffect(() => {
    Office.onReady(() => {
      console.log("Office is ready in dialog.tsx");

      Office.context.ui.addHandlerAsync(
        Office.EventType.DialogParentMessageReceived,
        (message) => {
          try {
            const receivedAttachments: Attachment[] = JSON.parse(message.message);
            console.log("Attachments received in dialog:", receivedAttachments);
            setAttachments(receivedAttachments);
          } catch (err) {
            console.error("Failed to parse attachments message:", err);
          }
        },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            console.error("Failed to add handler for parent messages:", result.error.message);
          }
        }
      );
    });
  }, []); // ✅ run only once

  return (
    <>
      {attachments ? (
        <InvoiceAISender accessToken={accessToken} initialAttachments={attachments} />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Waiting for attachments...</p>
        </div>
      )}
    </>
  );
};

ReactDOM.render(<DialogApp />, document.getElementById("root"));
