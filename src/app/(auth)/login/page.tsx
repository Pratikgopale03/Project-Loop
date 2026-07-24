"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowLeft, Layers, Mail, Lock, ArrowRight, Sparkles, Sun, Moon } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setSuccess("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        throw new Error("Invalid email or password");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-500 selection:bg-indigo-500 selection:text-white ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Ambient Radial Mesh Lights */}
      {isDarkMode ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-blue-600/5 rounded-full blur-[140px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-slate-50 to-slate-50 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-blue-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Top Floating Controls Header */}
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

        <div className="flex items-center gap-3">
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
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <div className={`backdrop-blur-2xl border rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-colors duration-500 ${
          isDarkMode
            ? "bg-slate-900/70 border-slate-800/90 shadow-2xl shadow-slate-950/80 text-slate-100"
            : "bg-white/90 border-slate-200/90 shadow-2xl shadow-indigo-950/5 text-slate-900"
        }`}>
          {/* Top Decorative Card Highlight Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isDarkMode 
                  ? "bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-indigo-600 via-slate-800 to-indigo-900 bg-clip-text text-transparent"
              }`}>
                Project LOOP
              </h1>
              <p className={`text-xs font-medium mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                AI Customer Feedback Intelligence Platform
              </p>
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mt-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500 text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium animate-in fade-in duration-200">
              {success}
            </div>
          )}

          {/* Main Credentials Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className={`h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`} />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                      isDarkMode
                        ? "bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-500/20"
                    }`}
                    placeholder="admin@loop.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`} />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 group relative flex w-full justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-xl shadow-indigo-600/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 text-center text-xs pt-4 border-t flex items-center justify-between ${
            isDarkMode ? "border-slate-800/80 text-slate-400" : "border-slate-200 text-slate-500"
          }`}>
            <span>New tenant workspace?</span>
            <Link href="/signup" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition">
              Register Workspace &rarr;
            </Link>
          </div>
        </div>

        {/* Footer Credit & Badges */}
        <div className={`mt-6 text-center text-[11px] space-y-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          <p>Protected by PostgreSQL Row-Level Workspace Isolation</p>
          <p className="text-[10px] opacity-75">Project LOOP Platform v2.4 • Anthropic Claude 3.5 Sonnet</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-xs animate-pulse font-mono">
        Loading authentication...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
