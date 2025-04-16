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

const InvoiceFormFields: React.FC<Props> = ({
  responseFields,
  currencies,
  masterData,
  setResponseFields
}) => {
  const formatNumber = (num: number): string =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [selectedTaxCodes, setSelectedTaxCodes] = useState<string[]>([]);
  const [customTaxAmounts, setCustomTaxAmounts] = useState<Record<string, number>>({});
  const [taxExcludedAmount, setTaxExcludedAmount] = useState<number>(responseFields.totalAmount);
  const [tempTotal, setTempTotal] = useState<string>(formatNumber(responseFields.totalAmount));

  const fieldGroups: string[][] = [
    ["invoiceNumber", "fileNumber"],
    ["invoiceDate", "dueDate"],
    ["invoiceCurrency"],
    ["invoiceIssuerNameOnly"],
    ["invoiceTitle"],
    ["invoiceDetailSummary"],
    ["accountNumber"],
    ["costCenter"]
  ];

  const formatLabel = (field: string) =>
    field.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase());

  const taxGroups = useMemo(() => {
    const taxLines = masterData.filter((item) => item.groupe === "Taxes");
    const grouped: Record<string, MasterDataItem[]> = {};
    for (const item of taxLines) {
      if (!grouped[item.textValue]) grouped[item.textValue] = [];
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
    if (setResponseFields) setResponseFields({ ...responseFields, [field]: value });
  };

  const toggleTaxCode = (code: string) => {
    const updated = selectedTaxCodes.includes(code)
      ? selectedTaxCodes.filter(c => c !== code)
      : [...selectedTaxCodes, code];
    setSelectedTaxCodes(updated);
  };

  const handleTaxAmountChange = (code: string, value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, ""));
    setCustomTaxAmounts((prev) => ({
      ...prev,
      [code]: isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTotal(e.target.value);
  };

  const handleTotalAmountBlur = () => {
    const parsed = parseFloat(tempTotal.replace(/,/g, ""));
    const validValue = isNaN(parsed) ? 0 : parsed;
    setTempTotal(formatNumber(validValue));
    handleFieldChange("totalAmount", validValue);
  };

  useEffect(() => {
    if (selectedTaxCodes.length === 0) {
      setTaxExcludedAmount(responseFields.totalAmount);
      return;
    }

    const totalRate = selectedTaxCodes
      .map(code => masterData.find(item => item.groupe === "Taxes" && item.code === code)?.doubleValue ?? 0)
      .reduce((a, b) => a + b, 0);

    const base = responseFields.totalAmount / (1 + totalRate);

    const totalCustom = selectedTaxCodes.reduce((sum, code) => {
      const rate = masterData.find(item => item.groupe === "Taxes" && item.code === code)?.doubleValue ?? 0;
      const fallback = base * rate;
      const value = customTaxAmounts[code] ?? fallback;
      return sum + value;
    }, 0);

    const excluded = responseFields.totalAmount - totalCustom;
    setTaxExcludedAmount(excluded >= 0 ? excluded : 0);
  }, [customTaxAmounts, responseFields.totalAmount, selectedTaxCodes, masterData]);

  return (
    <div className="invoice-fields">
      {fieldGroups.map((row, index) => (
        <div className="field-pair" key={index}>
          {row.map((field) => {
            let value = responseFields[field as keyof InvoiceFields];
            if (typeof value === "string" && value.includes("T")) value = value.split("T")[0];

            return (
              <div key={field}>
                <label>{formatLabel(field)}</label>
                {field === "invoiceCurrency" ? (
                  <Select
                    options={currencies.map((cur) => ({ value: cur, label: cur }))}
                    value={{ value: value as string, label: value as string }}
                    onChange={(opt) => {
                      const newValue = opt?.value;
                      if (typeof newValue === "string" || typeof newValue === "number") {
                        handleFieldChange(field as keyof InvoiceFields, newValue);
                      }
                    }}
                    isClearable
                    isSearchable
                    aria-label="Invoice Currency"
                    placeholder="Choose a currency"
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
                    placeholder="Choose a supplier"
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
                    type={field.toLowerCase().includes("date") ? "date" : "text"}
                    value={
                      typeof value === "string" && value.includes("T")
                        ? value.split("T")[0]
                        : (value as string)
                    }
                    onChange={(e) => handleFieldChange(field as keyof InvoiceFields, e.target.value)}
                    title={`Enter ${formatLabel(field)}`}
                    placeholder={`Enter ${formatLabel(field)}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

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

      <div style={{ marginTop: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", textAlign: "right", paddingRight: "8px" }}>
                Total Amount (Excl. Tax):
              </td>
              <td style={{ width: "70%", textAlign: "right" }}>
                <input type="text" value={formatNumber(taxExcludedAmount)} disabled title="Total Amount (Excl. Tax)" />
              </td>
            </tr>

            {selectedTaxCodes.map((code) => {
              const taxItem = masterData.find(item => item.groupe === "Taxes" && item.code === code);
              const rate = taxItem?.doubleValue ?? 0;
              const totalRate = selectedTaxCodes
                .map(code => masterData.find(item => item.groupe === "Taxes" && item.code === code)?.doubleValue ?? 0)
                .reduce((a, b) => a + b, 0);
              const base = responseFields.totalAmount / (1 + totalRate);
              const calculated = base * rate;
              const value = customTaxAmounts[code] ?? calculated;

              return (
                <tr key={code}>
                  <td style={{ textAlign: "right", paddingRight: "8px" }}>
                    {`Tax [${code}] (${(rate * 100).toFixed(1)}%)`}:
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="text"
                      value={formatNumber(value)}
                      onChange={(e) => handleTaxAmountChange(code, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}

            <tr>
              <td style={{ textAlign: "right", paddingRight: "8px" }}>Total Amount (Incl. Tax):</td>
              <td style={{ textAlign: "right" }}>
                <input
                  type="text"
                  value={tempTotal}
                  onChange={handleTotalAmountChange}
                  onBlur={handleTotalAmountBlur}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceFormFields;
