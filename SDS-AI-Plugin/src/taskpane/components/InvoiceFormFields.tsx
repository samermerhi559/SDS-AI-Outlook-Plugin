import React, { useMemo } from "react";
import Select from "react-select";

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
  voucherTaxCode: string;
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
  setResponseFields?: (fields: InvoiceFields) => void;
}

const InvoiceFormFields: React.FC<Props> = ({ responseFields, currencies, masterData, setResponseFields }) => {
  const fieldGroups: string[][] = [
    ["invoiceNumber","fileNumber"],
    ["invoiceDate", "dueDate"],
    ["invoiceIssuerNameOnly"],
    ["invoiceTitle"],
    ["invoiceDetailSummary"],
    ["invoiceCurrency", "totalAmount"],
    ["accountNumber"],
    ["costCenter"]
  ];

  const formatLabel = (field: string) =>
    field.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase());

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

  const suppliers = masterData.filter((item) => item.groupe === "Suppliers");
  const costCenters = masterData.filter((item) => item.groupe === "CostCenter");
  const accounts = masterData.filter((item) => item.groupe === "Accounts");

  const toSelectOptions = (items: MasterDataItem[]) =>
    items.map((item) => ({ value: item.code, label: `[${item.label}]` }));

  const getCurrentOption = (value: string, options: { value: string; label: string }[]) =>
    options.find((opt) => opt.value === value) || null;

  const handleFieldChange = (field: keyof InvoiceFields, value: string | number) => {
    if (setResponseFields) {
      setResponseFields({ ...responseFields, [field]: value });
    }
  };

  return (
    <div className="invoice-fields">
      {fieldGroups.map((row, index) => (
        <div className="field-pair" key={index}>
          {row.map((field) => {
            const value = responseFields[field as keyof InvoiceFields] ?? "";

            return (
              <div key={field}>
                <label>{formatLabel(field)}</label>

                {field === "invoiceCurrency" ? (
                  <Select
                    options={currencies.map((cur) => ({ value: cur, label: cur }))}
                    value={{ value: value, label: value }}
                    onChange={(opt) => handleFieldChange(field as keyof InvoiceFields, opt?.value || "")}
                    isClearable
                    isSearchable
                    aria-label="Invoice Currency"
                  />
                ) : field === "invoiceIssuerNameOnly" ? (
                  <Select
                    options={toSelectOptions(suppliers)}
                    value={getCurrentOption(value as string, toSelectOptions(suppliers))}
                    onChange={(opt) => handleFieldChange(field as keyof InvoiceFields, opt?.value || "")}
                    isClearable
                    isSearchable
                    aria-label="Supplier"
                  />
                ) : field === "costCenter" ? (
                  <Select
                    options={toSelectOptions(costCenters)}
                    value={getCurrentOption(value as string, toSelectOptions(costCenters))}
                    onChange={(opt) => handleFieldChange(field as keyof InvoiceFields, opt?.value || "")}
                    isClearable
                    isSearchable
                    aria-label="Cost Center"
                  />
                ) : field === "accountNumber" ? (
                  <Select
                    options={toSelectOptions(accounts)}
                    value={getCurrentOption(value as string, toSelectOptions(accounts))}
                    onChange={(opt) => handleFieldChange(field as keyof InvoiceFields, opt?.value || "")}
                    isClearable
                    isSearchable
                    aria-label="Account"
                  />
                ) : (
                  <input
                    type={field.toLowerCase().includes("date")
                      ? "date"
                      : field.toLowerCase().includes("amount")
                      ? "number"
                      : "text"}
                    value={
                      field.toLowerCase().includes("date") && typeof value === "string"
                        ? value.split("T")[0]
                        : value
                    }
                    onChange={(e) => handleFieldChange(field as keyof InvoiceFields, e.target.value)}
                    placeholder={`Enter ${formatLabel(field).toLowerCase()}`}
                    title={formatLabel(field)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ✅ Dynamic Tax Checkboxes */}
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
