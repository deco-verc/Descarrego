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
    { label: "Manhã", key: "morning" },
    { label: "Tarde", key: "afternoon" },
    { label: "Noite", key: "night" },
    { label: "Grupo Manhã", key: "group_morning" },
    { label: "Grupo Tarde", key: "group_afternoon" },
    { label: "Grupo Noite", key: "group_night" },
  ];

  const calculateSaldo = (period: string) => {
    const entries = record[`${period}_entries` as keyof DailyRecord] as number;
    const commission = record[`${period}_commission` as keyof DailyRecord] as number;
    const prizes = record[`${period}_prizes` as keyof DailyRecord] as number;
    return entries - commission - prizes;
  };

  const getCommissionInfo = () => {
    if (!commissionSettings) return "Não configurado";
    if (record.commission_manual_override) return "Manual (Sobrescrito)";
    
    const typeMap = {
        manual: "Manual",
        percentage: "Automático (" + (commissionSettings.default_percentage || 0) + "%)",
        fixed: "Fixo"
    };
    return typeMap[commissionSettings.commission_type];
  };

  return (
    <div className={`card transition-all ${record.closed ? 'border-red-200' : record.checked ? 'border-green-200 shadow-green-50' : ''}`}>
      <div className={`border-b px-6 py-4 flex justify-between items-center transition-colors ${record.closed ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Descarrego Diário
                <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    {getCommissionInfo()}
                </span>
            </h2>
            
            <div className="flex gap-2">
                {onToggleClose && (
                    <button 
                        onClick={onToggleClose}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            record.closed 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                                : 'bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600'
                        }`}
                    >
                        {record.closed ? <Lock size={12} /> : <Unlock size={12} />}
                        {record.closed ? 'FECHADO' : 'FECHAR DIA'}
                    </button>
                )}
                
                {onToggleCheck && (
                    <button 
                        onClick={onToggleCheck}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            record.checked 
                                ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                                : 'bg-slate-200 text-slate-500 hover:bg-green-100 hover:text-green-600'
                        }`}
                    >
                        {record.checked ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {record.checked ? 'CONFERIDO' : 'CONFERIR'}
                    </button>
                )}
            </div>
        </div>

        <div className="flex gap-4 items-center text-xs text-slate-500">
           <div className="flex items-center gap-1">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               Entradas
           </div>
           <div className="flex items-center gap-1">
               <div className="w-2 h-2 bg-red-500 rounded-full"></div>
               Comissão
           </div>
           <div className="flex items-center gap-1">
               <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
               Prêmios
           </div>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {record.closed && (
            <div className="absolute inset-0 z-10 bg-white/5 cursor-not-allowed" title="Dia fechado - Reabra para editar"></div>
        )}
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="table-header w-40 text-left pl-6">ITEM</th>
              {periods.map(p => (
                <th key={p.key} className="table-header">{p.label.toUpperCase()}</th>
              ))}
              <th className="table-header bg-blue-900">DIÁRIO</th>
            </tr>
          </thead>
          <tbody>
            {/* Entradas Geral */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="table-cell font-bold text-left pl-6 bg-slate-50/50">Entradas Geral</td>
              {periods.map(p => (
                <td key={p.key} className="table-cell p-0">
                  <CurrencyInput 
                    value={record[`${p.key}_entries` as keyof DailyRecord] as number}
                    onChange={(val: number) => onChange({ [`${p.key}_entries`]: val })}
                    readOnly={record.closed}
                    className="border-none focus:bg-blue-50"
                  />
                </td>
              ))}
              <td className="table-cell font-bold bg-blue-50/30">
                {formatCurrencyBRL(record.total_entries)}
              </td>
            </tr>

            {/* Comissão */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="table-cell font-bold text-left pl-6 bg-slate-50/50 flex items-center justify-between group">
                Comissão
                <button 
                  onClick={() => !record.closed && onChange({ commission_manual_override: !record.commission_manual_override })}
                  disabled={record.closed}
                  className={`p-1 rounded hover:bg-slate-200 transition-all ${record.commission_manual_override ? 'text-red-600' : 'text-slate-400'}`}
                  title={record.commission_manual_override ? "Voltar para automático" : "Editar manualmente"}
                >
                  <Settings2 size={14} />
                </button>
              </td>
              {periods.map(p => (
                <td key={p.key} className="table-cell p-0">
                  <CurrencyInput 
                    value={record[`${p.key}_commission` as keyof DailyRecord] as number}
                    onChange={(val: number) => {
                        onChange({ 
                            [`${p.key}_commission`]: val,
                            commission_manual_override: true 
                        });
                    }}
                    readOnly={record.closed || (commissionSettings?.auto_calculate && !record.commission_manual_override)}
                    className={`border-none text-red-600 font-medium ${record.closed || (commissionSettings?.auto_calculate && !record.commission_manual_override) ? 'bg-slate-50 cursor-not-allowed opacity-80' : 'focus:bg-red-50'}`}
                  />
                </td>
              ))}
              <td className="table-cell font-bold bg-red-50/30 text-red-600">
                {formatCurrencyBRL(record.total_commission)}
              </td>
            </tr>

            {/* Prêmios */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="table-cell font-bold text-left pl-6 bg-slate-50/50">Prêmios</td>
              {periods.map(p => (
                <td key={p.key} className="table-cell p-0">
                  <CurrencyInput 
                    value={record[`${p.key}_prizes` as keyof DailyRecord] as number}
                    onChange={(val: number) => onChange({ [`${p.key}_prizes`]: val })}
                    readOnly={record.closed}
                    className="border-none text-orange-600 focus:bg-orange-50"
                  />
                </td>
              ))}
              <td className="table-cell font-bold bg-orange-50/30 text-orange-600">
                {formatCurrencyBRL(record.total_prizes)}
              </td>
            </tr>

            {/* Saldo Final */}
            <tr className="bg-slate-100/50 font-bold">
              <td className="table-cell text-left pl-6">Saldo Final</td>
              {periods.map(p => (
                <td key={p.key} className="table-cell text-green-700">
                  {formatCurrencyBRL(calculateSaldo(p.key))}
                </td>
              ))}
              <td className="table-cell font-extrabold bg-green-100 text-green-700 text-lg">
                {formatCurrencyBRL(record.total_final)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Footer / Notes */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-wider">
                <StickyNote size={16} className="text-blue-600" />
                Observações do Dia
            </label>
            <textarea 
                value={record.notes || ""}
                onChange={(e) => onChange({ notes: e.target.value })}
                readOnly={record.closed}
                className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-inner resize-none text-sm transition-all text-slate-700"
                placeholder="Ex: Movimento fraco, prêmio lançado depois, etc..."
            />
         </div>
         
         <div className="flex flex-col justify-end space-y-4">
            <div className="card p-4 bg-orange-50/30 border-orange-100">
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold text-slate-600">Despesas Extras</span>
                    <span className="font-extrabold text-orange-600">{formatCurrencyBRL(record.total_extra_expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black pt-2 border-t border-orange-100">
                    <span className="text-slate-800">Saldo Líquido</span>
                    <span className="text-green-700">{formatCurrencyBRL(record.total_net_final)}</span>
                </div>
            </div>
            
            <div className="text-[10px] text-slate-400 font-medium space-y-1">
                {record.closed_at && <p>Fechado em: {new Date(record.closed_at).toLocaleString('pt-BR')}</p>}
                {record.checked_at && <p>Conferido em: {new Date(record.checked_at).toLocaleString('pt-BR')}</p>}
                {record.updated_at && <p>Última alteração: {new Date(record.updated_at).toLocaleString('pt-BR')}</p>}
            </div>
         </div>
      </div>
    </div>
  );
}
