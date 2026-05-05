"use client";

import { 
  Plus, 
  Save, 
  Printer, 
  FileText, 
  BarChart3, 
  FileDown 
} from "lucide-react";
import { DailyRecord } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrencyBRL } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createAuditLog } from "@/lib/audit";

interface ControlPanelProps {
  onSave: () => Promise<void>;
  onNew: () => void;
  saving: boolean;
  isModified: boolean;
  areaName: string;
  date: string;
  record: DailyRecord | null;
  areaId: string;
}

export default function ControlPanel({ 
  onSave, 
  onNew, 
  saving, 
  isModified,
  areaName,
  date,
  record,
  areaId
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

  const handleExportPDF = () => {
    if (!record || !areaName) return;

    const doc = new jsPDF();
    const formattedDate = format(parseISO(date), "dd/MM/yyyy");
    const fileName = `descarrego-${areaName.toLowerCase().replace(/\s+/g, '-')}-${date}.pdf`;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(29, 78, 216); // Blue-700
    doc.text("ROTEIRO DESCARGA", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Área: ${areaName}`, 14, 25);
    doc.text(`Data: ${formattedDate}`, 14, 32);

    // Main Table
    const tableData = [
      ["Item", "Manhã", "Tarde", "Noite", "Grupo M", "Grupo T", "Grupo N", "Diário"],
      ["Entradas", 
        formatCurrencyBRL(record.morning_entries), 
        formatCurrencyBRL(record.afternoon_entries), 
        formatCurrencyBRL(record.night_entries), 
        formatCurrencyBRL(record.group_morning_entries), 
        formatCurrencyBRL(record.group_afternoon_entries), 
        formatCurrencyBRL(record.group_night_entries), 
        formatCurrencyBRL(record.total_entries)
      ],
      ["Comissão", 
        formatCurrencyBRL(record.morning_commission), 
        formatCurrencyBRL(record.afternoon_commission), 
        formatCurrencyBRL(record.night_commission), 
        formatCurrencyBRL(record.group_morning_commission), 
        formatCurrencyBRL(record.group_afternoon_commission), 
        formatCurrencyBRL(record.group_night_commission), 
        formatCurrencyBRL(record.total_commission)
      ],
      ["Prêmios", 
        formatCurrencyBRL(record.morning_prizes), 
        formatCurrencyBRL(record.afternoon_prizes), 
        formatCurrencyBRL(record.night_prizes), 
        formatCurrencyBRL(record.group_morning_prizes), 
        formatCurrencyBRL(record.group_afternoon_prizes), 
        formatCurrencyBRL(record.group_night_prizes), 
        formatCurrencyBRL(record.total_prizes)
      ],
      ["Saldo Final", 
        formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes), 
        formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes), 
        formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes), 
        formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes), 
        formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes), 
        formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes), 
        formatCurrencyBRL(record.total_final)
      ],
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Final: ${formatCurrencyBRL(record.total_final)}`, 14, finalY);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, finalY + 7);

    doc.save(fileName);
    
    createAuditLog({
      action: "EXPORT_PDF",
      entity_type: "DAILY_RECORD",
      area_id: areaId,
      date_reference: date,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 bg-white/50 p-4 rounded-xl border border-slate-200 shadow-sm no-print">
      <div className="flex flex-wrap gap-3">
        <button className="btn-secondary" onClick={onNew}>
          <Plus className="w-4 h-4" />
          Novo Dia
        </button>
        <button className="btn-primary" onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Dia"}
          {isModified && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse ml-1" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          className="btn-secondary" 
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button 
          className="btn-secondary hover:bg-red-50 hover:text-red-700 hover:border-red-200" 
          onClick={handleExportPDF}
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
        <button 
          className="btn-secondary bg-blue-50/50 hover:bg-blue-50 text-blue-700 border-blue-200"
          onClick={() => router.push("/reports/daily")}
        >
          <BarChart3 className="w-4 h-4" />
          Relatórios
        </button>
      </div>
    </div>
  );
}
