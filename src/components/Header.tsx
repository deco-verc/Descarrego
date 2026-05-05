"use client";

import { Area } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  History, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Calendar as CalendarIcon,
  Warehouse
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

interface HeaderProps {
  selectedArea: Area | null;
  onSelectArea: (area: Area) => void;
  areas: Area[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onRefreshAreas: () => Promise<void>;
}

export default function Header({ 
  selectedArea, 
  onSelectArea, 
  areas, 
  selectedDate, 
  onSelectDate,
  onRefreshAreas
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formattedDate = format(parseISO(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <header className="area-header">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Warehouse className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">
              Roteiro Descarga - {selectedArea?.name || "Selecione uma Área"}
            </h1>
            <p className="text-blue-100 text-sm font-medium">{formattedDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-white outline-none text-sm cursor-pointer"
            />
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition-all">
               <span className="text-sm font-medium">{selectedArea?.name || "Escolher Área"}</span>
               <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 hidden group-hover:block z-50 overflow-hidden">
              {areas.map(area => (
                <button
                  key={area.id}
                  onClick={() => onSelectArea(area)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/20 pl-4 ml-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all" 
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-all text-red-200 hover:text-white" 
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onRefreshAreas={onRefreshAreas}
        selectedArea={selectedArea}
      />
    </header>
  );
}
