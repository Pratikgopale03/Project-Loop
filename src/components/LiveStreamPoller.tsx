"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";

export default function LiveStreamPoller() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; channel: string } | null>(null);

  useEffect(() => {
    // Automatically trigger live stream poller every 45 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/webhooks/stream", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.item) {
            setToast({
              message: `New live review ingested: "${data.item.content.slice(0, 45)}..."`,
              channel: data.item.channel
            });
            router.refresh();
            setTimeout(() => setToast(null), 5000);
          }
        }
      } catch (err) {
        console.warn("Live poller cycle skipped:", err);
      }
    }, 45000); // 45s interval

    return () => clearInterval(interval);
  }, [router]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/90 dark:bg-slate-900/95 text-slate-100 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm">
        <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
          <Zap className="h-4 w-4 text-amber-400 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Live Webhook Stream ({toast.channel})
          </div>
          <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
}
