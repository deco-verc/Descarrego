"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { AppSettings, Area } from "@/types";
import { toast } from "sonner";
import { Save, Loader2, Building2, FileText, Landmark } from "lucide-react";

export default function AppSettingsManager() {
  const [settings, setSettings] = useState<Partial<AppSettings> | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: areasData } = await supabase
        .from("areas")
        .select("*")
        .eq("active", true);

      if (settingsData) setSettings(settingsData);
      else setSettings({ user_id: user.id, company_name: "Minha Empresa" });
      
      setAreas(areasData || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    
    const { error } = await supabase
      .from("app_settings")
      .upsert(settings, { onConflict: "user_id" });

    if (error) {
      toast.error("Erro ao salvar preferências");
    } else {
      toast.success("Preferências salvas com sucesso!");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                Nome da Empresa
            </label>
            <input
              type="text"
              value={settings?.company_name || ""}
              onChange={(e) => setSettings({...settings!, company_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Real Cariri"
            />
          </div>

          <div className="space-y-2">
            <label className="input-label flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Título do Cabeçalho (Relatórios)
            </label>
            <input
              type="text"
              value={settings?.report_header_title || ""}
              onChange={(e) => setSettings({...settings!, report_header_title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Roteiro Descarga Oficial"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2">
                <Landmark size={16} className="text-blue-600" />
                Área Padrão ao Iniciar
            </label>
            <select
              value={settings?.default_area_id || ""}
              onChange={(e) => setSettings({...settings!, default_area_id: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Nenhuma (Sempre escolher)</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="input-label">Moeda Padrão</label>
            <select
              value={settings?.currency || "BRL"}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Preferências
        </button>
      </div>
    </div>
  );
}
