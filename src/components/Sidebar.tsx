"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LayoutDashboard, 
  Inbox, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut,
  User as UserIcon,
  Layers,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    workspaceId: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/inbox", icon: Inbox, badge: "48" },
    { name: "Trends", href: "/trends", icon: TrendingUp },
    { name: "Ask LOOP", href: "/ask", icon: MessageSquare },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Helper for role badge colors
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-coral-500/10 text-rose-400 border border-rose-500/20";
      case "ANALYST":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <>
      {/* Mobile Top Navigation Header (Visible only on < md screens) */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[#0b0d17] border-b border-slate-800/80 shrink-0 sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 w-7 h-7 rounded-lg text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-500/30">
            L
          </div>
          <span className="font-black text-base tracking-tight text-white">
            LOOP
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-800 text-slate-400"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
            aria-label="Open Navigation Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Drawer (Desktop permanent + Mobile slide-over) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-[#0b0d17] dark:bg-[#0b0d17] flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 print:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 w-8 h-8 rounded-xl text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
              L
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              LOOP
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Add Feedback Actions */}
        <div className="p-4 space-y-3 border-b border-slate-800/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          <Link
            href="/inbox"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-500/25 border border-indigo-400/20"
          >
            <span className="text-sm font-black">+</span> Add feedback
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="bg-slate-800 rounded-full p-2 text-slate-400 shrink-0 border border-slate-700/50">
              <UserIcon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user.name || "User"}
              </p>
              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold rounded-md mt-0.5 uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Toggles & SignOut controls */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              {isDarkMode ? (
                <Sun className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
              Theme
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              Log Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
