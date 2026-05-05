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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Valor Bruto */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Bruto</span>
        <span className="text-xl font-black text-slate-800">{formatCurrencyBRL(record.total_entries)}</span>
      </div>

      {/* Comissão */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comissão</span>
        <span className="text-xl font-black text-red-600">{formatCurrencyBRL(record.total_commission)}</span>
      </div>

      {/* Prêmios */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prêmios</span>
        <span className="text-xl font-black text-orange-600">{formatCurrencyBRL(record.total_prizes)}</span>
      </div>

      {/* Saldo Líquido */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group bg-green-50/20">
        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Líquido</span>
        <span className="text-2xl font-black text-green-700">{formatCurrencyBRL(record.total_net_final)}</span>
      </div>
    </div>
  );
}
