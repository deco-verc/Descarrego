"use client";

import { DailyRecord } from "@/types";
import { formatCurrencyBRL } from "@/lib/currency";
import { TrendingUp, Percent, Gift, Wallet, ArrowDownCircle, ArrowUpCircle, Banknote, Receipt } from "lucide-react";

interface TotalsSectionProps {
  record: DailyRecord | null;
}

export default function TotalsSection({ record }: TotalsSectionProps) {
  if (!record) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Bruto e Entradas */}
        <div className="card p-6 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110">
            <TrendingUp size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
               <Banknote size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Resumo de Vendas</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-xs font-bold text-slate-400">Total Bruto</span>
                <span className="text-lg font-bold text-slate-700">{formatCurrencyBRL(record.total_entries)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-xs font-bold text-slate-400">(-) Comissão</span>
                <span className="text-sm font-bold text-red-500">{formatCurrencyBRL(record.total_commission)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400">(=) Saldo Operacional</span>
                <span className="text-sm font-black text-slate-800">{formatCurrencyBRL(record.total_entries - record.total_commission)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Saídas e Líquido */}
        <div className="card p-6 bg-slate-50 border-none shadow-inner overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110 text-green-600">
            <Wallet size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-green-600">
               <Receipt size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Fechamento Final</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">Prêmios Pagos</span>
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tight">Total saídas</span>
                </div>
                <span className="text-base font-bold text-orange-600">-{formatCurrencyBRL(record.total_prizes)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">Despesas Extras</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ex: luz, internet...</span>
                </div>
                <span className="text-base font-bold text-slate-500">-{formatCurrencyBRL(record.total_extra_expenses)}</span>
              </div>

              <div className="pt-4 bg-white -mx-6 -mb-6 p-6 mt-4">
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Líquido</span>
                      <span className="text-[8px] text-green-500 font-bold uppercase">Disponível para caixa</span>
                   </div>
                   <span className={`text-2xl font-black ${record.total_net_final >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrencyBRL(record.total_net_final)}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
