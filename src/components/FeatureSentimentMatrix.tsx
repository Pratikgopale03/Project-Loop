"use client";

import { useState, useEffect } from "react";
import { Grid } from "lucide-react";

interface MatrixItem {
  featureArea: string;
  total: number;
  posPct: number;
  neuPct: number;
  negPct: number;
  csat: number;
  grade: string;
}

export default function FeatureSentimentMatrix() {
  const [matrix, setMatrix] = useState<MatrixItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatrix = async () => {
    try {
      const res = await fetch("/api/insights/feature-matrix");
      if (!res.ok) throw new Error("Failed to fetch matrix");
      const data = await res.json();
      setMatrix(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A+":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "B":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "C":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center py-10">
        <span className="text-xs text-slate-500 animate-pulse">
          Computing Feature vs Sentiment Matrix & CSAT health grades...
        </span>
      </div>
    );
  }

  if (matrix.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Grid className="h-5 w-5 text-indigo-400" />
            Feature Area vs. Sentiment Matrix
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Heatmap breakdown of customer satisfaction across product modules
          </p>
        </div>

        <span className="text-xs text-slate-500 font-semibold self-start sm:self-auto">
          {matrix.length} Feature Areas Tracked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matrix.map((item) => (
          <div
            key={item.featureArea}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-sm">{item.featureArea}</h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black border ${getGradeBadge(
                  item.grade
                )}`}
              >
                Grade {item.grade}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-medium">CSAT Index</span>
              <span className="font-extrabold text-slate-100 text-base">{item.csat} / 5.0</span>
            </div>

            {/* Sentiment Stacked Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${item.posPct}%` }}
                  className="h-full bg-emerald-500"
                  title={`Positive: ${item.posPct}%`}
                />
                <div
                  style={{ width: `${item.neuPct}%` }}
                  className="h-full bg-slate-500"
                  title={`Neutral: ${item.neuPct}%`}
                />
                <div
                  style={{ width: `${item.negPct}%` }}
                  className="h-full bg-rose-500"
                  title={`Negative: ${item.negPct}%`}
                />
              </div>

              <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-0.5">
                <span className="text-emerald-400">POS {item.posPct}%</span>
                <span className="text-slate-400">NEU {item.neuPct}%</span>
                <span className="text-rose-400">NEG {item.negPct}%</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
              <span>Total Volume: <strong className="text-slate-300">{item.total}</strong> logs</span>
              <span className="text-indigo-400 font-bold">Auto-clustered</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
