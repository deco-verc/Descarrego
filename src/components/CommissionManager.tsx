"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Area, CommissionSettings } from "@/types";
import { toast } from "sonner";
import { Save, Loader2, Info, Percent } from "lucide-react";
import { createAuditLog, getChangedFields } from "@/lib/audit";

export default function CommissionManager({ selectedArea }: { selectedArea: Area | null }) {
  const [settings, setSettings] = useState<Partial<CommissionSettings> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (selectedArea) {
      fetchSettings();
    }
  }, [selectedArea]);

  const fetchSettings = async () => {
    if (!selectedArea) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("commission_settings")
      .select("*")
      .eq("area_id", selectedArea.id)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Erro ao carregar configurações");
    } else if (data) {
      setSettings(data);
    } else {
      setSettings({
        area_id: selectedArea.id,
        commission_type: "percentage",
        default_percentage: 0,
        apply_mode: "period",
        auto_calculate: true,
        allow_manual_override: true
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedArea || !settings) return;
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Forçar sempre tipo porcentagem
    const payload = {
      ...settings,
      commission_type: "percentage",
      user_id: user.id,
      area_id: selectedArea.id,
      updated_at: new Date().toISOString()
    };

    const { data: oldData } = await supabase
      .from("commission_settings")
      .select("*")
      .eq("area_id", selectedArea.id)
      .single();

    const { data, error } = await supabase
      .from("commission_settings")
      .upsert(payload, { onConflict: "area_id" })
      .select().single();

    if (error) {
      toast.error("Erro ao salvar configurações: " + error.message);
    } else {
      toast.success("Configurações salvas!");
      setSettings(data);
      
      await createAuditLog({
        action: oldData ? "UPDATE_COMMISSION_SETTINGS" : "CREATE_COMMISSION_SETTINGS",
        entity_type: "COMMISSION_SETTINGS",
        entity_id: data.id,
        area_id: selectedArea.id,
        old_data: oldData,
        new_data: data,
        changed_fields: getChangedFields(oldData, data)
      });
    }
    setSaving(false);
  };

  if (!selectedArea) {
    return <div className="p-8 text-center text-slate-500">Selecione uma área para configurar as comissões.</div>;
  }

  if (loading || !settings) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex gap-3 text-blue-700 text-sm">
          <Info size={20} className="shrink-0" />
          <p>Defina as porcentagens fixas de comissão para Milhar e Grupo da banca <strong>{selectedArea.name}</strong>.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100">
          <span className="text-xs font-bold text-slate-600 uppercase">Cálculo Automático</span>
          <button
            onClick={() => setSettings({ ...settings, auto_calculate: !settings?.auto_calculate })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings?.auto_calculate ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.auto_calculate ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-6 border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Percent size={16} />
              </div>
              <h4 className="font-bold text-slate-800">Comissões Milhar</h4>
           </div>
           
           <div className="space-y-4">
             {['morning', 'afternoon', 'night'].map(period => (
               <div key={period} className="flex items-center justify-between gap-4">
                 <label className="text-sm font-medium text-slate-600">{period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'}</label>
                 <div className="relative w-32">
                   <input
                     type="number"
                     value={(settings as any)[`${period}_percentage`] ?? 0}
                     onChange={(e) => setSettings({...settings, [`${period}_percentage`]: parseFloat(e.target.value) || 0})}
                     className="w-full pl-4 pr-8 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                   />
                   <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="card p-6 border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                <Percent size={16} />
              </div>
              <h4 className="font-bold text-slate-800">Comissões Grupo</h4>
           </div>
           
           <div className="space-y-4">
             {['group_morning', 'group_afternoon', 'group_night'].map(period => (
               <div key={period} className="flex items-center justify-between gap-4">
                 <label className="text-sm font-medium text-slate-600">{period.includes('morning') ? 'Manhã' : period.includes('afternoon') ? 'Tarde' : 'Noite'}</label>
                 <div className="relative w-32">
                   <input
                     type="number"
                     value={(settings as any)[`${period}_percentage`] ?? 0}
                     onChange={(e) => setSettings({...settings, [`${period}_percentage`]: parseFloat(e.target.value) || 0})}
                     className="w-full pl-4 pr-8 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                   />
                   <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full md:w-auto justify-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações de Comissão
        </button>
      </div>
    </div>
  );
}
