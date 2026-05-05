"use client";

import { useEffect, useState } from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  readOnly?: boolean;
}

export default function CurrencyInput({ value, onChange, className = "", readOnly = false }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    
    // Pegar apenas os números
    const digits = e.target.value.replace(/\D/g, "");
    
    // Converter para centavos
    const numericValue = parseInt(digits || "0", 10) / 100;
    
    // Limite de segurança (ex: 1 bilhão)
    if (numericValue > 1000000000) return;

    setDisplayValue(formatValue(numericValue));
    onChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (readOnly) return;
    e.target.select();
  };

  return (
    <div className={`flex items-center w-full h-full min-h-[48px] group transition-all px-3 ${readOnly ? 'bg-slate-50/50' : 'hover:bg-blue-50/30'}`}>
      <span className="text-slate-300 text-[10px] font-bold mr-1 shrink-0">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        readOnly={readOnly}
        className={`w-full h-full outline-none bg-transparent font-semibold text-right text-slate-700 placeholder:text-slate-200 transition-colors ${readOnly ? 'cursor-not-allowed text-slate-400' : 'focus:text-blue-700'} ${className}`}
        placeholder="0,00"
      />
    </div>
  );
}
