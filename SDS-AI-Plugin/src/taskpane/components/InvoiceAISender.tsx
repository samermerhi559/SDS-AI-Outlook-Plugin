import React, { useEffect, useState } from "react";

interface InvoiceAISenderProps {
  accessToken: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

const InvoiceAISender: React.FC<InvoiceAISenderProps> = ({ accessToken }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [responseJSON, setResponseJSON] = useState<string>("");

  useEffect(() => {
    // Check if the Office API is available
    console.log("Office API available:", !!(window as any).Office);
    if (Office && Office.context && Office.context.mailbox && Office.context.mailbox.item) {
      const emailAttachments = Office.context.mailbox.item.attachments || [];
      setAttachments(emailAttachments as Attachment[]);
    }
  }, []);

  const sendToERP = async (attachment: Attachment) => {
    try {
      // Get the attachment content as Base64
      Office.context.mailbox.item.getAttachmentContentAsync(attachment.id, async (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const fileBase64 = result.value.content;

          // Prepare the payload
          const payload = {
            fileName: attachment.name,
            fileCode: Math.floor(Math.random() * 1000000).toString(), // Random number
            fileType: 0,
            fileCategory: 0,
            fileExtension: attachment.name.split(".").pop() || "unknown", // Extract file extension
            fileSize: attachment.size,
            fileGuid: crypto.randomUUID(), // Generate a GUID
            fileBase64: fileBase64,
            recognized: true,
          };

          // Send the payload to the API
          const response = await fetch("https://finance-test.sds-ch.com/Vouchers/SendVoucherForOCR", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`, // Pass the access token if required
            },
            body: JSON.stringify(payload),
          });

          const responseData = await response.json();
          setResponseJSON(JSON.stringify(responseData, null, 2)); // Pretty-print the JSON
        } else {
          console.error("Failed to get attachment content:", result.error);
        }
      });
    } catch (error) {
      console.error("Error sending attachment to ERP:", error);
    }
  };

  return (
    <div className="container">
      <h2>Invoice AI Sender</h2>
      <div>
        <label htmlFor="access-token">Access Token:</label>
        <input
          id="access-token"
          type="text"
          value={accessToken}
          readOnly
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <h3>Email Attachments</h3>
        {attachments.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>File Name</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>File Size (KB)</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{attachment.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{(attachment.size / 1024).toFixed(2)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={() => sendToERP(attachment)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#0078d4",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Send to ERP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No attachments found.</p>
        )}
      </div>
      <div>
        <h3>API Response</h3>
        <textarea
          className="textarea"
          value={responseJSON}
          readOnly
          title="API Response"
          placeholder="API response will appear here"
        />
      </div>
    </div>
  );
};

export default InvoiceAISender;