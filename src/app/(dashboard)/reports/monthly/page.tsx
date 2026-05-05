"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Area } from "@/types";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/currency";
import { Loader2, Search, FileDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function MonthlyReportPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
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
    if (!selectedAreaId || !selectedMonth) return;
    
    setLoading(true);
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");

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
  }, [selectedAreaId, selectedMonth, supabase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const generatePDF = () => {
    if (!reportData.length) return;
    const area = areas.find(a => a.id === selectedAreaId);
    if (!area) return;

    const doc = new jsPDF();
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.setTextColor(29, 78, 216);
    doc.text("RELATÓRIO MENSAL", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Área: ${area.name}`, 14, 25);
    doc.text(`Mês: ${monthName}`, 14, 32);

    const body = reportData.map(d => [
      format(parseISO(d.date), "dd/MM"),
      formatCurrencyBRL(d.total_entries),
      formatCurrencyBRL(d.total_commission),
      formatCurrencyBRL(d.total_prizes),
      formatCurrencyBRL(d.total_final)
    ]);

    body.push([
      { content: 'TOTAL DO MÊS', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatCurrencyBRL(totals.entries), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatCurrencyBRL(totals.commission), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatCurrencyBRL(totals.prizes), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatCurrencyBRL(totals.final), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    ] as any);

    autoTable(doc, {
      head: [["Dia", "Bruto", "Comissão", "Prêmios", "Final"]],
      body: body,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216] },
      styles: { fontSize: 8 }
    });

    doc.save(`relatorio-mensal-${area.name.toLowerCase().replace(/\s+/g, '-')}-${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Área</label>
          <select 
            value={selectedAreaId} 
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200"
          >
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Mês</label>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200"
          />
        </div>
        <button onClick={generatePDF} disabled={!totals} className="btn-secondary text-red-600 border-red-100 hover:bg-red-50 disabled:opacity-50">
          <FileDown className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : reportData.length > 0 ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-6 bg-white shadow-xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Bruto do Mês</p>
                 <p className="text-2xl font-black text-slate-800">{formatCurrencyBRL(totals.entries)}</p>
              </div>
              <div className="card p-6 bg-white shadow-xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Comissão do Mês</p>
                 <p className="text-2xl font-black text-red-600">{formatCurrencyBRL(totals.commission)}</p>
              </div>
              <div className="card p-6 bg-white shadow-xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Prêmios do Mês</p>
                 <p className="text-2xl font-black text-orange-600">{formatCurrencyBRL(totals.prizes)}</p>
              </div>
              <div className="card p-6 bg-white shadow-xl border-green-200">
                 <p className="text-xs font-bold text-slate-400 uppercase">Final do Mês</p>
                 <p className="text-2xl font-black text-green-700">{formatCurrencyBRL(totals.final)}</p>
              </div>
           </div>

           <div className="card overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-center border-collapse">
                  <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-6 text-left">DATA</th>
                        <th>VALOR BRUTO</th>
                        <th>COMISSÃO</th>
                        <th>PRÊMIOS</th>
                        <th className="bg-slate-900 px-6">TOTAL FINAL</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                            <td className="py-4 px-6 text-left font-medium">
                              {format(parseISO(d.date), "dd/MM/yyyy")}
                            </td>
                            <td>{formatCurrencyBRL(d.total_entries)}</td>
                            <td className="text-red-500">{formatCurrencyBRL(d.total_commission)}</td>
                            <td className="text-orange-500">{formatCurrencyBRL(d.total_prizes)}</td>
                            <td className="font-bold text-green-700">{formatCurrencyBRL(d.total_final)}</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10">
                      <tr className="bg-slate-50 font-black text-slate-800 border-t-2 border-slate-200">
                        <td className="py-4 px-6 text-left uppercase">Totais do Mês</td>
                        <td>{formatCurrencyBRL(totals.entries)}</td>
                        <td className="text-red-600">{formatCurrencyBRL(totals.commission)}</td>
                        <td className="text-orange-600">{formatCurrencyBRL(totals.prizes)}</td>
                        <td className="text-green-700 text-lg">{formatCurrencyBRL(totals.final)}</td>
                      </tr>
                  </tfoot>
                </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <AlertCircle size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum registro encontrado para este mês.</p>
        </div>
      )}
    </div>
  );
}
