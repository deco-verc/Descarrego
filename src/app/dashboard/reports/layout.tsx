"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, LayoutGrid, CalendarRange, CalendarDays } from "lucide-react";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: "daily", label: "Diário", icon: Calendar, path: "/reports/daily" },
    { id: "weekly", label: "Semanal", icon: CalendarRange, path: "/reports/weekly" },
    { id: "monthly", label: "Mensal", icon: CalendarDays, path: "/reports/monthly" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f7ff] pb-20">
      <header className="bg-blue-800 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.push("/")}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Relatórios de Descarrego</h1>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  pathname === tab.path 
                    ? 'bg-white text-blue-800 shadow-xl scale-105' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 -mt-4">
        {children}
      </main>
    </div>
  );
}
