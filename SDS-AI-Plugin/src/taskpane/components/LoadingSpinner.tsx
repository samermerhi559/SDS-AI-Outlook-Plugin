// components/LoadingSpinner.tsx
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
