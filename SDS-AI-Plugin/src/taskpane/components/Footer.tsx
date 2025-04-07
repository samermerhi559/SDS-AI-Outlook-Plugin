import React from "react";

const Footer: React.FC = () => {
  return (
    <footer style={{ textAlign: "center", marginTop: "20px" }}>
      <p>Version: {APP_VERSION}</p>
    </footer>
  );
};

export default Footer;