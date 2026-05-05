"use client";

import { useState } from "react";
import { Area } from "@/types";
import { X, LayoutGrid, Calculator, ScrollText, Settings2, Plus } from "lucide-react";
import AreaManager from "./AreaManager";
import CommissionManager from "./CommissionManager";
import LogViewer from "./LogViewer";
import AppSettingsManager from "./AppSettingsManager";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAreas: () => Promise<void>;
  selectedArea: Area | null;
}

type Tab = "geral" | "areas" | "commissions" | "logs";

export default function SettingsModal({ isOpen, onClose, onRefreshAreas, selectedArea }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("geral");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                <Plus className="text-white w-6 h-6 rotate-45" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Painel de Configurações</h2>
              <p className="text-slate-500 text-sm">Gerencie preferências, áreas, comissões e logs do sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("geral")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'geral' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <Settings2 size={18} />
              Geral
            </button>
            <button
              onClick={() => setActiveTab("areas")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'areas' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <LayoutGrid size={18} />
              Áreas / Bancas
            </button>
            <button
              onClick={() => setActiveTab("commissions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'commissions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <Calculator size={18} />
              Comissões
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <ScrollText size={18} />
              Logs / Auditoria
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {activeTab === 'geral' && <AppSettingsManager />}
            {activeTab === 'areas' && <AreaManager onRefresh={onRefreshAreas} />}
            {activeTab === 'commissions' && <CommissionManager selectedArea={selectedArea} />}
            {activeTab === 'logs' && <LogViewer />}
          </div>
        </div>
      </div>
    </div>
  );
}
