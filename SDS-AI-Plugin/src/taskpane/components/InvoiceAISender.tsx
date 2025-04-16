// ✅ InvoiceAISender.tsx
import React, { useRef, useState, useEffect } from "react";
import { Attachment } from "../types/Attachment";
import { useAttachments } from "./useAttachments";
import AttachmentFilterToggle from "./AttachmentFilterToggle";
import AttachmentTable from "./AttachmentTable";
import FilePreview from "./FilePreview";
import "../../styles/global.css";
import { logoutAndReload } from "../../session";
import { refreshTokenAndPost } from "../../secureFetch";
import InvoiceFormFields from "./InvoiceFormFields";

interface InvoiceAISenderProps {
  accessToken: string | null;
  initialAttachments?: Attachment[];
  ocrUrl: string;
  authUrl: string;
  masterData?: any[];
}

interface InvoiceSuggestions {
  suggestedSupplierCode?: string;
  suggestedCostCenter?: string;
  suggestedAccountNumber?: string;
  suggestedTaxCodes?: string;
  suggestedTaxCodeList?: string[];
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
  suggestions?: InvoiceSuggestions;
}

const isValidVoucherResponse = (data: any): data is InvoiceFields => {
  return data && typeof data === "object" && "invoiceNumber" in data && "totalAmount" in data;
};

const InvoiceAISender: React.FC<InvoiceAISenderProps> = ({
  accessToken,
  initialAttachments = [],
  ocrUrl,
  authUrl,
  masterData = [],
}) => {
  const initialized = useRef(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [responseFields, setResponseFields] = useState<InvoiceFields | null>(null);
  const [sending, setSending] = useState(false);

  const safeAttachments = Array.isArray(initialAttachments) ? initialAttachments : [];
  const {
    loading,
    filteredAttachments,
    setAttachments,
  } = useAttachments(safeAttachments, showAll);

  useEffect(() => {
    if (!initialized.current && safeAttachments.length > 0) {
      setAttachments(safeAttachments);
      initialized.current = true;
    }
  }, [safeAttachments, setAttachments]);

  useEffect(() => {
    if (safeAttachments.length > 0 && loading) {
      setAttachments(safeAttachments);
    }
  }, [safeAttachments, loading, setAttachments]);

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

      const data = await refreshTokenAndPost(ocrUrl, payload, authUrl);
      if (!data) return;

      if (!isValidVoucherResponse(data)) {
        logoutAndReload();
        return;
      }

      const suggestions = data.suggestions || {};
      const updatedFields: InvoiceFields = {
        ...data,
        invoiceIssuerNameOnly: suggestions.suggestedSupplierCode || data.invoiceIssuerNameOnly,
        costCenter: suggestions.suggestedCostCenter || data.costCenter,
        accountNumber: suggestions.suggestedAccountNumber || data.accountNumber,
      };

      setResponseFields(updatedFields);
    } catch (err) {
      console.error("Error sending to ERP", err);
    } finally {
      setSending(false);
    }
  };

  const botIconPath = "/SDS-AI-Outlook-Plugin/assets/ai-bot-icon.png";
  const currencies = ["USD", "EUR", "CHF", "GBP", "TND", "NZD", "AOA", "CFA", "GYD", "ZAR", "NAD"];

  return (
    <div className="invoice-container">
      {(loading || sending) && (
        <>
          <div className="invoice-overlay">
            <img src={botIconPath} alt="AI Bot" className="ai-bot-animated" />
            {loading ? "Loading attachments..." : <><span>Analyzing content...</span><span>Just a moment...</span></>}
          </div>
          <div className="scanner-effect" />
        </>
      )}

      <div className="invoice-sidebar" style={{ maxWidth: 600 }}>
        <div className="invoice-header">
          <AttachmentFilterToggle showAll={showAll} onToggle={setShowAll} />
        </div>

        <div className="attachment-table">
          <AttachmentTable
            attachments={filteredAttachments}
            onSend={sendToERP}
            sending={sending}
          />
        </div>

        {responseFields && (
          <InvoiceFormFields
            responseFields={responseFields}
            setResponseFields={setResponseFields}
            currencies={currencies}
            masterData={masterData}
          />
        )}
      </div>

      <div className="invoice-preview-panel">
        <FilePreview attachment={selectedAttachment} />
      </div>
    </div>
  );
};

export default InvoiceAISender;