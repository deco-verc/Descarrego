"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Area, CommissionSettings, CommissionType, ApplyMode } from "@/types";
import { toast } from "sonner";
import { Save, Loader2, Info, ChevronRight, ChevronDown } from "lucide-react";
import { createAuditLog, getChangedFields } from "@/lib/audit";

export default function CommissionManager({ selectedArea }: { selectedArea: Area | null }) {
  const [settings, setSettings] = useState<Partial<CommissionSettings> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      // Default settings for new areas
      setSettings({
        area_id: selectedArea.id,
        commission_type: "manual",
        default_percentage: 0,
        default_fixed_value: 0,
        apply_mode: "period",
        auto_calculate: false,
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

    const payload = {
      ...settings,
      user_id: user.id,
      area_id: selectedArea.id,
      updated_at: new Date().toISOString()
    };

    // Get old data for audit
    const { data: oldData } = await supabase
      .from("commission_settings")
      .select("*")
      .eq("area_id", selectedArea.id)
      .single();

    const { data, error } = await supabase
      .from("commission_settings")
      .upsert(payload, { onConflict: "user_id,area_id" })
      .select().single();

    if (error) {
      toast.error("Erro ao salvar configurações");
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
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-700 text-sm">
        <Info size={20} className="shrink-0" />
        <p>Configurando comissão para <strong>{selectedArea.name}</strong>. Estas regras serão aplicadas automaticamente aos novos registros desta área.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="input-label">Tipo de Comissão</label>
            <select
              value={settings.commission_type}
              onChange={(e) => setSettings({...settings, commission_type: e.target.value as CommissionType})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manual">Digitação Manual</option>
              <option value="percentage">Porcentagem (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>
          </div>

          {settings.commission_type === 'percentage' && (
            <div>
              <label className="input-label">Porcentagem Padrão (%)</label>
              <input
                type="number"
                value={settings.default_percentage}
                onChange={(e) => setSettings({...settings, default_percentage: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {settings.commission_type === 'fixed' && (
            <div>
              <label className="input-label">Valor Fixo Padrão (R$)</label>
              <input
                type="number"
                value={settings.default_fixed_value}
                onChange={(e) => setSettings({...settings, default_fixed_value: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-700 text-sm">Cálculo Automático</p>
              <p className="text-xs text-slate-500">Aplicar regras ao preencher entradas</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_calculate}
              onChange={(e) => setSettings({...settings, auto_calculate: e.target.checked})}
              className="w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-700 text-sm">Permitir Sobrescrita</p>
              <p className="text-xs text-slate-500">Permite editar o valor calculado no dia</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allow_manual_override}
              onChange={(e) => setSettings({...settings, allow_manual_override: e.target.checked})}
              className="w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showAdvanced ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          Configurações Avançadas por Período
        </button>

        {showAdvanced && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
            {['morning', 'afternoon', 'night', 'group_morning', 'group_afternoon', 'group_night'].map(period => (
              <div key={period} className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {period.replace('_', ' ').replace('morning', 'Manhã').replace('afternoon', 'Tarde').replace('night', 'Noite')}
                </label>
                <div className="relative">
                   <input
                    type="number"
                    value={(settings as any)[`${period}_${settings.commission_type === 'fixed' ? 'fixed_value' : 'percentage'}`] ?? 0}
                    onChange={(e) => setSettings({
                        ...settings, 
                        [`${period}_${settings.commission_type === 'fixed' ? 'fixed_value' : 'percentage'}`]: parseFloat(e.target.value) || 0
                    } as any)}
                    className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Usar padrão"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-sm">
                    {settings.commission_type === 'fixed' ? 'R$' : '%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
