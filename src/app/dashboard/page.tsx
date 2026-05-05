"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Area, DailyRecord, CommissionSettings } from "@/types";
import { toast } from "sonner";
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import DailyTable from "@/components/DailyTable";
import TotalsSection from "@/components/TotalsSection";
import { calculateDailyTotals, calculatePeriodTotals } from "@/lib/calculations";
import { applyCommissionSettingsToDay } from "@/lib/commission";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createAuditLog, getChangedFields } from "@/lib/audit";
import { Loader2, Warehouse, Lock, FileCheck, ScrollText } from "lucide-react";

export default function DashboardPage() {
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [areas, setAreas] = useState<Area[]>([]);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [originalRecord, setOriginalRecord] = useState<DailyRecord | null>(null);

  const supabase = createClient();

  const fetchAreas = useCallback(async () => {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .eq("active", true)
      .order("name");
    
    if (error) {
      toast.error("Erro ao buscar áreas: " + error.message);
    } else {
      setAreas(data || []);
      if (data && data.length > 0 && !selectedArea) {
        setSelectedArea(data[0]);
      } else {
        setLoading(false);
      }
    }
  }, [supabase, selectedArea]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const fetchRecord = useCallback(async () => {
    if (!selectedArea || !selectedDate) return;
    
    setLoading(true);
    setRecord(null); // Reset state to ensure clean view for the new area/date
    const { data: recordData, error: recordError } = await supabase
      .from("daily_records")
      .select("*")
      .eq("area_id", selectedArea.id)
      .eq("date", selectedDate)
      .single();

    const { data: settingsData, error: settingsError } = await supabase
      .from("commission_settings")
      .select("*")
      .eq("area_id", selectedArea.id)
      .single();

    if (settingsData) {
      setCommissionSettings(settingsData);
    } else {
      setCommissionSettings(null);
    }

    if (recordData) {
      setRecord(recordData);
      setOriginalRecord(recordData);
      setIsModified(false);
    } else {
      const emptyRecord: DailyRecord = {
        area_id: selectedArea.id,
        date: selectedDate,
        morning_entries: 0, afternoon_entries: 0, night_entries: 0,
        group_morning_entries: 0, group_afternoon_entries: 0, group_night_entries: 0,
        morning_commission: 0, afternoon_commission: 0, night_commission: 0,
        group_morning_commission: 0, group_afternoon_commission: 0, group_night_commission: 0,
        morning_prizes: 0, afternoon_prizes: 0, night_prizes: 0,
        group_morning_prizes: 0, group_afternoon_prizes: 0, group_night_prizes: 0,
        total_entries: 0, total_commission: 0, total_prizes: 0, total_final: 0,
        total_extra_expenses: 0,
        total_net_final: 0,
        closed: false,
        checked: false
      };
      setRecord(emptyRecord);
      setOriginalRecord(null);
      setIsModified(false);
    }
    setLoading(false);
  }, [selectedArea, selectedDate, supabase]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleUpdateRecord = (updates: Partial<DailyRecord>) => {
    if (!record) return;
    
    let updatedRecord = { ...record, ...updates };
    
    // Apply auto-commission if enabled and not overridden
    if (commissionSettings && commissionSettings.auto_calculate && !updatedRecord.commission_manual_override) {
      updatedRecord = applyCommissionSettingsToDay(updatedRecord, commissionSettings);
    }
    
    // Recalculate totals
    updatedRecord = calculateDailyTotals(updatedRecord);
    
    setRecord(updatedRecord);
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!record || !selectedArea) return;
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado");
      setSaving(false);
      return;
    }

    // Build snapshot for historical consistency
    const report_snapshot = {
      total_entries: record.total_entries,
      total_commission: record.total_commission,
      total_prizes: record.total_prizes,
      total_final: record.total_final,
      total_extra_expenses: record.total_extra_expenses,
      total_net_final: record.total_net_final,
      commission_settings_used: commissionSettings,
      calculator_snapshot: calculatePeriodTotals(record)
    };

    const recordToSave = {
      ...record,
      user_id: user.id,
      saved_by: originalRecord ? originalRecord.saved_by : user.id,
      last_modified_by: user.id,
      report_snapshot,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("daily_records")
      .upsert(recordToSave, { onConflict: "user_id,area_id,date" })
      .select();

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Dia salvo com sucesso!");
      
      // Log auditing
      const action = originalRecord ? "UPDATE_DAILY_RECORD" : "CREATE_DAILY_RECORD";
      const changedFields = getChangedFields(originalRecord, data[0]);
      
      let summary = `${action === "CREATE_DAILY_RECORD" ? "Criou" : "Atualizou"} registro do dia ${format(parseISO(selectedDate), "dd/MM/yyyy")}`;
      if (changedFields.includes('closed')) summary = data[0].closed ? "Fechou o dia" : "Reabriu o dia";
      if (changedFields.includes('checked')) summary = data[0].checked ? "Conferiu o dia" : "Desmarcou conferência do dia";

      await createAuditLog({
        action,
        entity_type: "DAILY_RECORD",
        entity_id: data[0].id,
        area_id: selectedArea.id,
        record_id: data[0].id,
        date_reference: selectedDate,
        summary,
        old_data: originalRecord,
        new_data: data[0],
        changed_fields: changedFields
      });

      setOriginalRecord(data[0]);
      setIsModified(false);
    }
    setSaving(false);
  };

  const handleNewDay = () => {
    if (isModified) {
      if (!confirm("Você tem alterações não salvas. Deseja continuar?")) {
        return;
      }
    }
    
    const today = format(new Date(), "yyyy-MM-dd");
    setSelectedDate(today);
    
    // Forçar reset do record para o estado vazio do dia atual
    if (selectedArea) {
      const emptyRecord: DailyRecord = {
        area_id: selectedArea.id,
        date: today,
        morning_entries: 0, afternoon_entries: 0, night_entries: 0,
        group_morning_entries: 0, group_afternoon_entries: 0, group_night_entries: 0,
        morning_commission: 0, afternoon_commission: 0, night_commission: 0,
        group_morning_commission: 0, group_afternoon_commission: 0, group_night_commission: 0,
        morning_prizes: 0, afternoon_prizes: 0, night_prizes: 0,
        group_morning_prizes: 0, group_afternoon_prizes: 0, group_night_prizes: 0,
        total_entries: 0, total_commission: 0, total_prizes: 0, total_final: 0,
        total_extra_expenses: 0,
        total_net_final: 0,
        closed: false,
        checked: false
      };
      setRecord(emptyRecord);
      setOriginalRecord(null);
      setIsModified(false);
    }
  };

  const handleToggleClose = async () => {
    if (!record || !selectedArea) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isClosing = !record.closed;
    handleUpdateRecord({ 
        closed: isClosing,
        closed_at: isClosing ? new Date().toISOString() : undefined,
        closed_by: isClosing ? user.id : undefined
    });
    // Trigger save automatically after closing/opening
    setTimeout(() => handleSave(), 100);
  };

  const handleToggleCheck = async () => {
    if (!record || !selectedArea) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isChecking = !record.checked;
    handleUpdateRecord({ 
        checked: isChecking,
        checked_at: isChecking ? new Date().toISOString() : undefined,
        checked_by: isChecking ? user.id : undefined
    });
    setTimeout(() => handleSave(), 100);
  };

  if (loading && !areas.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Buscando informações...</p>
      </div>
    );
  }

  if (!loading && areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md">
          <Warehouse className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma área encontrada</h2>
          <p className="text-slate-500 mb-8">
            Você precisa cadastrar sua primeira área de atuação para começar a usar o sistema.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            Verificar novamente
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Dica: Você pode cadastrar via SQL Editor ou pelo painel do Supabase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-12">
      <Header 
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
        areas={areas}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onRefreshAreas={fetchAreas}
        isModified={isModified}
        isSaved={!!originalRecord && !isModified}
        isClosed={!!record?.closed}
        isChecked={!!record?.checked}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl animate-in fade-in duration-500">
        {/* Resumo Rápido Superior (4 Cards agora) */}
        {!loading && areas.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <div className="card p-4 flex flex-col items-center justify-center border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Bruto</span>
                <span className="text-xl font-black text-slate-800">R$ {record?.total_entries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="card p-4 flex flex-col items-center justify-center border-l-4 border-l-red-500 bg-white/80 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comissão</span>
                <span className="text-xl font-black text-red-600">R$ {record?.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="card p-4 flex flex-col items-center justify-center border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prêmios</span>
                <span className="text-xl font-black text-orange-600">R$ {record?.total_prizes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="card p-4 flex flex-col items-center justify-center border-l-4 border-l-green-500 bg-green-50/50 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Líquido</span>
                <span className="text-2xl font-black text-green-700">R$ {record?.total_net_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        )}

        <ControlPanel 
          onSave={handleSave}
          onNew={handleNewDay}
          saving={saving}
          isModified={isModified}
          areaName={selectedArea?.name || ""}
          date={selectedDate}
          record={record}
          areaId={selectedArea?.id || ""}
        />
        
        <div className="mt-6">
          <div className="card border-none shadow-2xl overflow-visible bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex justify-end items-center bg-white">
               <div className="flex gap-2">
                  <span className={`badge ${commissionSettings ? 'badge-info' : 'badge-muted'}`}>
                    {commissionSettings ? `Comissão: ${commissionSettings.auto_calculate ? 'Automática' : 'Manual'}` : 'Comissão Não Configurada'}
                  </span>
                  {record?.closed && <span className="badge badge-info flex items-center gap-1"><Lock size={10} /> Fechado</span>}
                  {record?.checked && <span className="badge badge-success flex items-center gap-1"><FileCheck size={10} /> Conferido</span>}
               </div>
            </div>
            
            <DailyTable 
              record={record} 
              onChange={handleUpdateRecord}
              commissionSettings={commissionSettings}
            />
            
            {/* Totais abaixo da tabela conforme imagem */}
            <div className="p-8 bg-slate-50/30 border-t border-slate-50">
               <TotalsSection record={record} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
