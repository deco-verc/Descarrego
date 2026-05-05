"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Loader2, Warehouse } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@sistema.local`,
      password,
    });

    if (error) {
      toast.error("Erro ao fazer login: " + error.message);
      setLoading(false);
    } else {
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Warehouse className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Roteiro Descarga</h1>
          <p className="text-slate-500">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="input-label">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label className="input-label">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-8 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Roteiro Descarga - v1.0
        </div>
      </div>
    </div>
  );
}
