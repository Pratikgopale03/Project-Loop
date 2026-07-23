"use client";

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
  Moon
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

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Trends", href: "/trends", icon: TrendingUp },
    { name: "Ask LOOP", href: "/ask", icon: MessageSquare },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Helper for role badge colors
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20";
      case "ANALYST":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full shrink-0 transition-colors duration-300 print:hidden">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-600/20">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <span className="font-black text-lg tracking-tight text-indigo-600 dark:text-indigo-400">
            Project LOOP
          </span>
          <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Feedback Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-250"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 transition-colors duration-300">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-full p-1.5 text-slate-500 dark:text-slate-400">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {user.name || "User"}
            </p>
            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-extrabold rounded-md mt-0.5 uppercase tracking-wider ${getRoleBadge(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Toggles & SignOut controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-550" />}
            Theme
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-500" />
            Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}

