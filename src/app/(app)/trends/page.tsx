"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp,
  Flame,
  ChevronRight,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Inbox,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface ThemeTrend {
  id: string;
  name: string;
  description: string | null;
  color: string;
  currentVolume: number;
  previousVolume: number;
  growthRate: number;
  isSpiking: boolean;
  sparkline: { date: string; count: number }[];
}

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: "POS" | "NEU" | "NEG";
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

export default function TrendsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [themes, setThemes] = useState<ThemeTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filter
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  // Drilldown state
  const [selectedTheme, setSelectedTheme] = useState<ThemeTrend | null>(null);
  const [drilldownItems, setDrilldownItems] = useState<FeedbackItem[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // Sentiment filter for drilldown
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "POS" | "NEU" | "NEG">("ALL");

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/themes/trends?dateRange=${dateRange}`);
      if (!res.ok) throw new Error("Failed to fetch theme trends");
      const data = await res.json();
      setThemes(data);
      if (data.length > 0) {
        setSelectedTheme(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrilldown = async (themeId: string) => {
    setDrilldownLoading(true);
    try {
      const sentimentParam = sentimentFilter !== "ALL" ? `&sentiment=${sentimentFilter}` : "";
      const res = await fetch(`/api/feedback?limit=20&themeId=${themeId}${sentimentParam}`);
      if (!res.ok) throw new Error("Failed to fetch drilldown feedback");
      const data = await res.json();
      setDrilldownItems(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Export drilldown items as CSV
  const handleExportCSV = () => {
    if (!selectedTheme || drilldownItems.length === 0) return;
    const rows = [
      ["ID", "Content", "Channel", "Sentiment", "Customer", "Date"],
      ...drilldownItems.map((item) => [
        item.id,
        `"${item.content.replace(/"/g, '""')}"`,
        item.channel,
        item.sentiment,
        item.customerLabel || "",
        new Date(item.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTheme.name.replace(/\s+/g, "_")}_feedback.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setMounted(true);
    fetchTrends();
  }, [dateRange]);

  useEffect(() => {
    if (selectedTheme) {
      fetchDrilldown(selectedTheme.id);
    }
  }, [selectedTheme, sentimentFilter]);

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "POS": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "NEG": return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
    }
  };

  const sentimentLabel = { POS: "Positive", NEU: "Neutral", NEG: "Negative" };

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-slate-500 animate-pulse text-sm">Initializing Trends...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-slate-100 dark:to-slate-300 dark:bg-clip-text dark:text-transparent">
            Theme Trends & Spikes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitor growing themes, identify anomalous spikes, and drill into verbatim feedback.
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors duration-300 self-start">
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "7d" | "30d" | "90d")}
            className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-center">
          <span className="text-sm text-slate-500 animate-pulse">Analyzing feedback clusters...</span>
        </div>
      ) : themes.length === 0 ? (
        <div className="h-96 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6">
          <TrendingUp className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">No AI Themes Detected</h3>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            Themes are automatically clustered as feedback is ingested. Go to the Feedback Inbox and add some comments to see this view populate!
          </p>
          <Link
            href="/inbox"
            className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <Inbox className="h-3.5 w-3.5" />
            Go to Inbox
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Theme List & Sparklines ── */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Workspace Clusters · {themes.length} themes
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-600 font-semibold">
                Sorted by volume ↓
              </span>
            </div>

            <div className="space-y-2.5">
              {themes.map((theme) => {
                const isSelected = selectedTheme?.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => { setSelectedTheme(theme); setSentimentFilter("ALL"); }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 group ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-slate-900/60 border-indigo-400/60 dark:border-indigo-500/60 shadow-md shadow-indigo-600/5"
                        : "bg-white dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: theme.color }}
                        />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{theme.name}</h3>
                        {theme.isSpiking && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase animate-pulse">
                            <Flame className="h-3 w-3 fill-rose-500" />
                            Spiking
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 text-xs line-clamp-1">
                        {theme.description || "Auto-clustered customer feedback group"}
                      </p>
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="text-xs text-slate-500">
                          <strong className="text-slate-700 dark:text-slate-300 font-bold">{theme.currentVolume}</strong> items
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                          theme.growthRate > 0 ? "text-emerald-500" : theme.growthRate < 0 ? "text-rose-500" : "text-slate-500"
                        }`}>
                          {theme.growthRate > 0 ? (
                            <><ArrowUpRight className="h-3.5 w-3.5" />+{theme.growthRate.toFixed(0)}%</>
                          ) : theme.growthRate < 0 ? (
                            <><TrendingDown className="h-3.5 w-3.5" />{theme.growthRate.toFixed(0)}%</>
                          ) : "0%"}
                        </span>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div className="h-10 w-20 shrink-0 pointer-events-none hidden sm:block">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={theme.sparkline}>
                          <defs>
                            <linearGradient id={`grad-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.color} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={theme.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke={theme.color}
                            fill={`url(#grad-${theme.id})`}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 transition-all ${
                      isSelected ? "text-indigo-500 translate-x-1" : "text-slate-400 dark:text-slate-600"
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Drilldown Panel ── */}
          <div className="lg:col-span-7 space-y-4">
            {selectedTheme && (
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl backdrop-blur-md shadow-sm dark:shadow-none">
                {/* Drilldown Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: selectedTheme.color }} />
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{selectedTheme.name}</h2>
                        {selectedTheme.isSpiking && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase animate-pulse">
                            <Flame className="h-3 w-3 fill-rose-500" /> Spiking
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {selectedTheme.currentVolume} feedback items in this theme cluster
                      </p>
                    </div>

                    {/* Export CSV */}
                    <button
                      onClick={handleExportCSV}
                      disabled={drilldownItems.length === 0}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  </div>

                  {/* Sentiment Filter Row */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Sentiment:</span>
                    {(["ALL", "POS", "NEU", "NEG"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSentimentFilter(s)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                          sentimentFilter === s
                            ? s === "POS" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : s === "NEG" ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                            : s === "NEU" ? "bg-slate-500 text-white border-slate-500 shadow-sm"
                            : "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                        }`}
                      >
                        {s === "ALL" ? "All" : sentimentLabel[s]}
                      </button>
                    ))}
                    {!drilldownLoading && (
                      <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-600 font-semibold">
                        {drilldownItems.length} results
                      </span>
                    )}
                  </div>
                </div>

                {/* Drilldown Items */}
                <div className="p-4">
                  {drilldownLoading ? (
                    <div className="py-12 text-center">
                      <span className="text-sm text-slate-500 animate-pulse">Loading feedback records...</span>
                    </div>
                  ) : drilldownItems.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-500 text-sm">
                      No{sentimentFilter !== "ALL" ? ` ${sentimentLabel[sentimentFilter].toLowerCase()}` : ""} feedback found for this theme.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {drilldownItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-lg hover:border-indigo-300 dark:hover:border-slate-700 transition-all duration-200 space-y-2.5 group"
                        >
                          {/* Top row: channel + sentiment + link */}
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-semibold">
                                {item.channel}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getSentimentStyle(item.sentiment)}`}>
                                {item.sentiment}
                              </span>
                            </div>
                            <Link
                              href={`/inbox`}
                              className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-all"
                            >
                              View in Inbox
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>

                          {/* Feedback content */}
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed break-words">
                            "{item.content}"
                          </p>

                          {/* Bottom row: customer + rich timestamp */}
                          <div className="flex justify-between items-center pt-0.5">
                            {item.customerLabel ? (
                              <span className="text-[11px] text-indigo-500 font-semibold truncate max-w-[180px]">
                                @ {item.customerLabel}
                              </span>
                            ) : (
                              <span />
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600 font-medium">
                              <Clock className="h-3 w-3" />
                              <span>{timeAgo(item.createdAt)}</span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="font-mono">
                                {new Date(item.createdAt).toLocaleString("en-US", {
                                  month: "short", day: "numeric",
                                  hour: "numeric", minute: "2-digit", hour12: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
