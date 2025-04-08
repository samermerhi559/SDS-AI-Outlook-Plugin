// components/FilePreview.tsx
import React from "react";
import { Attachment } from "../types/Attachment";
import PdfPreview from "./PdfPreview";
import ImagePreview from "./ImagePreview";

interface FilePreviewProps {
  attachment: Attachment | null;
}

const FilePreview: React.FC<FilePreviewProps> = ({ attachment }) => {
  if (!attachment) {
    return <p style={{ color: "#888" }}>Select an attachment to preview.</p>;
  }

  if (attachment.name.toLowerCase().endsWith(".pdf")) {
    return <PdfPreview base64={attachment.fileBase64 || ""} />;
  }

  if (attachment.contentType.startsWith("image/")) {
    return <ImagePreview base64={attachment.fileBase64 || ""} contentType={attachment.contentType} alt={attachment.name} />;
  }

  return <p>Preview not supported for this file type.</p>;
};

export default FilePreview;