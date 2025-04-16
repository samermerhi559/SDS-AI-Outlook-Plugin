// ✅ InvoiceFormFields.tsx — layout reordered & dynamic tax-excluded calculation
import React, { useMemo, useState, useEffect } from "react";
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
  suggestions?: {
    suggestedSupplierCode?: string;
    suggestedCostCenter?: string;
    suggestedAccountNumber?: string;
    suggestedTaxCodes?: string;
    suggestedTaxCodeList?: string[];
  };
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
  const [selectedTaxCodes, setSelectedTaxCodes] = useState<string[]>([]);
  const [customTaxAmounts, setCustomTaxAmounts] = useState<Record<string, number>>({});
  const [taxExcludedAmount, setTaxExcludedAmount] = useState<number>(0);

  const fieldGroups: string[][] = [
    ["invoiceNumber", "fileNumber"],
    ["invoiceDate", "dueDate"],
    ["invoiceIssuerNameOnly"],
    ["invoiceTitle"],
    ["invoiceDetailSummary"],
    ["accountNumber"],
    ["costCenter"] // "totalAmount" moved to bottom
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

  const toggleTaxCode = (code: string) => {
    const updated = selectedTaxCodes.includes(code)
      ? selectedTaxCodes.filter(c => c !== code)
      : [...selectedTaxCodes, code];
    setSelectedTaxCodes(updated);
  };

  const handleTaxAmountChange = (code: string, value: string) => {
    const numericValue = parseFloat(value);
    setCustomTaxAmounts((prev) => ({ ...prev, [code]: isNaN(numericValue) ? 0 : numericValue }));
  };

  useEffect(() => {
    const totalCustom = selectedTaxCodes.reduce((sum, code) => sum + (customTaxAmounts[code] || 0), 0);
    setTaxExcludedAmount(responseFields.totalAmount - totalCustom);
  }, [customTaxAmounts, responseFields.totalAmount, selectedTaxCodes]);

  return (
    <div className="invoice-fields">
      {fieldGroups.map((row, index) => (
        <div className="field-pair" key={index}>
          {row.map((field) => {
            const value = typeof responseFields[field as keyof InvoiceFields] === "object"
              ? ""
              : responseFields[field as keyof InvoiceFields] ?? "";

            return (
              <div key={field}>
                <label>{formatLabel(field)}</label>
                {field === "invoiceCurrency" ? (
                  <Select
                    options={currencies.map((cur) => ({ value: cur, label: cur }))}
                    value={{ value: value, label: value }}
                    onChange={(opt) => {
                      const newValue = opt?.value;
                      if (typeof newValue === "string" || typeof newValue === "number") {
                        handleFieldChange(field as keyof InvoiceFields, newValue);
                      }
                    }}
                    isClearable
                    isSearchable
                    aria-label="Invoice Currency"
                  />
                ) : field === "invoiceIssuerNameOnly" ? (
                  <Select
                    options={toSelectOptions(suppliers)}
                    value={getCurrentOption(value as string, toSelectOptions(suppliers))}
                    onChange={(opt) => {
                      const newValue = opt?.value;
                      if (typeof newValue === "string" || typeof newValue === "number") {
                        handleFieldChange(field as keyof InvoiceFields, newValue);
                      }
                    }}
                    isClearable
                    isSearchable
                    aria-label="Supplier"
                  />
                ) : field === "costCenter" ? (
                  <Select
                    options={toSelectOptions(costCenters)}
                    value={getCurrentOption(value as string, toSelectOptions(costCenters))}
                    onChange={(opt) => {
                      const newValue = opt?.value;
                      if (typeof newValue === "string" || typeof newValue === "number") {
                        handleFieldChange(field as keyof InvoiceFields, newValue);
                      }
                    }}
                    isClearable
                    isSearchable
                    aria-label="Cost Center"
                  />
                ) : field === "accountNumber" ? (
                  <Select
                    options={toSelectOptions(accounts)}
                    value={getCurrentOption(value as string, toSelectOptions(accounts))}
                    onChange={(opt) => {
                      const newValue = opt?.value;
                      if (typeof newValue === "string" || typeof newValue === "number") {
                        handleFieldChange(field as keyof InvoiceFields, newValue);
                      }
                    }}
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
                    value={typeof value === "string" || typeof value === "number" ? value : ""}
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

      {/* ✅ Tax Section */}
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
                      checked={selectedTaxCodes.includes(item.code)}
                      onChange={() => toggleTaxCode(item.code)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTaxCodes.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h4>Tax Calculation Summary</h4>
          <div className="field-pair">
            <label>Total Amount (Excl. Tax)</label>
            <input
              type="number"
              value={taxExcludedAmount.toFixed(2)}
              disabled
              title="Total Amount Excluding Tax"
              placeholder="Total Amount Excluding Tax"
            />
          </div>
          {selectedTaxCodes.map(code => {
            const taxItem = masterData.find(item => item.groupe === "Taxes" && item.code === code);
            const rate = taxItem?.doubleValue ?? 0;
            const totalRate = selectedTaxCodes
              .map(code => masterData.find(item => item.groupe === "Taxes" && item.code === code)?.doubleValue ?? 0)
              .reduce((a, b) => a + b, 0);
            const base = responseFields.totalAmount / (1 + totalRate);
            const calculated = base * rate;
            const value = customTaxAmounts[code] ?? calculated;

            return (
              <div key={code} className="field-pair">
                <label>{`Tax [${code}] (${(rate * 100).toFixed(1)}%)`}</label>
                <input
                  type="number"
                  value={value.toFixed(2)}
                  onChange={(e) => handleTaxAmountChange(code, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="field-pair" style={{ marginTop: "2rem" }}>
        <label>Total Amount (Incl. Tax)</label>
        <input
          type="number"
          value={responseFields.totalAmount}
          onChange={(e) => handleFieldChange("totalAmount", parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
};

export default InvoiceFormFields;
