// components/AttachmentFilterToggle.tsx
import React from "react";

interface AttachmentFilterToggleProps {
  showAll: boolean;
  onToggle: (checked: boolean) => void;
}

const AttachmentFilterToggle: React.FC<AttachmentFilterToggleProps> = ({ showAll, onToggle }) => {
  return (
    <div style={{ marginBottom: "10px" }}>
      <label>
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ marginRight: "5px" }}
        />
        Show All Attachments
      </label>
    </div>
  );
};

export default AttachmentFilterToggle;