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
      }
    }
  }, [supabase, selectedArea]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const fetchRecord = useCallback(async () => {
    if (!selectedArea || !selectedDate) return;
    
    setLoading(true);
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
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header 
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
        areas={areas}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onRefreshAreas={fetchAreas}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
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
        
        <div className="mt-8 space-y-8">
          <DailyTable 
            record={record} 
            onChange={handleUpdateRecord}
            commissionSettings={commissionSettings}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
             <TotalsSection record={record} />
             {/* We can add another section here like notes or quick history if needed */}
          </div>
        </div>
      </main>
    </div>
  );
}
