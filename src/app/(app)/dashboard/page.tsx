"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { 
  TrendingUp, 
  Smile, 
  Frown, 
  Inbox, 
  Filter, 
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  Zap,
  AlertTriangle,
  Activity,
  Radio,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import FeatureSentimentMatrix from "@/components/FeatureSentimentMatrix";
import RealtimeAlertBanner from "@/components/RealtimeAlertBanner";

// Channel icon map
const CHANNEL_ICONS: Record<string, string> = {
  "Email": "📧",
  "Support Ticket": "🎫",
  "App Store Review": "⭐",
  "NPS Survey": "📊",
  "Sales Call Notes": "📞",
  "Twitter Mention": "🐦",
  "default": "💬",
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [channel, setChannel] = useState("ALL");
  const [dateRange, setDateRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  // Live Metrics state
  const [stats, setStats] = useState({
    total: 0,
    positiveRatio: 0,
    negativeRatio: 0,
    pendingTriage: 0,
  });
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [themeData, setThemeData] = useState<any[]>([]);

  // Live Pulse Ticker state
  const [recentFeed, setRecentFeed] = useState<any[]>([]);

  // Live refresh indicators
  const [tickerFlash, setTickerFlash] = useState(false);
  const [issueFlash, setIssueFlash] = useState(false);
  const [lastTickerRefresh, setLastTickerRefresh] = useState<Date | null>(null);
  const [lastIssueRefresh, setLastIssueRefresh] = useState<Date | null>(null);

  // Fetch Analytics (Burning Issues depends on this)
  const loadAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/analytics?channel=${channel}&dateRange=${dateRange}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const data = await res.json();
      setStats(data.stats);
      setVolumeData(data.volumeData);
      setSentimentData(data.sentimentData);
      setThemeData(data.themeData);
      if (silent) {
        setLastIssueRefresh(new Date());
        setIssueFlash(true);
        setTimeout(() => setIssueFlash(false), 1200);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch Live Ticker Feed
  const loadRecentFeed = async (silent = false) => {
    try {
      const res = await fetch(`/api/feedback/recent?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRecentFeed(data.items || []);
        if (silent) {
          setLastTickerRefresh(new Date());
          setTickerFlash(true);
          setTimeout(() => setTickerFlash(false), 1200);
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    Promise.all([loadAnalytics(false), loadRecentFeed(false)]);
  }, [channel, dateRange]);

  // Listen for immediate feedback updates (e.g. simulated sync or manual addition)
  useEffect(() => {
    const handleFeedbackUpdate = () => {
      loadRecentFeed(true);
      loadAnalytics(true);
    };
    window.addEventListener("feedback_updated", handleFeedbackUpdate);
    return () => window.removeEventListener("feedback_updated", handleFeedbackUpdate);
  }, []);

  // 🔴 LIVE POLLING — Pulse Ticker: every 10 seconds
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      loadRecentFeed(true);
    }, 10_000);
    return () => clearInterval(tickerInterval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-slate-100 dark:to-slate-300 dark:bg-clip-text dark:text-transparent">
            Workspace Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time trends, sentiment metrics, and automated classification for your feedback.
          </p>
        </div>

        {/* Global Dashboard Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors duration-300">
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              style={{ colorScheme: isDarkMode ? "dark" : "light" }}
            >
              <option value="7d" style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Last 7 Days</option>
              <option value="30d" style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Last 30 Days</option>
              <option value="90d" style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors duration-300">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              style={{ colorScheme: isDarkMode ? "dark" : "light" }}
            >
              <option value="ALL" style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>All Channels</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Email</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Support Ticket</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>App Store Review</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>NPS Survey</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Sales Call Notes</option>
              <option style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>Twitter Mention</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-Time Database Alert Banner */}
      <RealtimeAlertBanner />

      {loading ? (
        // Loading Skeleton
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-900/20 border border-slate-850 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-80 bg-slate-900/20 border border-slate-850 rounded-xl animate-pulse" />
            <div className="lg:col-span-4 h-80 bg-slate-900/20 border border-slate-850 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : stats.total === 0 ? (
        // Empty State Prompt
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-4">
          <div className="bg-indigo-600/10 text-indigo-400 p-4 rounded-full border border-indigo-500/25">
            <Database className="h-10 w-10 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-slate-200">No Feedback Available</h3>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            There is no feedback data in your workspace for the selected filters. Head over to the Feedback Inbox to add individual feedback, import a CSV, or seed mock channel integrations.
          </p>
          <Link
            href="/inbox"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
          >
            Go to Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        // Analytics Dashboard Layout
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat Card 1 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Feedback</p>
                  <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-200 mt-2">{stats.total}</h3>
                </div>
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2.5 rounded-lg border border-blue-500/10 dark:border-blue-500/10">
                  <Inbox className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 font-medium flex items-center gap-1">
                <span>Active volume across channels</span>
              </p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Positive Ratio</p>
                  <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-200 mt-2">{stats.positiveRatio}%</h3>
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg border border-emerald-500/10 dark:border-emerald-500/10">
                  <Smile className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-4 font-bold flex items-center gap-1">
                <span>Happy customer experiences</span>
              </p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Negative Ratio</p>
                  <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-200 mt-2">{stats.negativeRatio}%</h3>
                </div>
                <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg border border-rose-500/10 dark:border-rose-500/10">
                  <Frown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-4 font-bold flex items-center gap-1">
                <span>Requires attention</span>
              </p>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Triage</p>
                  <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-200 mt-2">{stats.pendingTriage}</h3>
                </div>
                <div className="bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 p-2.5 rounded-lg border border-indigo-500/10 dark:border-indigo-500/10">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-4 font-bold flex items-center gap-1">
                <span>NEW items to classify/review</span>
              </p>
            </div>
          </div>



          {/* ═══════════════════════════════════════════════ */}
          {/* 📡 LIVE FEEDBACK PULSE TICKER                  */}
          {/* ═══════════════════════════════════════════════ */}
          {recentFeed.length > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-sm">
              {/* Header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                {/* Live dot */}
                <span className="relative flex items-center justify-center w-3 h-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                  <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    tickerFlash ? "bg-white" : "bg-emerald-500"
                  }`} />
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Live Feedback Pulse
                </span>
                {/* Refresh flash text */}
                <span className={`text-[10px] font-bold transition-all duration-500 ${
                  tickerFlash ? "text-emerald-500" : "text-slate-400 dark:text-slate-600"
                }`}>
                  {tickerFlash ? "↻ Refreshed" : "· auto-refresh 10s"}
                </span>
                <span className="ml-auto flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-semibold">
                  {lastTickerRefresh && (
                    <span className="font-mono">
                      {lastTickerRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                    </span>
                  )}
                  <span>{recentFeed.length} entries</span>
                </span>
              </div>

              {/* Scrolling ticker */}
              <div className="overflow-hidden py-3 px-0">
                <div
                  className="flex gap-3 w-max"
                  style={{
                    animation: "pulse-ticker 30s linear infinite",
                  }}
                >
                  {[...recentFeed, ...recentFeed].map((item: any, idx: number) => {
                    const isNewest4 = (idx % recentFeed.length) < 4;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs whitespace-nowrap flex-shrink-0 transition-all ${
                          isDarkMode
                            ? "bg-slate-800/60 border-slate-700/50 text-slate-300"
                            : "bg-slate-50 border-slate-200/80 text-slate-700"
                        }`}
                      >
                        {/* Channel icon */}
                        <span className="text-base leading-none">
                          {CHANNEL_ICONS[item.channel] || CHANNEL_ICONS.default}
                        </span>

                        {/* Sentiment dot */}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.sentiment === "POS" ? "bg-emerald-500" :
                          item.sentiment === "NEG" ? "bg-rose-500" : "bg-slate-400"
                        }`} />

                        {/* Preview */}
                        <span className="font-medium max-w-[200px] truncate">
                          {item.content.substring(0, 55)}{item.content.length > 55 ? "…" : ""}
                        </span>

                        {/* Time */}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold ml-1">
                          {timeAgo(item.createdAt)}
                        </span>

                        {/* NEW badge on top 4 latest items */}
                        {isNewest4 && (
                          <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded tracking-widest shadow-sm">
                            NEW
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Volume Over Time */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 shadow-sm dark:shadow-none">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Feedback Volume Over Time
              </h3>
              <div className="h-80 w-full text-slate-700 dark:text-slate-300">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="stroke-slate-200 dark:stroke-slate-800" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                      labelStyle={{ color: "#475569", fontWeight: "bold" }}
                      itemStyle={{ color: "#0f172a" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Sentiment Pie */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm flex flex-col justify-between transition-all duration-300 shadow-sm dark:shadow-none">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6">Sentiment Breakdown</h3>
                <div className="h-56 w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                        itemStyle={{ color: "#0f172a" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {sentimentData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Top Themes Bar Chart */}
            <div className="lg:col-span-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 shadow-sm dark:shadow-none">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6">Volume by Auto-Tagged Themes</h3>
              <div className="h-80 w-full text-slate-700 dark:text-slate-300">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={themeData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="themeBlue" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="themePurple" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="themePink" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#be185d" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="themeAmber" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="themeGreen" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="themeGrey" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.65} />
                        <stop offset="100%" stopColor="#475569" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} horizontal={false} />
                    <XAxis 
                      type="number" 
                      stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke={isDarkMode ? "#94a3b8" : "#475569"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      width={100}
                    />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.015)" }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 shadow-md dark:shadow-none text-xs transition-colors duration-300">
                              <p className="font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider text-[10px]">{label}</p>
                              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>Feedbacks: {payload[0].value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[0, 8, 8, 0]} 
                      barSize={16}
                      background={{ fill: isDarkMode ? "rgba(30, 41, 59, 0.35)" : "rgba(241, 245, 249, 0.7)", radius: 8 }}
                    >
                      {themeData.map((entry, index) => {
                        const gradientId = 
                          entry.color === "#3b82f6" ? "url(#themeBlue)" :
                          entry.color === "#8b5cf6" ? "url(#themePurple)" :
                          entry.color === "#ec4899" ? "url(#themePink)" :
                          entry.color === "#f59e0b" ? "url(#themeAmber)" :
                          entry.color === "#10b981" ? "url(#themeGreen)" :
                          "url(#themeGrey)";
                        return <Cell key={`cell-${index}`} fill={gradientId} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Feature Area vs. Sentiment Matrix */}
          <FeatureSentimentMatrix />
        </div>
      )}
    </div>
  );
}
