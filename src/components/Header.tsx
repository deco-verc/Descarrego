"use client";

import { Area } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Settings, 
  LogOut, 
  ChevronDown, 
  Calendar as CalendarIcon,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

interface HeaderProps {
  selectedArea: Area | null;
  onSelectArea: (area: Area) => void;
  areas: Area[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onRefreshAreas: () => Promise<void>;
  isModified: boolean;
  isSaved: boolean;
  isClosed: boolean;
  isChecked: boolean;
  onRefreshRecord: () => void;
}

export default function Header({ 
  selectedArea, 
  onSelectArea, 
  areas, 
  selectedDate, 
  onSelectDate,
  onRefreshAreas,
  isModified,
  isSaved,
  isClosed,
  isChecked,
  onRefreshRecord
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showAreaMenu, setShowAreaMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formattedDate = format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[60] py-3 shadow-sm">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <Warehouse className="text-white w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-lg font-bold text-slate-800 leading-none">Roteiro Descarga</h1>
               {isClosed ? (
                 <span className="badge badge-info flex items-center gap-1">
                   <Lock size={10} /> Fechado
                 </span>
               ) : isChecked ? (
                 <span className="badge badge-success flex items-center gap-1">
                   <FileCheck size={10} /> Conferido
                 </span>
               ) : isModified ? (
                 <span className="badge badge-warning flex items-center gap-1 animate-pulse">
                   <AlertCircle size={10} /> Alterações não salvas
                 </span>
               ) : isSaved ? (
                 <span className="badge badge-success flex items-center gap-1">
                   <CheckCircle2 size={10} /> Dia Salvo
                 </span>
               ) : (
                 <span className="badge badge-muted">Novo Lançamento</span>
               )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              <span className="text-blue-600 font-bold">{selectedArea?.name || "Nenhuma Área"}</span>
              <span className="mx-1 text-slate-300">•</span>
              {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Picker de Data Elegante */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-700 outline-none text-sm font-medium cursor-pointer"
            />
          </div>

          {/* Seletor de Área dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowAreaMenu(!showAreaMenu)}
              className={`flex items-center gap-2 bg-white hover:bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 transition-all font-semibold text-sm text-slate-700 ${showAreaMenu ? 'ring-2 ring-blue-500 border-blue-200' : ''}`}
            >
               <span>Trocar Área</span>
               <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAreaMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showAreaMenu && (
              <>
                <div className="fixed inset-0 z-[65]" onClick={() => setShowAreaMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Áreas Disponíveis</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {areas.map(area => (
                      <button
                        key={area.id}
                        onClick={() => {
                          onSelectArea(area);
                          setShowAreaMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${selectedArea?.id === area.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {area.name}
                        {selectedArea?.id === area.id && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-100 pl-3 ml-1">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => {
          setShowSettings(false);
          onRefreshRecord();
        }} 
        onRefreshAreas={onRefreshAreas}
        selectedArea={selectedArea}
      />
    </header>
  );
}
