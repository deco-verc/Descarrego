"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Area } from "@/types";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
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

export default function WeeklyReportPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
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
    const date = parseISO(selectedDate);
    const start = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("daily_records")
      .select("*")
      .eq("area_id", selectedAreaId)
      .gte("date", start)
      .lte("date", end)
      .order("date");

    if (error) {
      toast.error("Erro ao buscar relatório");
    } else {
      setReportData(data || []);
      if (data && data.length > 0) {
        setTotals({
          entries: data.reduce((acc, curr) => acc + Number(curr.total_entries), 0),
          commission: data.reduce((acc, curr) => acc + Number(curr.total_commission), 0),
          prizes: data.reduce((acc, curr) => acc + Number(curr.total_prizes), 0),
          final: data.reduce((acc, curr) => acc + Number(curr.total_final), 0),
        });
      } else {
        setTotals(null);
      }
    }
    setLoading(false);
  }, [selectedAreaId, selectedDate, supabase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const generatePDF = () => {
    if (!reportData.length) return;
    const area = areas.find(a => a.id === selectedAreaId);
    if (!area) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const date = parseISO(selectedDate);
    const start = format(startOfWeek(date, { weekStartsOn: 1 }), "dd/MM/yyyy");
    const end = format(endOfWeek(date, { weekStartsOn: 1 }), "dd/MM/yyyy");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text(`Relatório Semanal – ${area.name.toUpperCase()}`, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Período: ${start} a ${end}`, pageWidth / 2, 28, { align: "center" });

    const tableBody = reportData.map(d => [
      format(parseISO(d.date), "dd/MM/yy, EEEE", { locale: ptBR }),
      formatCurrencyBRL(d.total_entries),
      formatCurrencyBRL(d.total_commission),
      formatCurrencyBRL(d.total_prizes),
      formatCurrencyBRL(d.total_final)
    ]);

    // Format totals row
    const totalsRow = [
      "Total",
      formatCurrencyBRL(totals.entries),
      formatCurrencyBRL(totals.commission),
      formatCurrencyBRL(totals.prizes),
      formatCurrencyBRL(totals.final)
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Data", "Entradas", "Comissão", "Prêmios", "Saldo Final"]],
      body: [...tableBody, totalsRow],
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: THEME.text,
        fontSize: 9,
        fontStyle: "bold",
        halign: "left",
        lineWidth: 0.1,
        lineColor: [230, 230, 230]
      },
      bodyStyles: {
        fontSize: 9,
        textColor: THEME.text,
        halign: "right",
        fontStyle: "bold"
      },
      columnStyles: {
        0: { halign: "left" },
      },
      didParseCell: (data) => {
        // Color for commission column (2)
        if (data.column.index === 2 && data.section === 'body') {
          data.cell.styles.textColor = THEME.danger;
        }
        // Color for final balance column (4)
        if (data.column.index === 4 && data.section === 'body') {
          const rawValue = data.cell.raw as string;
          if (rawValue.includes('-')) {
             data.cell.styles.textColor = THEME.danger;
          } else {
             data.cell.styles.textColor = THEME.success;
          }
        }
        // Bold and background for totals row
        if (data.row.index === tableBody.length) {
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.fontSize = 10;
        }
      }
    });

    doc.save(`Descarrego-${area.name}-Semanal(${start.replace(/\//g, '.')}).pdf`);
  };

  const startStr = format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), "dd/MM");
  const endStr = format(endOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), "dd/MM");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Centralizado */}
      <div className="flex flex-col items-center justify-center text-center py-4">
        <div className="flex items-center gap-3 mb-2">
          <Warehouse className="text-blue-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)]">
            Relatório Semanal – {areas.find(a => a.id === selectedAreaId)?.name || "..."}
          </h1>
        </div>
        <p className="text-slate-500 font-bold">Período: {startStr} a {endStr}</p>
      </div>

      {/* Filters */}
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
            <span className="text-[10px] font-bold text-slate-400 uppercase">Data Referência</span>
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
          disabled={!totals} 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" /> Exportar PDF Profissional
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : reportData.length > 0 ? (
        <div className="space-y-6">
           <div className="card overflow-hidden border-none shadow-2xl">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Data</th>
                       <th className="py-4 px-4 font-bold text-slate-500 uppercase text-[10px]">Entradas</th>
                       <th className="py-4 px-4 font-bold text-slate-500 uppercase text-[10px]">Comissão</th>
                       <th className="py-4 px-4 font-bold text-slate-500 uppercase text-[10px]">Prêmios</th>
                       <th className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] bg-slate-50/80">Saldo Final</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {reportData.map(d => {
                        const final = Number(d.total_final);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 text-left font-bold text-slate-700">
                                {format(parseISO(d.date), "dd/MM/yy, EEEE", { locale: ptBR })}
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-800">
                                {formatCurrencyBRL(d.total_entries)}
                              </td>
                              <td className="py-4 px-4 font-bold text-red-600">
                                {formatCurrencyBRL(d.total_commission)}
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-800">
                                {formatCurrencyBRL(d.total_prizes)}
                              </td>
                              <td className={`py-4 px-6 font-bold bg-slate-50/30 ${final >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrencyBRL(final)}
                              </td>
                          </tr>
                        );
                    })}
                    <tr className="bg-slate-100/50 font-bold text-slate-800">
                       <td className="py-6 px-6 text-left uppercase text-xs">Totais</td>
                       <td className="py-6 px-4">{formatCurrencyBRL(totals.entries)}</td>
                       <td className="py-6 px-4 text-red-700">{formatCurrencyBRL(totals.commission)}</td>
                       <td className="py-6 px-4">{formatCurrencyBRL(totals.prizes)}</td>
                       <td className={`py-6 px-6 text-lg [text-shadow:_0_1px_1px_rgb(0_0_0_/_5%)] ${totals.final >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrencyBRL(totals.final)}
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <AlertCircle size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">Nenhum registro encontrado para esta semana.</p>
        </div>
      )}
    </div>
  );
}
