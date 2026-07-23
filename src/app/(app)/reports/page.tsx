"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  FileText, 
  Plus, 
  Calendar, 
  Download, 
  Clock, 
  TrendingUp, 
  Smile, 
  Frown, 
  User,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  contentJson: string; // { stats: { totalCount, positivePct, negativePct, topThemes: [] }, quotes: [], narrative: "" }
  createdAt: string;
  generatedBy: {
    name: string;
  };
}

function parseInlineMarkdown(text: string) {
  // Parse **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-slate-100 dark:text-slate-100 print:text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
      return (
        <em key={i} className="italic text-slate-200 dark:text-slate-200 print:text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function RenderNarrative({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1.5 my-3 text-slate-300 print:text-slate-800">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={index} className="text-base font-bold text-slate-200 print:text-slate-900 mt-4 mb-1">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={index} className="text-lg font-bold text-slate-100 print:text-slate-900 mt-6 mb-2 pb-1 border-b border-slate-800 print:border-slate-300">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={index} className="text-xl font-black text-slate-100 print:text-slate-900 mt-6 mb-3">
          {parseInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      currentList.push(
        <li key={index} className="leading-relaxed text-sm">
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={index} className="text-slate-300 print:text-slate-800 text-sm leading-relaxed my-2">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Creator Form State
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          periodStart: startDate,
          periodEnd: endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");

      setTitle("");
      setStartDate("");
      setEndDate("");
      setIsCreating(false);
      
      // Add to list and set as active
      setReports([data, ...reports]);
      setSelectedReport(data);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to parse contentJson safely
  const parseContent = (contentJson: string) => {
    try {
      return JSON.parse(contentJson);
    } catch (error) {
      return {
        stats: { totalCount: 0, positivePct: 0, negativePct: 0, topThemes: [] },
        quotes: [],
        narrative: "Error loading report details.",
      };
    }
  };

  const activeContent = selectedReport ? parseContent(selectedReport.contentJson) : null;

  return (
    <div className="space-y-6 print:p-0 print:m-0 print:bg-white print:text-slate-900 print:w-full">
      {/* Top Header - hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Voice-of-Customer Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pre-compute statistics and compile Claude-narrated digests for your leadership.
          </p>
        </div>

        <button
          onClick={() => { setIsCreating(!isCreating); setFormError(""); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Generator Drawer/Modal Overlay - hidden in print */}
      {isCreating && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 max-w-xl relative overflow-hidden backdrop-blur-md print:hidden">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Compile Voice of Customer Narrative
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Select a title and custom date range. LOOP will scan customer logs, calculate metrics, and compile the executive brief.
          </p>

          {formError && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateReport} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Report Title *</label>
              <input
                type="text"
                required
                disabled={formLoading}
                placeholder="e.g. Q3 Feedback Executive Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  disabled={formLoading}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  disabled={formLoading}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-850 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold transition"
              >
                {formLoading ? "Analyzing & Generating..." : "Generate AI Brief"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split Layout */}
      {loading ? (
        <div className="h-96 bg-slate-900/10 border border-slate-850 rounded-xl flex items-center justify-center print:hidden">
          <span className="text-sm text-slate-500 animate-pulse">Loading workspace digests...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="h-96 bg-slate-900/20 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 print:hidden">
          <FileText className="h-10 w-10 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-400">No Reports Generated</h3>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            Produce one-click Voice-of-Customer brief summaries to analyze feedback over time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block print:w-full">
          {/* Left: Reports History Drawer - hidden in print */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Report History
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? "bg-slate-900/60 border-indigo-500/50"
                        : "bg-slate-900/20 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <h4 className="font-semibold text-slate-200 text-sm truncate">{report.title}</h4>
                    <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Report Presentation */}
          {selectedReport && activeContent && (
            <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md space-y-8 print:border-none print:bg-transparent print:p-0 print:shadow-none print:w-full">
              {/* Report Header */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-800/80 print:border-slate-300">
                <div>
                  <h2 className="text-2xl font-black text-slate-200 print:text-slate-900 print:text-3xl">{selectedReport.title}</h2>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1.5 font-medium print:text-slate-600">
                    <Calendar className="h-3.5 w-3.5" />
                    Range: {new Date(selectedReport.periodStart).toLocaleDateString()} to {new Date(selectedReport.periodEnd).toLocaleDateString()}
                  </p>
                  <p className="text-slate-500 text-[10px] flex items-center gap-1.5 mt-1 print:text-slate-600">
                    <User className="h-3 w-3" />
                    Compiled by: {selectedReport.generatedBy.name}
                  </p>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-slate-200 text-slate-400 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 print:hidden"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF / Print
                </button>
              </div>

              {/* Statistics Visual Blocks */}
              <div className="grid grid-cols-3 gap-4 print:text-slate-900">
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center print:bg-slate-50 print:border-slate-300">
                  <span className="block text-2xl font-black text-indigo-400 print:text-indigo-600">{activeContent.stats.totalCount}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold print:text-slate-700">Feedback Scanned</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center print:bg-slate-50 print:border-slate-300">
                  <span className="block text-2xl font-black text-emerald-400 print:text-emerald-600">{activeContent.stats.positivePct}%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold print:text-slate-700">Positive Ratio</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center print:bg-slate-50 print:border-slate-300">
                  <span className="block text-2xl font-black text-rose-400 print:text-rose-600">{activeContent.stats.negativePct}%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold print:text-slate-700">Negative Ratio</span>
                </div>
              </div>

              {/* Generated Narrative */}
              <div className="text-slate-300 leading-relaxed print:text-slate-900">
                <RenderNarrative text={activeContent.narrative} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
