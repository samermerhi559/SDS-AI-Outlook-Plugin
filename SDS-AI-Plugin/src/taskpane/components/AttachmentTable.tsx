// AttachmentTable.tsx
import React from "react";
import { Attachment } from "../types/Attachment";

interface Props {
  attachments: Attachment[];
  onSend: (attachment: Attachment) => void;
  sending: boolean;
}

const AttachmentTable: React.FC<Props> = ({ attachments, onSend, sending }) => {
  return (
    <div className="attachment-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map((att, index) => (
            <tr key={index}>
              <td>{att.name}</td>
              <td>{(att.size / 1024).toFixed(2)} KB</td>
              <td>
                <button onClick={() => onSend(att)} disabled={sending}>
                  {sending ? "Sending..." : "Send to ERP"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttachmentTable;