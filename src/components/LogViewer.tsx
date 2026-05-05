"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { AuditLog } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Loader2, Eye, History } from "lucide-react";
import AuditLogDetailsModal from "./AuditLogDetailsModal";

export default function LogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const supabase = createClient();

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "LOGIN": "Login Realizado",
      "CREATE_AREA": "Nova Área Criada",
      "UPDATE_AREA": "Área Atualizada",
      "CREATE_DAILY_RECORD": "Novo Registro Diário",
      "UPDATE_DAILY_RECORD": "Registro Diário Editado",
      "CREATE_COMMISSION_SETTINGS": "Config. de Comissão Criada",
      "UPDATE_COMMISSION_SETTINGS": "Config. de Comissão Atualizada",
      "EXPORT_PDF": "PDF Exportado",
      "PRINT_REPORT": "Relatório Impresso",
      "MANUAL_COMMISSION_OVERRIDE": "Comissão Sobrescrita"
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Histórico do Sistema
            <span className="text-xs font-normal text-slate-500">Exibindo os últimos 100 eventos</span>
        </h3>
        <button onClick={fetchLogs} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            <History size={14} /> Atualizar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Data/Hora</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Usuário</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Ação</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Referência</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                   <Loader2 className="animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">Nenhum log encontrado</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                    {log.user_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                        log.action.includes('EXPORT') || log.action.includes('PRINT') ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                        {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {log.date_reference ? format(parseISO(log.date_reference), "dd/MM/yyyy") : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(log.old_data || log.new_data) && (
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-1 px-2 bg-white border border-slate-200 rounded hover:bg-slate-50 text-blue-600 transition-all flex items-center gap-1 mx-auto"
                      >
                         <Eye size={14} /> <span className="text-xs font-bold">Ver</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <AuditLogDetailsModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
