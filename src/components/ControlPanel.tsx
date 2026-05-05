"use client";

import { 
  Plus, 
  Save, 
  Printer, 
  BarChart3, 
  FileDown,
  Loader2 
} from "lucide-react";
import { DailyRecord } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAuditLog } from "@/lib/audit";
import { exportDailyPDF } from "@/lib/pdf-export";

interface ControlPanelProps {
  onSave: () => Promise<void>;
  onNew: () => void;
  saving: boolean;
  isModified: boolean;
  areaName: string;
  date: string;
  record: DailyRecord | null;
  areaId: string;
  commissionSettings: any;
}

export default function ControlPanel({ 
  onSave, 
  onNew, 
  saving, 
  isModified,
  areaName,
  date,
  record,
  areaId,
  commissionSettings
}: ControlPanelProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
    createAuditLog({
      action: "PRINT_REPORT",
      entity_type: "DAILY_RECORD",
      area_id: areaId,
      date_reference: date,
    });
  };

  const handleExportPDF = async () => {
    if (!record || !areaName) return;

    try {
      await exportDailyPDF(
        record,
        { id: areaId, name: areaName } as any,
        date,
        "usuario@sistema.local",
        commissionSettings
      );
      
      createAuditLog({
        action: "EXPORT_PDF",
        entity_type: "DAILY_RECORD",
        area_id: areaId,
        date_reference: date,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF profissional.");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 no-print">
      <div className="flex flex-wrap gap-4">
        <button className="btn-secondary group" onClick={onNew}>
          <Plus className="w-4 h-4 text-blue-600 transition-transform group-hover:rotate-90" />
          Novo Lançamento
        </button>
        
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl transition-all flex items-center gap-3 font-bold shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 relative overflow-hidden" 
          onClick={onSave} 
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Fechamento"}
          {isModified && (
            <span className="absolute top-0 right-0 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          className="btn-secondary" 
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 text-slate-400" />
          Imprimir
        </button>
        <button 
          className="btn-secondary hover:bg-red-50 hover:text-red-700 hover:border-red-100" 
          onClick={handleExportPDF}
        >
          <FileDown className="w-4 h-4 text-red-500" />
          Exportar PDF
        </button>
        <button 
          className="btn-secondary bg-blue-50/30 hover:bg-blue-50 text-blue-700 border-blue-100"
          onClick={() => router.push("/dashboard/reports/daily")}
        >
          <BarChart3 className="w-4 h-4" />
          Ver Relatórios
        </button>
      </div>
    </div>
  );
}
