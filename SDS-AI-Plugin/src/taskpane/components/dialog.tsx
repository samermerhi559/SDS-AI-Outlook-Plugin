import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import InvoiceAISender from "./InvoiceAISender";
import { getAttachmentsFromDB, clearAttachmentsFromDB } from "./db"; // ✅ IndexedDB utilities

const Dialog: React.FC = () => {
  const [accessToken, setAccessToken] = useState("");
  const [attachments, setAttachments] = useState<any[] | null>(null);
  const [attachmentsReady, setAttachmentsReady] = useState(false);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [ocrUrl, setOcrUrl] = useState("");
  const [baseAuthUrl, setBaseAuthUrl] = useState("");

  useEffect(() => {
    const initDialog = async () => {
      console.log("📦 dialog.tsx: Initializing dialog...");
      await Office.onReady();
      console.log("📦 dialog.tsx: Office ready");

      localStorage.setItem("dialogReady", "false");

      const token = new URLSearchParams(window.location.search).get("accessToken") || "";
      setAccessToken(token);
      console.log("🔑 dialog.tsx: Access token retrieved:", token);

      const storedData = localStorage.getItem("masterData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setMasterData(parsed);
          console.log("📦 dialog.tsx: Loaded masterData:", parsed.length);
        } catch (err) {
          console.error("❌ dialog.tsx: Failed to parse masterData:", err);
        }
      } else {
        console.warn("⚠️ dialog.tsx: No masterData found in localStorage");
      }

      const financeUrl = localStorage.getItem("FinanceUrl");
      const authUrl = localStorage.getItem("AuthenticationUrl");
      console.log("💰 dialog.tsx: FinanceUrl from localStorage:", financeUrl);
      console.log("🔐 dialog.tsx: AuthenticationUrl from localStorage:", authUrl);

      if (financeUrl) setOcrUrl(`${financeUrl}/Vouchers/SendVoucherForOCR`);
      if (authUrl) setBaseAuthUrl(authUrl);

      // ✅ Load attachments from IndexedDB
      try {
        const attachmentsFromDB = await getAttachmentsFromDB();
        if (attachmentsFromDB && Array.isArray(attachmentsFromDB)) {
          console.log("✅ dialog.tsx: Loaded attachments from IndexedDB:", attachmentsFromDB);
          setAttachments(attachmentsFromDB);
          setAttachmentsReady(true);
          await clearAttachmentsFromDB(); // 🧹 Optional cleanup
        } else {
          console.warn("⚠️ dialog.tsx: No valid attachments found in IndexedDB");
        }
      } catch (error) {
        console.error("❌ dialog.tsx: Error reading attachments from IndexedDB:", error);
      }
    };

    initDialog();
  }, []);

  console.log("👀 dialog.tsx Render Check — attachments:", attachments);
  console.log("👀 dialog.tsx Render Check — attachmentsReady:", attachmentsReady);
  console.log("👀 dialog.tsx Render Check — masterData length:", masterData.length);
  console.log("👀 dialog.tsx Render Check — ocrUrl:", ocrUrl);
  console.log("👀 dialog.tsx Render Check — baseAuthUrl:", baseAuthUrl);

  return (
    <div>
      {attachmentsReady &&
      Array.isArray(attachments) &&
      attachments.length > 0 &&
      masterData.length > 0 ? (
        <>
          <InvoiceAISender
            accessToken={accessToken}
            initialAttachments={attachments}
            ocrUrl={ocrUrl}
            authUrl={baseAuthUrl}
            masterData={masterData}
          />
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>{attachmentsReady ? "Loading master data..." : "Waiting for attachments..."}</p>
          <pre style={{ color: "#888", fontSize: "12px", marginTop: "15px" }}>
            {JSON.stringify(
              {
                attachments: attachments?.length,
                attachmentsReady,
                masterDataLength: masterData.length,
                ocrUrl,
                baseAuthUrl,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

// ✅ Mount after Office is ready
Office.onReady().then(() => {
  console.log("📦 Office.onReady(): Mounting <Dialog /> component");

  if (Office.context.ui && Office.context.ui.messageParent) {
    Office.context.ui.messageParent("dialog-ready");
  }

  const root = document.getElementById("root");
  if (root) {
    ReactDOM.render(<Dialog />, root);
  } else {
    console.error("❌ root element not found in dialog.html");
  }
});

export default Dialog;
