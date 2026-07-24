"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowLeft, Layers, Sun, Moon, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/login?signup=success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-500 selection:bg-indigo-500 selection:text-white ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Background Animated Lights */}
      {isDarkMode ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-slate-50 to-slate-50 pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Floating Controls Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link 
          href="/" 
          className={`flex items-center gap-2 border backdrop-blur-xl rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 shadow-lg group active:scale-95 ${
            isDarkMode
              ? "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-400"
              : "bg-white/80 hover:bg-white border-slate-200 hover:border-indigo-500/40 text-slate-700 hover:text-indigo-600 shadow-slate-200/50"
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5 text-indigo-500 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full border transition duration-300 shadow-md ${
            isDarkMode 
              ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className={`w-full max-w-md space-y-6 backdrop-blur-2xl border p-8 rounded-3xl relative z-10 transition-colors duration-500 ${
        isDarkMode
          ? "bg-slate-900/70 border-slate-800/90 shadow-2xl shadow-slate-950/80 text-slate-100"
          : "bg-white/90 border-slate-200/90 shadow-2xl shadow-indigo-950/5 text-slate-900"
      }`}>
        {/* Top Decorative Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 mb-2">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Register Workspace
          </h2>
          <p className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Set up your organization tenant and start analyzing feedback
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded-xl text-center font-medium animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3.5">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Full Name
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-500/20"
                }`}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Work Email Address
              </label>
              <input
                type="email"
                required
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                  isDarkMode
                    ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-500/20"
                }`}
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Workspace / Company Name
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-500/20"
                }`}
                placeholder="Acme Corp"
                value={formData.workspaceName}
                onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Password
              </label>
              <input
                type="password"
                required
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                  isDarkMode
                    ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-500/20"
                }`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 shadow-xl shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Creating workspace...</span>
            ) : (
              <>
                Register Tenant Workspace
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className={`text-center text-xs pt-4 border-t flex items-center justify-between ${
            isDarkMode ? "border-slate-800/80 text-slate-400" : "border-slate-200 text-slate-500"
          }`}>
            <span>Already registered?</span>
            <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition">
              Log in to Workspace &rarr;
            </Link>
          </div>
        </form>
      </div>

      {/* Security & Encryption Badge */}
      <div className={`mt-6 flex items-center justify-center gap-2 text-xs font-semibold ${
        isDarkMode ? "text-slate-400" : "text-slate-500"
      }`}>
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Protected by 256-Bit SSL Encryption & Enterprise Security</span>
      </div>
    </div>
  );
}
