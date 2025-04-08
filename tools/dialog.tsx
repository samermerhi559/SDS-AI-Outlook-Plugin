import React from "react";
import ReactDOM from "react-dom";
import InvoiceAISender from "../src/taskpane/components/InvoiceAISender";

// Extract the accessToken from the query string
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("accessToken");

ReactDOM.render(
  <React.StrictMode>
    <InvoiceAISender accessToken={accessToken} />
  </React.StrictMode>,
  document.getElementById("root")
);