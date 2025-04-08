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

interface InvoiceFields {
  invoiceNumber: string;
  invoiceCurrency: string;
  invoiceDate: string;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  invoiceIssuerNameOnly: string;
  invoiceTitle: string;
  invoiceDetailSummary: string;
  voucherTaxCode: string;
  accountNumber: string;
  fileNumber: string;
  costCenter: string;
}

const InvoiceAISender: React.FC<InvoiceAISenderProps> = ({ accessToken, initialAttachments = [] }) => {
  const initialized = useRef(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [responseFields, setResponseFields] = useState<InvoiceFields | null>(null);
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
      setResponseFields(data);
    } catch (err) {
      console.error("Error sending to ERP", err);
    } finally {
      setSending(false);
    }
  };

  const botIconPath = "/SDS-AI-Outlook-Plugin/assets/ai-bot-icon.png";
  const currencies = ["USD", "EUR", "CHF", "GBP", "TND", "NZD", "AOA", "CFA", "GYD", "ZAR", "NAD"];
  const taxCodes = ["0", "10", "19", "20"];

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

        {responseFields && (
          <div className="invoice-fields">
            <div className="field-pair">
              <input value={responseFields.invoiceNumber || ""} readOnly placeholder="Invoice Number" />
              <input value={responseFields.invoiceIssuerNameOnly || ""} readOnly placeholder="Issuer Name" />
            </div>
            <div className="field-pair">
              <input value={responseFields.invoiceDate?.slice(0, 10) || ""} readOnly placeholder="Invoice Date" type="date" />
              <input value={responseFields.dueDate?.slice(0, 10) || ""} readOnly placeholder="Due Date" type="date" />
            </div>
            <div className="field-pair">
              <input value={responseFields.invoiceTitle || ""} readOnly placeholder="Invoice Title" />
              <input value={responseFields.invoiceDetailSummary || ""} readOnly placeholder="Summary" />
            </div>
            <div className="field-pair">
              <select value={responseFields.invoiceCurrency || ""} disabled aria-label="Invoice Currency">
                {currencies.map((cur) => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
              <input value={responseFields.totalAmount.toFixed(2)} readOnly placeholder="Total Amount" type="number" />
            </div>
            <div className="field-pair">
              <select value={responseFields.voucherTaxCode || ""} disabled aria-label="Voucher Tax Code">
                {taxCodes.map((code) => (
                  <option key={code} value={code}>{code}%</option>
                ))}
              </select>
              <input value={responseFields.taxAmount.toFixed(2)} readOnly placeholder="Tax Amount" type="number" />
            </div>
            <div className="field-pair">
              <input value={responseFields.accountNumber || ""} readOnly placeholder="Account Number" />
              <input value={responseFields.fileNumber || ""} readOnly placeholder="File Number" />
            </div>
            <div className="field-pair">
              <input value={responseFields.costCenter || ""} readOnly placeholder="Cost Center" />
            </div>
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
