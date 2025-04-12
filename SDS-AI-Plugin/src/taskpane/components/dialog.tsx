import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Attachment } from "../types/Attachment";
import InvoiceAISender from "./InvoiceAISender";
import appsettings from "../../../appsettings.json";

// Extract the accessToken from the query string
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("accessToken");

// Determine selected agency and environment
const selectedAgency = localStorage.getItem("selectedAgency") || "Switzerland";
const environment = window.location.hostname.includes("localhost") ? "development" : "test";
const baseFinanceUrl = appsettings[environment].FinanceUrls[selectedAgency];
const ocrUrl = `${baseFinanceUrl}/Vouchers/SendVoucherForOCR`;
const baseAuthUrl = appsettings[environment].AuthenticationUrls[selectedAgency];
const DialogApp: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [masterData, setMasterData] = useState<any[]>([]); // ✅ local masterData

  useEffect(() => {
    // Load master data from localStorage
    const stored = localStorage.getItem("masterData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMasterData(parsed);
        console.log("🧠 Master data loaded from localStorage:", parsed.length);
      } catch (err) {
        console.error("❌ Failed to parse masterData from localStorage", err);
      }
    }
  }, []);

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
  }, []);

  return (
    <>
      {attachments ? (
       <InvoiceAISender
       accessToken={accessToken}
       initialAttachments={attachments}
       ocrUrl={ocrUrl}
       authUrl={baseAuthUrl}
       masterData={masterData}
     />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Waiting for attachments...</p>
        </div>
      )}
    </>
  );
};

ReactDOM.render(<DialogApp />, document.getElementById("root"));
