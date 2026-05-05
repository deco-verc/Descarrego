"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { DailyRecord, Area } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/currency";
import { Loader2, Search, FileDown, Printer, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    
    doc.setFontSize(18);
    doc.setTextColor(29, 78, 216);
    doc.text("RELATÓRIO DIÁRIO", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Área: ${area.name}`, 14, 25);
    doc.text(`Data: ${formattedDate}`, 14, 32);

    const tableData = [
      ["Item", "Manhã", "Tarde", "Noite", "Grupo M", "Grupo T", "Grupo N", "Diário"],
      ["Entradas", formatCurrencyBRL(record.morning_entries), formatCurrencyBRL(record.afternoon_entries), formatCurrencyBRL(record.night_entries), formatCurrencyBRL(record.group_morning_entries), formatCurrencyBRL(record.group_afternoon_entries), formatCurrencyBRL(record.group_night_entries), formatCurrencyBRL(record.total_entries)],
      ["Comissão", formatCurrencyBRL(record.morning_commission), formatCurrencyBRL(record.afternoon_commission), formatCurrencyBRL(record.night_commission), formatCurrencyBRL(record.group_morning_commission), formatCurrencyBRL(record.group_afternoon_commission), formatCurrencyBRL(record.group_night_commission), formatCurrencyBRL(record.total_commission)],
      ["Prêmios", formatCurrencyBRL(record.morning_prizes), formatCurrencyBRL(record.afternoon_prizes), formatCurrencyBRL(record.night_prizes), formatCurrencyBRL(record.group_morning_prizes), formatCurrencyBRL(record.group_afternoon_prizes), formatCurrencyBRL(record.group_night_prizes), formatCurrencyBRL(record.total_prizes)],
      ["Saldo Final", formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes), formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes), formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes), formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes), formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes), formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes), formatCurrencyBRL(record.total_final)],
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216] },
    });

    doc.save(`relatorio-diario-${area.name.toLowerCase().replace(/\s+/g, '-')}-${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Selecionar Área</label>
          <select 
            value={selectedAreaId} 
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200"
          >
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Data</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200"
          />
        </div>
        <div className="flex gap-2">
            <button 
              onClick={fetchReport}
              className="btn-primary"
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
            {record && (
              <>
                <button onClick={generatePDF} className="btn-secondary text-red-600 border-red-100 hover:bg-red-50">
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => window.print()} className="btn-secondary">
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </>
            )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : record ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           {/* Detailed table view simplified for report */}
           <div className="card overflow-hidden">
              <table className="w-full text-center">
                 <thead>
                    <tr className="bg-blue-700 text-white">
                       <th className="py-4 px-6 text-left">ITEM</th>
                       <th>M</th>
                       <th>T</th>
                       <th>N</th>
                       <th>GM</th>
                       <th>GT</th>
                       <th>GN</th>
                       <th className="bg-blue-900 px-6">TOTAL</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    <tr>
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Entradas</td>
                       <td>{formatCurrencyBRL(record.morning_entries)}</td>
                       <td>{formatCurrencyBRL(record.afternoon_entries)}</td>
                       <td>{formatCurrencyBRL(record.night_entries)}</td>
                       <td>{formatCurrencyBRL(record.group_morning_entries)}</td>
                       <td>{formatCurrencyBRL(record.group_afternoon_entries)}</td>
                       <td>{formatCurrencyBRL(record.group_night_entries)}</td>
                       <td className="font-bold bg-slate-50">{formatCurrencyBRL(record.total_entries)}</td>
                    </tr>
                    <tr>
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Comissão</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.morning_commission)}</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.afternoon_commission)}</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.night_commission)}</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.group_morning_commission)}</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.group_afternoon_commission)}</td>
                       <td className="text-red-500">{formatCurrencyBRL(record.group_night_commission)}</td>
                       <td className="font-bold bg-slate-50 text-red-600">{formatCurrencyBRL(record.total_commission)}</td>
                    </tr>
                    <tr>
                       <td className="py-4 px-6 text-left font-bold text-slate-700">Prêmios</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.morning_prizes)}</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.afternoon_prizes)}</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.night_prizes)}</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.group_morning_prizes)}</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.group_afternoon_prizes)}</td>
                       <td className="text-orange-500">{formatCurrencyBRL(record.group_night_prizes)}</td>
                       <td className="font-bold bg-slate-50 text-orange-600">{formatCurrencyBRL(record.total_prizes)}</td>
                    </tr>
                    <tr className="bg-green-50/50">
                       <td className="py-4 px-6 text-left font-black text-green-800">Saldo Final</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes)}</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes)}</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes)}</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes)}</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes)}</td>
                       <td className="font-bold text-green-600">{formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes)}</td>
                       <td className="font-black text-green-700 text-lg">{formatCurrencyBRL(record.total_final)}</td>
                    </tr>
                 </tbody>
              </table>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-4 bg-white">
                 <p className="text-xs font-bold text-slate-400 uppercase">Valor Bruto</p>
                 <p className="text-xl font-bold">{formatCurrencyBRL(record.total_entries)}</p>
              </div>
              <div className="card p-4 bg-white">
                 <p className="text-xs font-bold text-slate-400 uppercase">Comissão</p>
                 <p className="text-xl font-bold text-red-600">{formatCurrencyBRL(record.total_commission)}</p>
              </div>
              <div className="card p-4 bg-white">
                 <p className="text-xs font-bold text-slate-400 uppercase">Prêmios</p>
                 <p className="text-xl font-bold text-orange-600">{formatCurrencyBRL(record.total_prizes)}</p>
              </div>
              <div className="card p-4 bg-white border-green-200">
                 <p className="text-xs font-bold text-slate-400 uppercase">Total Final</p>
                 <p className="text-xl font-black text-green-700">{formatCurrencyBRL(record.total_final)}</p>
              </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <AlertCircle size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum registro encontrado para esta data/área.</p>
        </div>
      )}
    </div>
  );
}
