"use client";

import { AuditLog } from "@/types";
import { X, ArrowRight, CornerDownRight } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";

export default function AuditLogDetailsModal({ log, onClose }: { log: AuditLog, onClose: () => void }) {
  const renderValue = (val: any) => {
    if (typeof val === 'number') return formatCurrencyBRL(val);
    if (typeof val === 'boolean') return val ? "SIM" : "NÃO";
    if (typeof val === 'object' && val !== null) return JSON.stringify(val, null, 2);
    return String(val);
  };

  const getChangedFields = () => {
    if (log.changed_fields && Array.isArray(log.changed_fields)) return log.changed_fields;
    return [];
  };

  const changes = getChangedFields();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h4 className="font-bold text-slate-800">Detalhes da Alteração</h4>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {changes.length > 0 ? (
            <div className="space-y-4">
               {changes.map(field => (
                 <div key={field} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{field}</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 text-sm bg-red-50 p-2 rounded border border-red-100 text-red-700">
                           <span className="text-[10px] block opacity-50 mb-1 font-bold">ANTES</span>
                           {renderValue(log.old_data?.[field])}
                        </div>
                        <ArrowRight className="text-slate-300" size={16} />
                        <div className="flex-1 text-sm bg-green-50 p-2 rounded border border-green-100 text-green-700">
                           <span className="text-[10px] block opacity-50 mb-1 font-bold">DEPOIS</span>
                           {renderValue(log.new_data?.[field])}
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Resumo do Registro</p>
                  <pre className="text-xs bg-slate-900 text-slate-200 p-4 rounded-lg overflow-auto max-h-60">
                    {JSON.stringify(log.new_data, null, 2)}
                  </pre>
               </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-xs text-slate-400">ID da Ação: {log.id}</p>
        </div>
      </div>
    </div>
  );
}
