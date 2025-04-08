// components/ApiResponse.tsx
import React from "react";

interface ApiResponseProps {
  value: string;
}

const ApiResponse: React.FC<ApiResponseProps> = ({ value }) => {
  return (
    <div>
      <label htmlFor="apiResponse">API Response</label>
      <textarea
        id="apiResponse"
        value={value}
        readOnly
        placeholder="API response will appear here"
        className="api-response-textarea"
        style={{ width: "100%", height: "150px", padding: "10px", fontFamily: "monospace" }}
      ></textarea>
    </div>
  );
};

export default ApiResponse;
