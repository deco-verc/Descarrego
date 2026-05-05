"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { DailyRecord, Area } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/currency";
import { Loader2, Search, FileDown, AlertCircle, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const THEME = {
  primary: [30, 41, 59] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
};

export default function DailyReportPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase.from("areas").select("*").eq("active", true).order("name");
      if (data && data.length > 0) {
        setAreas(data);
        setSelectedAreaId(data[0].id);
      }
    }
    fetchInitialData();
  }, [supabase]);

  const fetchReport = useCallback(async () => {
    if (!selectedAreaId || !selectedDate) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_records")
      .select("*")
      .eq("area_id", selectedAreaId)
      .eq("date", selectedDate)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Erro ao buscar relatório");
    } else {
      setRecord(data || null);
    }
    setLoading(false);
  }, [selectedAreaId, selectedDate, supabase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const generatePDF = () => {
    if (!record) return;
    const area = areas.find(a => a.id === selectedAreaId);
    if (!area) return;

    const doc = new jsPDF();
    const formattedDate = format(parseISO(selectedDate), "dd/MM/yyyy");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text(`Relatório Diário – ${area.name.toUpperCase()}`, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Data: ${formattedDate}`, pageWidth / 2, 28, { align: "center" });

    const tableData = [
      ["Item", "Manhã", "Tarde", "Noite", "G/Manhã", "G/Tarde", "G/Noite", "Diário"],
      ["Entradas", formatCurrencyBRL(record.morning_entries), formatCurrencyBRL(record.afternoon_entries), formatCurrencyBRL(record.night_entries), formatCurrencyBRL(record.group_morning_entries), formatCurrencyBRL(record.group_afternoon_entries), formatCurrencyBRL(record.group_night_entries), formatCurrencyBRL(record.total_entries)],
      ["Comissão", formatCurrencyBRL(record.morning_commission), formatCurrencyBRL(record.afternoon_commission), formatCurrencyBRL(record.night_commission), formatCurrencyBRL(record.group_morning_commission), formatCurrencyBRL(record.group_afternoon_commission), formatCurrencyBRL(record.group_night_commission), formatCurrencyBRL(record.total_commission)],
      ["Prêmios", formatCurrencyBRL(record.morning_prizes), formatCurrencyBRL(record.afternoon_prizes), formatCurrencyBRL(record.night_prizes), formatCurrencyBRL(record.group_morning_prizes), formatCurrencyBRL(record.group_afternoon_prizes), formatCurrencyBRL(record.group_night_prizes), formatCurrencyBRL(record.total_prizes)],
      ["Saldo Final", formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes), formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes), formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes), formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes), formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes), formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes), formatCurrencyBRL(record.total_final)],
    ];

    autoTable(doc, {
      startY: 40,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: THEME.text,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center", // Centralizado
        lineWidth: 0.1,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: THEME.text,
        fontStyle: "bold",
        halign: "right"
      },
      columnStyles: {
        0: { halign: "left" },
        7: { fillColor: [248, 250, 252] }
      },
      didParseCell: (data) => {
        if (data.row.index === 1 && data.section === 'body') {
          data.cell.styles.textColor = THEME.danger;
        }
        if (data.row.index === 3 && data.section === 'body') {
          const rawValue = data.cell.raw as string;
          if (rawValue && rawValue.toString().includes('-')) {
            data.cell.styles.textColor = THEME.danger;
          } else if (data.column.index > 0) {
            data.cell.styles.textColor = THEME.success;
          }
        }
      },
      didDrawCell: (data) => {
        // Shadow for colored rows (Commission index 1 and Final Balance index 3)
        if (data.section === 'body' && (data.row.index === 1 || data.row.index === 3)) {
            if (data.column.index > 0) {
                const text = data.cell.text[0];
                const x = data.cell.x + data.cell.width - data.cell.padding('right');
                const y = data.cell.y + data.cell.height / 2 + 1;

                // Draw shadow
                doc.setTextColor(220, 220, 220);
                doc.text(text, x + 0.15, y + 0.15, { align: 'right' });

                // Redraw main text
                let color = THEME.text;
                if (data.row.index === 1) color = THEME.danger;
                if (data.row.index === 3) {
                    color = text.includes('-') ? THEME.danger : THEME.success;
                }
                doc.setTextColor(color[0], color[1], color[2]);
                doc.text(text, x, y, { align: 'right' });
                return false;
            }
        }
      }
    });

    doc.save(`Descarrego-${area.name}-Diario(${formattedDate.replace(/\//g, '.')}).pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center text-center py-4">
        <div className="flex items-center gap-3 mb-2">
          <Warehouse className="text-blue-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight [text-shadow:_0_1.5px_3px_rgb(0_0_0_/_15%)]">
            Relatório Diário – {areas.find(a => a.id === selectedAreaId)?.name || "..."}
          </h1>
        </div>
        <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">{format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 no-print">
        <div className="flex items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-2 gap-4">
          <div className="flex flex-col px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Banca</span>
            <select 
              value={selectedAreaId} 
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none text-sm"
            >
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex flex-col px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Data</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none text-sm cursor-pointer"
            />
          </div>
        </div>

        <button 
          onClick={generatePDF} 
          disabled={!record} 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" /> Exportar PDF Profissional
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : record ? (
        <div className="space-y-6">
           <div className="card overflow-hidden border-none shadow-2xl">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Item</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">Manhã</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">Tarde</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">Noite</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">G/M</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">G/T</th>
                       <th className="py-4 px-3 font-bold text-slate-500 uppercase text-[10px]">G/N</th>
                       <th className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] bg-slate-50/80 text-shadow-sm">Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Entradas</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.morning_entries)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.afternoon_entries)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.night_entries)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_morning_entries)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_afternoon_entries)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_night_entries)}</td>
                       <td className="py-4 px-6 font-bold bg-slate-50/30">{formatCurrencyBRL(record.total_entries)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Comissão</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.morning_commission)}</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.afternoon_commission)}</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.night_commission)}</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.group_morning_commission)}</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.group_afternoon_commission)}</td>
                       <td className="py-4 px-3 font-bold text-red-600 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.group_night_commission)}</td>
                       <td className="py-4 px-6 font-bold bg-slate-50/30 text-red-700 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)]">{formatCurrencyBRL(record.total_commission)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Prêmios</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.morning_prizes)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.afternoon_prizes)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.night_prizes)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_morning_prizes)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_afternoon_prizes)}</td>
                       <td className="py-4 px-3 font-bold">{formatCurrencyBRL(record.group_night_prizes)}</td>
                       <td className="py-4 px-6 font-bold bg-slate-50/30">{formatCurrencyBRL(record.total_prizes)}</td>
                    </tr>
                    <tr className="bg-slate-100/50 font-bold text-slate-800">
                       <td className="py-6 px-6 text-left uppercase text-xs">Saldo Final</td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.morning_entries - record.morning_commission - record.morning_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes)}
                       </td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes)}
                       </td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.night_entries - record.night_commission - record.night_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes)}
                       </td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes)}
                       </td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes)}
                       </td>
                       <td className={`py-6 px-3 [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${record.group_night_entries - record.group_night_commission - record.group_night_prizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes)}
                       </td>
                       <td className={`py-6 px-6 text-lg [text-shadow:_0_1.5px_2px_rgb(0_0_0_/_10%)] ${record.total_final >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrencyBRL(record.total_final)}
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <AlertCircle size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">Nenhum registro encontrado para esta data.</p>
        </div>
      )}
    </div>
  );
}
