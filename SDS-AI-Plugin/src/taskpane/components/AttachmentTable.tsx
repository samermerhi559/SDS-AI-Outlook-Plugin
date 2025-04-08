// components/AttachmentTable.tsx
import React from "react";
import { Attachment } from "../types/Attachment";

interface AttachmentTableProps {
  attachments: Attachment[];
  onSend: (attachment: Attachment) => void;
  sending: boolean;
}

const AttachmentTable: React.FC<AttachmentTableProps> = ({ attachments, onSend, sending }) => {
  return (
    <div>
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
                    onClick={() => onSend(attachment)}
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
        <p>No attachments found.</p>
      )}
    </div>
  );
};

export default AttachmentTable;
