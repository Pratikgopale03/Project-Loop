"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Layers, 
  ArrowRight, 
  Shield, 
  Activity, 
  Search, 
  Sun, 
  Moon 
} from "lucide-react";

export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();


  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-55 text-slate-900"
    }`}>
      {/* Premium Keyframes and Grid Styles */}
      <style jsx global>{`
        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatBlob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95) rotate(240deg);
          }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .anim-reveal-1 {
          opacity: 0;
          animation: revealUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        .anim-reveal-2 {
          opacity: 0;
          animation: revealUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }
        .anim-reveal-3 {
          opacity: 0;
          animation: revealUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }
        .anim-reveal-cards {
          opacity: 0;
          animation: revealUp 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
        }
        .animate-float-blob-1 {
          animation: floatBlob 25s ease-in-out infinite;
        }
        .animate-float-blob-2 {
          animation: floatBlob 30s ease-in-out infinite alternate;
        }
        .animate-float-icon {
          animation: floatIcon 3.5s ease-in-out infinite;
        }
        .bg-grid-mesh {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, ${isDarkMode ? "rgba(99, 102, 241, 0.03)" : "rgba(99, 102, 241, 0.05)"} 1px, transparent 1px),
            linear-gradient(to bottom, ${isDarkMode ? "rgba(99, 102, 241, 0.03)" : "rgba(99, 102, 241, 0.05)"} 1px, transparent 1px);
        }
      `}</style>

      {/* Background Mesh Grid */}
      <div className="absolute inset-0 bg-grid-mesh pointer-events-none z-0" />

      {/* Orbiting Background glowing blobs */}
      <div className={`absolute top-[-10%] left-1/4 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none transition-all duration-500 animate-float-blob-1 ${
        isDarkMode ? "bg-indigo-600/10" : "bg-indigo-500/5"
      }`} />
      <div className={`absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none transition-all duration-500 animate-float-blob-2 ${
        isDarkMode ? "bg-blue-600/10" : "bg-blue-500/5"
      }`} />

      {/* Header / Navbar */}
      <header className={`h-16 border-b backdrop-blur-md px-6 md:px-12 flex items-center justify-between relative z-10 transition-colors duration-500 ${
        isDarkMode 
          ? "border-slate-800/80 bg-slate-950/40 text-slate-100" 
          : "border-slate-200/80 bg-white/40 text-slate-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-650/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Project LOOP
            </span>
            <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              Feedback Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition duration-300 ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Sign In — premium ghost button */}
          <Link
            href="/login"
            className={`relative inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide border transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97] ${
              isDarkMode
                ? "bg-transparent hover:bg-indigo-500/8 border-slate-700 hover:border-indigo-500/60 text-slate-300 hover:text-indigo-300 shadow-none hover:shadow-indigo-500/10 hover:shadow-lg"
                : "bg-white hover:bg-indigo-50/70 border-slate-300 hover:border-indigo-400/70 text-slate-700 hover:text-indigo-700 shadow-sm hover:shadow-md shadow-slate-200/60"
            }`}
          >
            Sign In
          </Link>

          {/* Get Started — rich gradient glow button */}
          <Link
            href="/signup"
            className="relative inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black tracking-wide text-white transition-all duration-300 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px -4px rgba(99,102,241,0.5), 0 1px 3px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(167,139,250,0.5), 0 0 28px -4px rgba(139,92,246,0.7), 0 8px 32px -6px rgba(99,102,241,0.6), 0 1px 3px rgba(0,0,0,0.2)";
              (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7e22ce 100%)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px -4px rgba(99,102,241,0.5), 0 1px 3px rgba(0,0,0,0.2)";
              (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)";
            }}
          >
            Get Started →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 md:px-12 py-24 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Floating Tag */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 border rounded-full text-xs font-semibold mb-8 anim-reveal-1 transition-all ${
          isDarkMode 
            ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-400" 
            : "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-md shadow-indigo-100/50"
        }`}>
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
          <span>Internship Submission Ready</span>
        </div>

        {/* Hero Title */}
        <h1 className={`text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.08] anim-reveal-2 transition-all ${
          isDarkMode 
            ? "bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent text-shadow-sm" 
            : "text-slate-950"
        }`}>
          Transform Customer Feedback into Ranked Product Insights
        </h1>

        {/* Hero Description */}
        <p className={`text-lg md:text-xl max-w-2xl mt-8 leading-relaxed anim-reveal-3 transition-colors duration-500 ${
          isDarkMode ? "text-slate-450" : "text-slate-600 font-medium"
        }`}>
          LOOP ingests multi-channel reviews, support tickets, and sales notes, clusters them into automated themes with AI, and answers grounded questions.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md anim-reveal-3">
          <Link 
            href="/signup" 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold px-7 py-4 rounded-lg shadow-xl shadow-indigo-600/20 hover:shadow-indigo-650/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] text-base"
          >
            Register Workspace
            <ArrowRight className="h-4 w-4 animate-bounce-horizontal" />
          </Link>
          <Link 
            href="/login" 
            className={`flex items-center justify-center border font-bold px-7 py-4 rounded-lg active:scale-[0.98] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] text-base ${
              isDarkMode 
                ? "bg-slate-900 hover:bg-slate-800/80 border-slate-800/60 hover:border-slate-700 text-slate-200 shadow-lg shadow-black/10 hover:shadow-black/20" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-md hover:shadow-lg shadow-slate-100/50"
            }`}
          >
            Access Dashboard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-28 w-full anim-reveal-cards">
          {/* Card 1 */}
          <div className={`p-6 rounded-2xl text-left border transform transition-all duration-300 group ${
            isDarkMode 
              ? "bg-slate-900/10 border-slate-800/40 text-slate-200 shadow-sm shadow-black/5 hover:-translate-y-2 hover:scale-[1.01] hover:border-indigo-500/35 hover:bg-slate-900/30 hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]" 
              : "bg-white border-slate-200/60 text-slate-800 shadow-lg shadow-slate-100/50 hover:-translate-y-2 hover:scale-[1.01] hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5"
          }`}>
            <div className={`p-3 rounded-xl border w-fit transition-all duration-300 animate-float-icon ${
              isDarkMode 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/10 group-hover:bg-indigo-650/20" 
                : "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100"
            }`}>
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg mt-5">Isolated Multi-Tenancy</h3>
            <p className={`text-sm mt-2 leading-relaxed transition-colors duration-500 ${
              isDarkMode ? "text-slate-450" : "text-slate-650"
            }`}>
              Every query is filtered by workspaceId. Bulletproof security boundaries prevent cross-tenant data leakage.
            </p>
          </div>

          {/* Card 2 */}
          <div className={`p-6 rounded-2xl text-left border transform transition-all duration-300 group ${
            isDarkMode 
              ? "bg-slate-900/10 border-slate-800/40 text-slate-200 shadow-sm shadow-black/5 hover:-translate-y-2 hover:scale-[1.01] hover:border-emerald-500/35 hover:bg-slate-900/30 hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]" 
              : "bg-white border-slate-200/60 text-slate-800 shadow-lg shadow-slate-100/50 hover:-translate-y-2 hover:scale-[1.01] hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5"
          }`}>
            <div className={`p-3 rounded-xl border w-fit transition-all duration-300 animate-float-icon [animation-delay:1s] ${
              isDarkMode 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10 group-hover:bg-emerald-650/20" 
                : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100"
            }`}>
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg mt-5">Role-Based Access</h3>
            <p className={`text-sm mt-2 leading-relaxed transition-colors duration-500 ${
              isDarkMode ? "text-slate-450" : "text-slate-650"
            }`}>
              Granular role control. ADMIN, ANALYST, and VIEWER roles are fully enforced on the server-side.
            </p>
          </div>

          {/* Card 3 */}
          <div className={`p-6 rounded-2xl text-left border transform transition-all duration-300 group ${
            isDarkMode 
              ? "bg-slate-900/10 border-slate-800/40 text-slate-200 shadow-sm shadow-black/5 hover:-translate-y-2 hover:scale-[1.01] hover:border-blue-500/35 hover:bg-slate-900/30 hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)]" 
              : "bg-white border-slate-200/60 text-slate-800 shadow-lg shadow-slate-100/50 hover:-translate-y-2 hover:scale-[1.01] hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5"
          }`}>
            <div className={`p-3 rounded-xl border w-fit transition-all duration-300 animate-float-icon [animation-delay:2s] ${
              isDarkMode 
                ? "bg-blue-500/10 text-blue-400 border-blue-500/10 group-hover:bg-blue-650/20" 
                : "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100"
            }`}>
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg mt-5">AI Ingestion & Search</h3>
            <p className={`text-sm mt-2 leading-relaxed transition-colors duration-500 ${
              isDarkMode ? "text-slate-450" : "text-slate-650"
            }`}>
              Automatic sentiment scoring, semantic vector search, and Claude-powered question answering.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-6 text-center text-xs relative z-10 mt-auto transition-colors duration-500 ${
        isDarkMode ? "border-t border-slate-900 text-slate-650" : "border-t border-slate-200 text-slate-500"
      }`}>
        <p>© 2026 Project LOOP. Built for Graded Internship Submission. Confidential.</p>
      </footer>
    </div>
  );
}
