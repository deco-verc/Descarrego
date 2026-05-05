"use client";

import { useState } from "react";
import { Area } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Warehouse,
  ChevronDown,
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import SettingsModal from "./SettingsModal";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface HeaderProps {
  areas: Area[];
  selectedArea: Area | null;
  onSelectArea: (area: Area) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onRefreshAreas: () => void;
  onRefreshRecord: () => void;
}

export default function Header({ 
  areas, 
  selectedArea, 
  onSelectArea, 
  selectedDate, 
  onSelectDate,
  onRefreshAreas,
  onRefreshRecord
}: HeaderProps) {
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[60] py-6 shadow-sm no-print">
      <div className="container mx-auto px-4">
        {/* Main Centered Branding Block */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Warehouse className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)]">Roteiro Descarga</h1>
          </div>
          
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-blue-600 underline decoration-2 underline-offset-4 cursor-pointer" onClick={() => setShowAreaMenu(!showAreaMenu)}>
              {selectedArea?.name || "Selecionar Banca"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{format(parseISO(selectedDate), "dd/MM/yyyy")}</span>
          </div>
        </div>

        {/* Floating Controls (Absolute positioned if needed, but for now below) */}
        <div className="mt-6 flex items-center justify-center gap-4">
           {/* Date Controls */}
           <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
              <button 
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
                onClick={() => {
                  const d = new Date(selectedDate + 'T12:00:00');
                  d.setDate(d.getDate() - 1);
                  onSelectDate(format(d, "yyyy-MM-dd"));
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="relative px-2">
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm">
                  <CalendarIcon size={16} />
                  <span>{format(parseISO(selectedDate), "EEE, dd MMM", { locale: ptBR })}</span>
                  <input 
                    type="date" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => onSelectDate(e.target.value)}
                  />
                </button>
              </div>

              <button 
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
                onClick={() => {
                  const d = new Date(selectedDate + 'T12:00:00');
                  d.setDate(d.getDate() + 1);
                  onSelectDate(format(d, "yyyy-MM-dd"));
                }}
              >
                <ChevronRight size={20} />
              </button>
           </div>

           {/* Area Selector Button (If menu not open via title) */}
           <div className="relative">
              <button 
                onClick={() => setShowAreaMenu(!showAreaMenu)}
                className="btn-secondary font-bold text-xs uppercase tracking-widest px-4"
              >
                Bancas <ChevronDown size={14} className={`ml-1 transition-transform ${showAreaMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAreaMenu && (
                <>
                  <div className="fixed inset-0 z-[65]" onClick={() => setShowAreaMenu(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternar Banca</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {areas.map(area => (
                        <button
                          key={area.id}
                          onClick={() => {
                            onSelectArea(area);
                            setShowAreaMenu(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-sm font-bold transition-all border-b border-slate-50 last:border-0 ${selectedArea?.id === area.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {area.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
           </div>

           <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Configurações"
              >
                <SettingsIcon size={20} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
           </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => {
            setShowSettings(false);
            onRefreshRecord();
          }}
          selectedArea={selectedArea}
          onRefreshAreas={async () => onRefreshAreas()}
        />
      )}
    </header>
  );
}
