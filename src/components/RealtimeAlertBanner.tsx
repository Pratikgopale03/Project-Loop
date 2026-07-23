"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, ArrowRight, X, Bell } from "lucide-react";

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  count: number;
  sample?: string;
  customerLabel?: string;
  timestamp: string;
}

export default function RealtimeAlertBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`/api/alerts?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.activeAlerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loop_dismissed_alerts");
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {}

    fetchAlerts();

    const handleUpdate = () => fetchAlerts();
    window.addEventListener("feedback_updated", handleUpdate);
    const interval = setInterval(fetchAlerts, 15_000);

    return () => {
      window.removeEventListener("feedback_updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      localStorage.setItem("loop_dismissed_alerts", JSON.stringify(next));
    } catch (e) {}
  };

  const visibleAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));

  if (loading || visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-in fade-in duration-300">
      {visibleAlerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        return (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md transition-all ${
              isCritical
                ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-rose-900/10"
                : "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-amber-900/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isCritical ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                }`}
              >
                {isCritical ? (
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                ) : (
                  <ShieldAlert className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-100">{alert.title}</h4>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    REAL-TIME ALERT
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <Link
                href="/inbox"
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                  isCritical
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
                    : "bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                }`}
              >
                Triage in Inbox
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition"
                title="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
