import React, { useMemo } from "react";

export interface InvoiceFields {
  invoiceNumber: string;
  invoiceCurrency: string;
  invoiceDate: string;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  invoiceIssuerNameOnly: string;
  invoiceTitle: string;
  invoiceDetailSummary: string;
  voucherTaxCode: string; // legacy, now overridden by checkboxes
  accountNumber: string;
  fileNumber: string;
  costCenter: string;
}

interface MasterDataItem {
  groupe: string;
  code: string;
  label: string;
  textValue: string;
  doubleValue: number;
  isDefault: boolean;
}

interface Props {
  responseFields: InvoiceFields;
  currencies: string[];
  masterData: MasterDataItem[];
}

const InvoiceFormFields: React.FC<Props> = ({ responseFields, currencies, masterData }) => {
  const fieldGroups: string[][] = [
    ["invoiceNumber", "invoiceIssuerNameOnly"],
    ["invoiceDate", "dueDate"],
    ["invoiceTitle", "invoiceDetailSummary"],
    ["invoiceCurrency", "totalAmount"],
    ["accountNumber", "fileNumber"],
    ["costCenter"]
  ];

  const formatLabel = (field: string) =>
    field.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase());

  // ✅ Extract taxes from masterData grouped by textValue
  const taxGroups = useMemo(() => {
    const taxLines = masterData.filter((item) => item.groupe === "Taxes");
    const grouped: Record<string, MasterDataItem[]> = {};

    for (const item of taxLines) {
      if (!grouped[item.textValue]) {
        grouped[item.textValue] = [];
      }
      grouped[item.textValue].push(item);
    }

    return grouped;
  }, [masterData]);

  return (
    <div className="invoice-fields">

      {/* Static fields */}
      {fieldGroups.map((row, index) => (
        <div className="field-pair" key={index}>
          {row.map((field) => (
            <div key={field}>
              <label>{formatLabel(field)}</label>
              {field === "invoiceCurrency" ? (
                <select value={responseFields.invoiceCurrency || ""} disabled aria-label="Invoice Currency">
                  {currencies.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.toLowerCase().includes("date")
                    ? "date"
                    : field.toLowerCase().includes("amount")
                    ? "number"
                    : "text"}
                  value={responseFields[field as keyof InvoiceFields] as string | number || ""}
                  readOnly
                  placeholder={`Enter ${formatLabel(field).toLowerCase()}`}
                  title={formatLabel(field)}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ✅ Dynamic Tax Checkboxes at bottom */}
      {Object.keys(taxGroups).length > 0 && (
        <div className="tax-code-checkboxes" style={{ marginTop: "2rem" }}>
          <h4>Tax Codes</h4>
          {Object.entries(taxGroups).map(([textValue, items]) => (
            <div key={textValue} style={{ marginBottom: "1rem" }}>
              <strong>{textValue}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
                {items.map((item) => (
                  <label key={item.code}>
                    <input
                      type="checkbox"
                      checked={responseFields.voucherTaxCode?.split(",").includes(item.code)}
                      readOnly
                      disabled
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceFormFields;
