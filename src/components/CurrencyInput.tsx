"use client";

import { useEffect, useState } from "react";
import { parseCurrencyInput } from "@/lib/currency";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  readOnly?: boolean;
}

export default function CurrencyInput({ value, onChange, className = "", readOnly = false }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    // Only update display if not currently focused to avoid jumping while typing
    if (document.activeElement !== document.getElementById(`input-${value}`)) {
      setDisplayValue(value === 0 ? "0,00" : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow digits and one comma/dot
    val = val.replace(/[^\d,.]/g, '');
    setDisplayValue(val);
  };

  const handleBlur = () => {
    const numericValue = parseCurrencyInput(displayValue);
    onChange(numericValue);
    setDisplayValue(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (value === 0) setDisplayValue("");
    e.target.select();
  };

  return (
    <div className="flex items-center w-full h-full min-h-[44px]">
      <span className="pl-3 text-slate-400 text-sm font-medium">R$</span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        readOnly={readOnly}
        className={`w-full h-full px-1 text-center outline-none bg-transparent font-medium ${className}`}
        placeholder="0,00"
      />
    </div>
  );
}
