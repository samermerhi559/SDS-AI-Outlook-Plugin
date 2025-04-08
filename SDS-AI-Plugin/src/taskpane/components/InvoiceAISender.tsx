// components/InvoiceAISender.tsx
import React, { useRef, useState, useEffect } from "react";
import { Attachment } from "../types/Attachment";
import { useAttachments } from "./useAttachments";
import AttachmentFilterToggle from "./AttachmentFilterToggle";
import AttachmentTable from "./AttachmentTable";
import FilePreview from "./FilePreview";
import "../../styles/global.css";
interface InvoiceAISenderProps {
  accessToken: string | null;
  initialAttachments?: Attachment[];
}

const InvoiceAISender: React.FC<InvoiceAISenderProps> = ({ accessToken, initialAttachments = [] }) => {
  const initialized = useRef(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [responseJSON, setResponseJSON] = useState("");
  const [sending, setSending] = useState(false);

  const {
    loading,
    filteredAttachments,
    setAttachments,
  } = useAttachments(initialAttachments, showAll);

  useEffect(() => {
    if (!initialized.current && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
      initialized.current = true;
    }
  }, [initialAttachments, setAttachments]);

  const sendToERP = async (attachment: Attachment) => {
    if (!attachment.fileBase64 || !accessToken) return;

    setSelectedAttachment(attachment);
    setSending(true);
    try {
      const payload = {
        fileName: attachment.name,
        fileCode: Math.floor(Math.random() * 1000000).toString(),
        fileType: 0,
        fileCategory: 0,
        fileExtension: attachment.name.split(".").pop() || "unknown",
        fileSize: attachment.size,
        fileGuid: crypto.randomUUID(),
        fileBase64: attachment.fileBase64,
        recognized: true,
      };
      const response = await fetch("https://finance-test.sds-ch.com/Vouchers/SendVoucherForOCR", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResponseJSON(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error sending to ERP", err);
    } finally {
      setSending(false);
    }
  };

  const botIconPath = "/SDS-AI-Outlook-Plugin/assets/ai-bot-icon.png";

  return (
    <div className="invoice-container">
      {(loading || sending) && (
        <>
          <div className="invoice-overlay">
            <img src={botIconPath} alt="AI Bot" className="ai-bot-animated" />
            {loading ? "Loading attachments..." : "Talking to my AI brain..."}
          </div>

          <div className="scanner-effect" />
        </>
      )}

      <div className="invoice-sidebar">
        <div className="invoice-header">
          <h3>Email Attachments</h3>
          <AttachmentFilterToggle showAll={showAll} onToggle={setShowAll} />
        </div>
        <AttachmentTable
          attachments={filteredAttachments}
          onSend={sendToERP}
          sending={sending}
        />
        {responseJSON && (
          <div className="invoice-response">
            <strong>AI Result:</strong>
            <div>{responseJSON}</div>
          </div>
        )}
      </div>

      <div className="invoice-preview-panel">
        <FilePreview attachment={selectedAttachment} />
      </div>
    </div>
  );
};

export default InvoiceAISender;