import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/SDS-AI-Outlook-Plugin/src/pdf.worker.min.mjs`;

export interface Attachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
  fileBase64?: string;
}

interface InvoiceAISenderProps {
  accessToken: string | null;
  initialAttachments?: Attachment[];
}

const InvoiceAISender: React.FC<InvoiceAISenderProps> = ({ accessToken, initialAttachments = [] }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [responseJSON, setResponseJSON] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const initialized = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      console.error("Access token is missing.");
      return;
    }

    if (!initialized.current && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
      initialized.current = true;
      setLoading(false);
    }
  }, [accessToken, initialAttachments]);

  const filteredAttachments = showAll
    ? attachments
    : attachments.filter((att) => att.name.toLowerCase().endsWith(".pdf"));

  const sendToERP = async (attachment: Attachment) => {
    if (!attachment.fileBase64) {
      console.error("Attachment content is missing.");
      return;
    }

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

      const responseData = await response.json();
      setResponseJSON(JSON.stringify(responseData, null, 2));
      setSelectedAttachment(attachment);
    } catch (error) {
      console.error("Error sending attachment to ERP:", error);
    } finally {
      setSending(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      {/* LEFT PANEL */}
      <div style={{ flex: "0 0 40%", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto" }}>
        <h2>Invoice AI Sender</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div className="spinner" />
            <p>Loading attachments...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "10px" }}>
              <label>
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  style={{ marginRight: "5px" }}
                />
                Show All Attachments
              </label>
            </div>

            <h3>Email Attachments</h3>
            {filteredAttachments.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>File Name</th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>File Size (KB)</th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttachments.map((attachment) => (
                    <tr key={attachment.id}>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{attachment.name}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{(attachment.size / 1024).toFixed(2)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        <button
                          onClick={() => sendToERP(attachment)}
                          disabled={sending}
                          style={{
                            padding: "5px 10px",
                            backgroundColor: sending ? "#999" : "#0078d4",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: sending ? "not-allowed" : "pointer",
                          }}
                        >
                          {sending ? "Sending..." : "Send to ERP"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No {showAll ? "" : "PDF "}attachments found.</p>
            )}

            <div>
              <label htmlFor="apiResponse">API Response</label>
              <textarea
                id="apiResponse"
                value={responseJSON}
                readOnly
                placeholder="API response will appear here"
                className="api-response-textarea"
                style={{ width: "100%", height: "150px", padding: "10px", fontFamily: "monospace" }}
              ></textarea>
            </div>
          </>
        )}
      </div>

      {/* RIGHT PANEL - PDF/Image Preview */}
      <div style={{ flex: "0 0 60%", padding: "20px", overflowY: "auto", backgroundColor: "#f9f9f9" }}>
        {selectedAttachment ? (
          selectedAttachment.fileBase64 &&
          (selectedAttachment.name.toLowerCase().endsWith(".pdf") ? (
            <div style={{ textAlign: "center" }}>
              <Document
                file={`data:application/pdf;base64,${selectedAttachment.fileBase64}`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="spinner" />}
              >
                <Page pageNumber={currentPage} width={600} />
              </Document>
              {numPages > 1 && (
                <div style={{ marginTop: "10px" }}>
                  <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage <= 1}>
                    Prev
                  </button>
                  <span style={{ margin: "0 10px" }}>
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, numPages))}
                    disabled={currentPage >= numPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : selectedAttachment.contentType.startsWith("image/") ? (
            <img
              src={`data:${selectedAttachment.contentType};base64,${selectedAttachment.fileBase64}`}
              alt={selectedAttachment.name}
              style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }}
            />
          ) : (
            <p>Preview not supported for this file type.</p>
          ))
        ) : (
          <p style={{ color: "#888" }}>Select an attachment to preview.</p>
        )}
      </div>
    </div>
  );
};

export default InvoiceAISender;
