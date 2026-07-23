"use client";

import { useState } from "react";
import { Sparkles, X, Check, Copy, Layers } from "lucide-react";
import { ActionSpecResult } from "@/lib/ai";

interface ActionSpecModalProps {
  spec: ActionSpecResult | null;
  loading: boolean;
  onClose: () => void;
}

export default function ActionSpecModal({ spec, loading, onClose }: ActionSpecModalProps) {
  const [copied, setCopied] = useState(false);

  if (!spec && !loading) return null;

  const handleCopyMarkdown = () => {
    if (!spec) return;
    const markdown = `# ${spec.title}
**Priority**: ${spec.priority}

## 1. Problem Statement
${spec.problemStatement}

## 2. User Impact & Churn Risk
${spec.userImpact}

## 3. Root Cause Analysis
${spec.rootCause}

## 4. Suggested Solution
${spec.suggestedSolution}

## 5. Acceptance Criteria
${spec.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}
`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "P0":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      case "P1":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 transition-colors -mt-12 sm:-mt-16">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              AI Engineering Action Spec
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Auto-structured specification for Jira, Linear, or GitHub Issues
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block p-4 rounded-full bg-indigo-500/10 text-indigo-500 animate-spin">
                <Layers className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                Claude AI is compiling engineering spec & acceptance criteria...
              </p>
            </div>
          ) : spec ? (
            <>
              {/* Title & Priority */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500">
                    Generated Ticket Title
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{spec.title}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black border shrink-0 ${getPriorityStyle(
                    spec.priority
                  )}`}
                >
                  {spec.priority} PRIORITY
                </span>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
                    1. Problem Statement
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{spec.problemStatement}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-rose-500 dark:text-rose-400">
                    2. Customer Impact & Churn Risk
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{spec.userImpact}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500 dark:text-amber-400">
                  3. Root Cause Analysis
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{spec.rootCause}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 dark:text-emerald-400">
                  4. Recommended Solution
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{spec.suggestedSolution}</p>
              </div>

              {/* Acceptance Criteria */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 dark:text-indigo-400">
                  5. Acceptance Criteria Checklist
                </span>
                <ul className="space-y-2">
                  {spec.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="mt-0.5 h-4 w-4 rounded border border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500 dark:text-indigo-400">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {spec && !loading && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Ready for Jira, Linear, or GitHub Issues
            </span>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  Copied Ticket Markdown!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Markdown Ticket
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
