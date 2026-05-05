"use client";

import { DailyRecord } from "@/types";
import { calculatePeriodTotals } from "@/lib/calculations";
import { formatCurrencyBRL } from "@/lib/currency";
import { TrendingUp, Percent, Gift, Wallet } from "lucide-react";

interface TotalsSectionProps {
  record: DailyRecord | null;
}

export default function TotalsSection({ record }: TotalsSectionProps) {
  if (!record) return null;

  const periodTotals = calculatePeriodTotals(record);

  return (
    <div className="space-y-8">
      {/* Períodos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(periodTotals).map(([key, data]) => (
          <div key={key} className="card p-5 border-l-4 border-l-blue-600">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">
                Total {key === 'morning' ? 'Manhã' : key === 'afternoon' ? 'Tarde' : 'Noite'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Entradas</span>
                <span className="font-bold">{formatCurrencyBRL(data.entries)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Comissão</span>
                <span className="text-red-500">{formatCurrencyBRL(data.commission)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Prêmios</span>
                <span className="text-orange-500">{formatCurrencyBRL(data.prizes)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="font-bold text-slate-800">Saldo</span>
                <span className={`font-extrabold ${data.total >=0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyBRL(data.total)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totais do Dia */}
      <div className="card shadow-lg border-blue-100 overflow-visible relative">
        <div className="absolute -top-3 left-6 px-4 py-1 bg-blue-700 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-md">
            Totais do Dia
        </div>
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <TrendingUp size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Valor Bruto</p>
                <p className="text-xl font-black text-slate-800">{formatCurrencyBRL(record.total_entries)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
              <Percent size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Comissão</p>
                <p className="text-xl font-black text-red-600">{formatCurrencyBRL(record.total_commission)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-400">
              <Gift size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Prêmios</p>
                <p className="text-xl font-black text-orange-600">{formatCurrencyBRL(record.total_prizes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl text-green-600">
              <Wallet size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Final</p>
                <p className="text-2xl font-black text-green-600">{formatCurrencyBRL(record.total_final)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
