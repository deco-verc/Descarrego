"use client";

import { DailyRecord } from "@/types";
import { formatCurrencyBRL } from "@/lib/currency";
import { Sun, CloudSun, Moon } from "lucide-react";

interface PeriodTotalsSectionProps {
  record: DailyRecord | null;
}

export default function PeriodTotalsSection({ record }: PeriodTotalsSectionProps) {
  if (!record) return null;

  const periods = [
    {
      name: "Manhã Total",
      icon: <Sun size={16} className="text-orange-400" />,
      entries: record.morning_entries + record.group_morning_entries,
      commission: record.morning_commission + record.group_morning_commission,
      prizes: record.morning_prizes + record.group_morning_prizes,
      color: "blue"
    },
    {
      name: "Tarde Total",
      icon: <CloudSun size={16} className="text-blue-400" />,
      entries: record.afternoon_entries + record.group_afternoon_entries,
      commission: record.afternoon_commission + record.group_afternoon_commission,
      prizes: record.afternoon_prizes + record.group_afternoon_prizes,
      color: "amber"
    },
    {
      name: "Noite Total",
      icon: <Moon size={16} className="text-indigo-400" />,
      entries: record.night_entries + record.group_night_entries,
      commission: record.night_commission + record.group_night_commission,
      prizes: record.night_prizes + record.group_night_prizes,
      color: "indigo"
    }
  ];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 px-1 text-center justify-center">
        <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Totais por Período</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {periods.map((p) => {
          const net = p.entries - p.commission - p.prizes;
          return (
            <div key={p.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                {p.icon}
                <span className="font-bold text-slate-800">{p.name}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Entradas:</span>
                  <span className="text-slate-800 tracking-tight">{formatCurrencyBRL(p.entries)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Comissão:</span>
                  <span className="text-red-600 tracking-tight">{formatCurrencyBRL(p.commission)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Prêmios:</span>
                  <span className="text-slate-800 tracking-tight">{formatCurrencyBRL(p.prizes)}</span>
                </div>
                
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center font-bold">
                  <span className="text-slate-500 text-xs">Saldo:</span>
                  <span className={`text-base tracking-tight ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyBRL(net)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
