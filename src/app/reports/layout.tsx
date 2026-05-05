"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CalendarRange, CalendarDays, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const tabs = [
    { id: "daily", label: "Diário", icon: Calendar, path: "/reports/daily" },
    { id: "weekly", label: "Semanal", icon: CalendarRange, path: "/reports/weekly" },
    { id: "monthly", label: "Mensal", icon: CalendarDays, path: "/reports/monthly" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Carregando seus relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff] pb-20">
      <header className="bg-blue-800 text-white shadow-lg overflow-hidden relative no-print">
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
