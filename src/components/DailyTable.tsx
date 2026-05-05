"use client";

import { DailyRecord, CommissionSettings } from "@/types";
import { formatCurrencyBRL } from "@/lib/currency";
import CurrencyInput from "./CurrencyInput";
import { Info, Settings2, Lock, Unlock, CheckCircle2, Circle, StickyNote } from "lucide-react";

interface DailyTableProps {
  record: DailyRecord | null;
  onChange: (updates: Partial<DailyRecord>) => void;
  commissionSettings: CommissionSettings | null;
  onToggleClose?: () => void;
  onToggleCheck?: () => void;
}

export default function DailyTable({ record, onChange, commissionSettings, onToggleClose, onToggleCheck }: DailyTableProps) {
  if (!record) return null;

  const periods = [
    { label: "Manhã", key: "morning", type: 'milhar' },
    { label: "Tarde", key: "afternoon", type: 'milhar' },
    { label: "Noite", key: "night", type: 'milhar' },
    { label: "Grupo Manhã", key: "group_morning", type: 'grupo' },
    { label: "Grupo Tarde", key: "group_afternoon", type: 'grupo' },
    { label: "Grupo Noite", key: "group_night", type: 'grupo' },
  ];

  const calculateSaldo = (period: string) => {
    const entries = record[`${period}_entries` as keyof DailyRecord] as number;
    const commission = record[`${period}_commission` as keyof DailyRecord] as number;
    const prizes = record[`${period}_prizes` as keyof DailyRecord] as number;
    return entries - commission - prizes;
  };

  return (
    <div className="overflow-x-auto relative">
      {record.closed && (
        <div className="absolute inset-0 z-10 bg-white/5 cursor-not-allowed" title="Dia fechado - Reabra para editar"></div>
      )}
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-800">
            <th className="py-4 px-6 text-left text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-700 w-48">AÇÕES DO DIA</th>
            {periods.map(p => (
              <th key={p.key} className="py-4 px-2 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-700 bg-slate-800/95">
                {p.label}
              </th>
            ))}
            <th className="py-4 px-4 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-blue-800 bg-blue-900 shadow-xl">DIÁRIO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {/* Entradas Geral */}
          <tr className="group transition-colors hover:bg-blue-50/20">
            <td className="py-4 px-6 bg-slate-50 border-r border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Entradas Geral</span>
              </div>
            </td>
            {periods.map(p => (
              <td key={p.key} className="p-0 border-r border-slate-50">
                <CurrencyInput 
                  value={record[`${p.key}_entries` as keyof DailyRecord] as number}
                  onChange={(val: number) => onChange({ [`${p.key}_entries`]: val })}
                  readOnly={record.closed}
                />
              </td>
            ))}
            <td className="py-4 px-4 bg-blue-50/50 text-center border-l-2 border-l-blue-200">
              <span className="text-sm font-black text-blue-800">
                {formatCurrencyBRL(record.total_entries)}
              </span>
            </td>
          </tr>

          {/* Comissão */}
          <tr className="group transition-colors hover:bg-red-50/20">
            <td className="py-4 px-6 bg-slate-50 border-r border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Comissão</span>
              </div>
            </td>
            {periods.map(p => (
              <td key={p.key} className="p-0 border-r border-slate-50">
                <CurrencyInput 
                  value={record[`${p.key}_commission` as keyof DailyRecord] as number}
                  onChange={(val: number) => {
                      onChange({ 
                          [`${p.key}_commission`]: val,
                          commission_manual_override: true 
                      });
                  }}
                  readOnly={record.closed || (commissionSettings?.auto_calculate && !record.commission_manual_override)}
                  className={`text-red-600 ${record.closed || (commissionSettings?.auto_calculate && !record.commission_manual_override) ? 'opacity-60' : ''}`}
                />
              </td>
            ))}
            <td className="py-4 px-4 bg-red-50/50 text-center border-l-2 border-l-red-200">
              <span className="text-sm font-black text-red-700">
                {formatCurrencyBRL(record.total_commission)}
              </span>
            </td>
          </tr>

          {/* Prêmios */}
          <tr className="group transition-colors hover:bg-orange-50/20">
            <td className="py-4 px-6 bg-slate-50 border-r border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Prêmios</span>
              </div>
            </td>
            {periods.map(p => (
              <td key={p.key} className="p-0 border-r border-slate-50">
                <CurrencyInput 
                  value={record[`${p.key}_prizes` as keyof DailyRecord] as number}
                  onChange={(val: number) => onChange({ [`${p.key}_prizes`]: val })}
                  readOnly={record.closed}
                  className="text-orange-600"
                />
              </td>
            ))}
            <td className="py-4 px-4 bg-orange-50/50 text-center border-l-2 border-l-orange-200">
              <span className="text-sm font-black text-orange-700">
                {formatCurrencyBRL(record.total_prizes)}
              </span>
            </td>
          </tr>

          {/* Saldo Final */}
          <tr className="bg-slate-50/50">
            <td className="py-6 px-6 border-r border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800">Saldo Final</span>
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Resultado Operacional</span>
              </div>
            </td>
            {periods.map(p => (
              <td key={p.key} className="text-center border-r border-slate-100">
                <span className={`text-sm font-bold ${calculateSaldo(p.key) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrencyBRL(calculateSaldo(p.key))}
                </span>
              </td>
            ))}
            <td className="py-6 px-4 bg-green-50 text-center border-l-4 border-l-green-500">
              <span className="text-xl font-black text-green-700">
                {formatCurrencyBRL(record.total_final)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
