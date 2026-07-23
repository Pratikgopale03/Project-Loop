"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, X, Copy, Check, Flame } from "lucide-react";
import { RetentionEmailResult } from "@/lib/ai";

interface RetentionEmailModalProps {
  draft: RetentionEmailResult | null;
  loading: boolean;
  customerLabel?: string;
  onClose: () => void;
}

export default function RetentionEmailModal({
  draft,
  loading,
  customerLabel = "Valued Customer",
  onClose,
}: RetentionEmailModalProps) {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
    }
  }, [draft]);

  if (!draft && !loading) return null;

  const handleCopyEmail = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 transition-colors -mt-12 sm:-mt-16">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Customer Churn Risk Response Draft
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              AI-crafted executive retention email for @{customerLabel}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block p-4 rounded-full bg-rose-500/10 text-rose-500 animate-spin">
                <Flame className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                Analyzing customer frustration signals & drafting executive outreach...
              </p>
            </div>
          ) : draft ? (
            <>
              {/* Risk Indicator Header */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Churn Threat Assessment
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {draft.churnTriggers.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded font-bold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{draft.riskScore}%</span>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Editable Email Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Personalized Outreach Draft
                  </label>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-sans leading-relaxed focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {draft && !loading && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Copy and send directly to @{customerLabel}
            </span>

            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg shadow-rose-600/20"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  Copied Email to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Retention Email
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
