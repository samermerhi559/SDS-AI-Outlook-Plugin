// components/ImagePreview.tsx
import React from "react";

interface ImagePreviewProps {
  base64: string;
  contentType: string;
  alt: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ base64, contentType, alt }) => {
  return (
    <img
      src={`data:${contentType};base64,${base64}`}
      alt={alt}
      style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }}
    />
  );
};

export default ImagePreview;
