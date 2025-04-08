// components/PdfPreview.tsx
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/SDS-AI-Outlook-Plugin/src/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  base64: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ base64 }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <Document
        file={`data:application/pdf;base64,${base64}`}
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
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, numPages))} disabled={currentPage >= numPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfPreview;