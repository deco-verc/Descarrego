"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Area } from "@/types";
import { toast } from "sonner";
import { Trash2, Edit2, Check, X, Plus, Loader2 } from "lucide-react";
import { createAuditLog } from "@/lib/audit";

export default function AreaManager({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const supabase = createClient();

  const fetchAreas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("areas").select("*").order("name");
    if (error) {
      toast.error("Erro ao buscar áreas");
    } else {
      setAreas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("areas").insert({
      name: newAreaName,
      user_id: user.id
    }).select().single();

    if (error) {
      toast.error("Erro ao criar área: " + error.message);
    } else {
      toast.success("Área criada com sucesso!");
      setNewAreaName("");
      fetchAreas();
      onRefresh();
      
      await createAuditLog({
        action: "CREATE_AREA",
        entity_type: "AREA",
        entity_id: data.id,
        new_data: data
      });
    }
  };

  const handleUpdateArea = async (area: Area) => {
    const { data, error } = await supabase
      .from("areas")
      .update({ name: editName })
      .eq("id", area.id)
      .select().single();

    if (error) {
      toast.error("Erro ao atualizar área");
    } else {
      toast.success("Área atualizada");
      setEditingId(null);
      fetchAreas();
      onRefresh();
      
      await createAuditLog({
        action: "UPDATE_AREA",
        entity_type: "AREA",
        entity_id: area.id,
        old_data: area,
        new_data: data
      });
    }
  };

  const toggleStatus = async (area: Area) => {
    const { data, error } = await supabase
      .from("areas")
      .update({ active: !area.active })
      .eq("id", area.id)
      .select().single();

    if (error) {
      toast.error("Erro ao mudar status");
    } else {
      fetchAreas();
      onRefresh();
      
      await createAuditLog({
        action: "UPDATE_AREA",
        entity_type: "AREA",
        entity_id: area.id,
        old_data: area,
        new_data: data,
        changed_fields: ["active"]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          placeholder="Nome da nova área..."
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleAddArea}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : (
          areas.map(area => (
            <div key={area.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              {editingId === area.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-1 rounded-lg border border-blue-300 outline-none"
                  autoFocus
                />
              ) : (
                <span className={`font-medium ${!area.active ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {area.name}
                </span>
              )}

              <div className="flex items-center gap-2 ml-4">
                {editingId === area.id ? (
                  <>
                    <button onClick={() => handleUpdateArea(area)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => toggleStatus(area)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${area.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {area.active ? 'ATIVO' : 'INATIVO'}
                    </button>
                    <button 
                      onClick={() => { setEditingId(area.id); setEditName(area.name); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
