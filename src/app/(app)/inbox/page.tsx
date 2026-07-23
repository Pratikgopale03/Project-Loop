"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Inbox as InboxIcon,
  PlusCircle,
  Database,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Clock,
  Zap,
  ShieldAlert,
  Trash2
} from "lucide-react";
import ActionSpecModal from "@/components/ActionSpecModal";
import RetentionEmailModal from "@/components/RetentionEmailModal";
import RealtimeAlertBanner from "@/components/RealtimeAlertBanner";
import { ActionSpecResult, RetentionEmailResult } from "@/lib/ai";

// Rich relative timestamp
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// Returns true if item was created within the last 30 minutes
function isJustIn(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 30 * 60 * 1000;
}

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: "POS" | "NEU" | "NEG";
  sentimentScore: number;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  createdAt: string;
}

export default function InboxPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "VIEWER";
  const isReadOnly = userRole === "VIEWER";

  // Feed State
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("ALL");
  const [sentiment, setSentiment] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // Form State
  const [newContent, setNewContent] = useState("");
  const [newChannel, setNewChannel] = useState("Email");
  const [newLabel, setNewLabel] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<{
    successCount: number;
    failCount: number;
    errors: string[];
  } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [ingestTab, setIngestTab] = useState<"manual" | "csv">("manual");
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  // Confirmation Modal States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearActionedConfirm, setClearActionedConfirm] = useState(false);

  // AI Action Spec Modal State
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [activeSpec, setActiveSpec] = useState<ActionSpecResult | null>(null);
  const [specLoading, setSpecLoading] = useState(false);

  // AI Retention Email Modal State
  const [retentionModalOpen, setRetentionModalOpen] = useState(false);
  const [activeRetention, setActiveRetention] = useState<RetentionEmailResult | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("Valued Customer");

  const handleGenerateSpec = async (item: FeedbackItem) => {
    setSpecModalOpen(true);
    setActiveSpec(null);
    setSpecLoading(true);
    try {
      const res = await fetch("/api/ai/action-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: item.content,
          channel: item.channel,
          customerLabel: item.customerLabel || "Pro User",
        }),
      });
      const data = await res.json();
      setActiveSpec(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSpecLoading(false);
    }
  };

  const handleGenerateRetention = async (item: FeedbackItem) => {
    setSelectedCustomerLabel(item.customerLabel || "Valued Customer");
    setRetentionModalOpen(true);
    setActiveRetention(null);
    setRetentionLoading(true);
    try {
      const res = await fetch("/api/ai/retention-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: item.content,
          customerLabel: item.customerLabel || "Valued Customer",
          channel: item.channel,
        }),
      });
      const data = await res.json();
      setActiveRetention(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRetentionLoading(false);
    }
  };

  // Fetch Feedback
  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "5",
        query: search,
        channel,
        sentiment,
        status,
      });
      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, channel, sentiment, status]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchFeedback();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle Manual Ingestion
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          channel: newChannel,
          customerLabel: newLabel || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest feedback");

      setFormSuccess("Feedback ingested successfully!");
      setNewContent("");
      setNewLabel("");
      setPage(1);
      fetchFeedback();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle CSV Upload
  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || isReadOnly) return;
    setCsvLoading(true);
    setFormError("");
    setFormSuccess("");
    setCsvResult(null);

    try {
      const text = await csvFile.text();
      const res = await fetch("/api/feedback/upload", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload CSV");

      setCsvResult({
        successCount: data.successCount,
        failCount: data.failCount,
        errors: data.errors,
      });
      setFormSuccess(`CSV import completed!`);
      setCsvFile(null);
      setPage(1);
      fetchFeedback();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCsvLoading(false);
    }
  };

  // Handle Manual AI Reclassification
  const handleReclassify = async (id: string) => {
    if (isReadOnly) return;
    setReclassifyingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}/reclassify`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reclassify");
      const updated = await res.json();
      setItems(items.map((item) => item.id === id ? updated : item));
    } catch (error) {
      console.error("Reclassification failed:", error);
    } finally {
      setReclassifyingId(null);
    }
  };

  // Handle Mock Seed
  const handleSeed = async () => {
    if (isReadOnly) return;
    setSeedLoading(true);
    try {
      const res = await fetch("/api/feedback/seed", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to trigger sync");
      
      // Auto-refresh the list to show the new items instantly
      await fetchFeedback();

      // Notify dashboard & live pulse immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("feedback_updated"));
      }

      setCsvResult({
        successCount: 5,
        failCount: 0,
        errors: [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSeedLoading(false);
    }
  };

  // Handle Delete Feedback Item
  const executeDeleteFeedback = async (id: string) => {
    setDeleteConfirmId(null);
    if (isReadOnly) return;
    try {
      const res = await fetch("/api/feedback/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent("feedback_updated"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Bulk Clear Actioned Entries
  const executeClearActioned = async () => {
    setClearActionedConfirm(false);
    if (isReadOnly) return;
    try {
      const res = await fetch("/api/feedback/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearActioned: true }),
      });
      if (res.ok) {
        fetchFeedback();
        window.dispatchEvent(new CustomEvent("feedback_updated"));
      }
    } catch (error) {
      console.error(error);
    }
  };
  // Handle Status Update
  const handleStatusChange = async (id: string, nextStatus: string) => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      // Update locally
      setItems(items.map((item) => item.id === id ? { ...item, status: nextStatus as any } : item));
      window.dispatchEvent(new CustomEvent("feedback_updated"));
    } catch (error) {
      console.error(error);
    }
  };

  // Helper Badge Renderers
  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "POS": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "NEG": return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACTIONED": return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
      case "REVIEWED": return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      default: return "bg-purple-500/10 text-purple-400 border border-purple-500/25";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-slate-100 dark:to-slate-300 dark:bg-clip-text dark:text-transparent">
          Feedback Inbox
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ingest customer feedback channels, analyze sentiment, and map actionable items.
        </p>
      </div>

      {/* Real-Time Database Alert Banner */}
      <RealtimeAlertBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ingestion Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-md transition-all duration-300 shadow-sm dark:shadow-none">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 pb-2 justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => { setIngestTab("manual"); setFormSuccess(""); setFormError(""); setCsvResult(null); }}
                  className={`text-xs font-semibold pb-2 border-b-2 transition ${
                    ingestTab === "manual" ? "border-indigo-500 text-indigo-550 dark:text-indigo-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => { setIngestTab("csv"); setFormSuccess(""); setFormError(""); setCsvResult(null); }}
                  className={`text-xs font-semibold pb-2 border-b-2 transition ${
                    ingestTab === "csv" ? "border-indigo-500 text-indigo-550 dark:text-indigo-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  CSV Bulk Upload
                </button>
              </div>
            </div>

            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* CSV Import Results */}
            {/* CSV Import Results */}
            {csvResult && (
              <div className="mb-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Upload Summary:</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Success: {csvResult.successCount} rows imported</p>
                <p className={`font-medium ${csvResult.failCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                  ✗ Failed: {csvResult.failCount} rows
                </p>
                {csvResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto space-y-1 text-[10px] text-rose-600 dark:text-rose-300 font-mono">
                    {csvResult.errors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ingestTab === "manual" ? (
              <form onSubmit={handleIngest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Feedback Content *
                  </label>
                  <textarea
                    required
                    disabled={isReadOnly || formLoading}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste what the customer said here..."
                    className="w-full h-32 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm resize-none disabled:opacity-50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Channel *
                    </label>
                    <select
                      disabled={isReadOnly || formLoading}
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <option>Email</option>
                      <option>Support Ticket</option>
                      <option>App Store Review</option>
                      <option>NPS Survey</option>
                      <option>Sales Call Notes</option>
                      <option>Twitter Mention</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Customer Tag
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly || formLoading}
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm disabled:opacity-50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isReadOnly || formLoading || !newContent}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition"
                >
                  {formLoading ? "Submitting..." : "Ingest Feedback"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCSVUpload} className="space-y-4">
                <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center bg-slate-950/40">
                  <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Click to select or drag CSV file</p>
                  <p className="text-[10px] text-slate-500 mt-1">Headers required: "content", "channel"</p>
                  
                  <input
                    type="file"
                    accept=".csv"
                    disabled={isReadOnly || csvLoading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setCsvFile(e.target.files[0]);
                      }
                    }}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600/10 file:text-indigo-400 file:cursor-pointer hover:file:bg-indigo-600/20"
                  />
                </div>

                {csvFile && (
                  <div className="flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-300">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span className="truncate flex-1">{csvFile.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setCsvFile(null)}
                      className="text-slate-500 hover:text-slate-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isReadOnly || csvLoading || !csvFile}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition"
                >
                  {csvLoading ? "Processing CSV..." : "Upload & Parse CSV"}
                </button>
              </form>
            )}
          </div>

          {/* Seed Panel */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-md transition-all duration-300 shadow-sm dark:shadow-none">
            <h2 className="text-sm font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              Integrations (Simulation)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Simulate channel feeds to generate multi-channel customer comments.
            </p>
            <button
              onClick={handleSeed}
              disabled={isReadOnly || seedLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition"
            >
              <Sparkles className="h-4 w-4" />
              {seedLoading ? "Simulating sync..." : "Trigger Simulated Sync"}
            </button>
            {isReadOnly && (
              <span className="block mt-2 text-[10px] text-center text-rose-600 dark:text-rose-400">
                You must be an ADMIN or ANALYST to run integration simulations.
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Feed Listing */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between transition-all duration-300 shadow-sm dark:shadow-none">
            <div className="flex flex-1 min-w-[200px] items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search feedback content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Channel Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Channel:</span>
                <select
                  value={channel}
                  onChange={(e) => { setChannel(e.target.value); setPage(1); }}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="ALL">All Channels</option>
                  <option>Email</option>
                  <option>Support Ticket</option>
                  <option>App Store Review</option>
                  <option>NPS Survey</option>
                  <option>Sales Call Notes</option>
                  <option>Twitter Mention</option>
                </select>
              </div>

              {/* Sentiment Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Sentiment:</span>
                <select
                  value={sentiment}
                  onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="ALL">All Sentiments</option>
                  <option value="POS">Positive</option>
                  <option value="NEU">Neutral</option>
                  <option value="NEG">Negative</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="ACTIONED">Actioned</option>
                </select>
              </div>

              {/* Bulk Clear Actioned Button */}
              {!isReadOnly && (
                <button
                  onClick={() => setClearActionedConfirm(true)}
                  className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-rose-500/25 transition ml-auto"
                  title="Delete all ACTIONED feedback entries from workspace"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Actioned
                </button>
              )}
            </div>
          </div>

          {/* Ingest Feed */}
          {loading ? (
            <div className="h-64 bg-slate-900/10 border border-slate-800/50 rounded-xl flex items-center justify-center">
              <span className="text-sm text-slate-500 animate-pulse">Loading feedback queue...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-sm dark:shadow-none transition-colors">
              <InboxIcon className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-400">No Feedback Found</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1">
                Try adjusting your search query, selecting different filters, or triggers a simulated channel seed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const justIn = isJustIn(item.createdAt);
                const isNewest = index === 0 && page === 1;
                return (
                <div 
                  key={item.id}
                  className={`relative rounded-xl p-5 transition-all duration-300 shadow-sm ${
                    justIn
                      ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-2 border-indigo-400/60 dark:border-indigo-500/40 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-indigo-100 dark:shadow-none"
                      : "bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-slate-700"
                  }`}
                >
                  {/* JUST IN glow badge for fresh items */}
                  {justIn && (
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1.5 bg-indigo-600 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full shadow-md shadow-indigo-600/30">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      <Zap className="h-2.5 w-2.5" />
                      JUST IN
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.channel}
                      </span>
                      {item.customerLabel && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          • {item.customerLabel}
                        </span>
                      )}
                    </div>
 
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getSentimentStyle(item.sentiment)}`}>
                        {item.sentiment} ({item.sentimentScore.toFixed(1)})
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
 
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-3 leading-relaxed break-words">
                    {item.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center">
                    {/* Rich timestamp */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      <Clock className="h-3 w-3" />
                      <span className={justIn ? "text-indigo-500 dark:text-indigo-400 font-bold" : ""}>
                        {timeAgo(item.createdAt)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600">
                        {new Date(item.createdAt).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true
                        })}
                      </span>
                    </div>

                    {/* Inline Status & AI Controls */}
                    {!isReadOnly ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ⚡ Action Spec Generator Button */}
                        <button
                          onClick={() => handleGenerateSpec(item)}
                          className="flex items-center gap-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-bold px-2 py-1.5 rounded-md border border-indigo-500/20 transition"
                        >
                          <Zap className="h-3 w-3 text-indigo-400" />
                          Action Spec
                        </button>

                        {/* 🛡️ Churn Risk Retention Email Draft Button */}
                        {(item.sentiment === "NEG" || (item.customerLabel && item.customerLabel.toLowerCase().includes("pro"))) && (
                          <button
                            onClick={() => handleGenerateRetention(item)}
                            className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1.5 rounded-md border border-rose-500/20 transition"
                          >
                            <ShieldAlert className="h-3 w-3 text-rose-400" />
                            Churn Email
                          </button>
                        )}

                        <button
                          onClick={() => handleReclassify(item.id)}
                          disabled={reclassifyingId === item.id}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1.5 rounded-md border border-slate-700 transition disabled:opacity-40"
                        >
                          {reclassifyingId === item.id ? "Re-tagging..." : "AI Re-classify"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Triage:</span>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-semibold py-1 px-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
                          >
                            <option value="NEW">New</option>
                            <option value="REVIEWED">Reviewed</option>
                            <option value="ACTIONED">Actioned</option>
                          </select>
                        </div>

                        {/* Individual Item Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"
                          title="Delete feedback entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        Read-only session
                      </span>
                    )}
                  </div>
                </div>
              );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500">
                    Showing {(page - 1) * 5 + 1} - {Math.min(page * 5, total)} of {total} items
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:border-slate-800 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-300 py-1.5 px-3 bg-slate-900/50 rounded-lg border border-slate-800">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:border-slate-800 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Action Spec Modal */}
      {specModalOpen && (
        <ActionSpecModal
          spec={activeSpec}
          loading={specLoading}
          onClose={() => setSpecModalOpen(false)}
        />
      )}

      {/* AI Retention Email Modal */}
      {retentionModalOpen && (
        <RetentionEmailModal
          draft={activeRetention}
          loading={retentionLoading}
          customerLabel={selectedCustomerLabel}
          onClose={() => setRetentionModalOpen(false)}
        />
      )}

      {/* Delete Feedback Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 -mt-12 sm:-mt-16">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Feedback Entry
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete this customer feedback entry? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteFeedback(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg shadow-rose-600/20"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Actioned Confirmation Modal */}
      {clearActionedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 -mt-12 sm:-mt-16">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Clear All Actioned Feedback
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to purge all <strong className="text-blue-500">ACTIONED</strong> feedback entries from this workspace?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearActionedConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClearActioned}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg shadow-rose-600/20"
              >
                Clear All Actioned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
