"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";

interface Citation {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: string;
  createdAt: string;
}

interface ChatTurn {
  question: string;
  answer: string;
  citations: Citation[];
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process Q&A query");

      const newTurn: ChatTurn = {
        question,
        answer: data.answer,
        citations: data.citations,
      };

      setHistory([newTurn, ...history]);
      setQuestion("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What are users saying about dashboard performance?",
    "Is there any feedback about billing issues?",
    "What features are customers requesting the most?",
  ];

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "POS": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "NEG": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Ask LOOP
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask natural-language questions about customer feedback and get grounded answers cited directly from the database.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="e.g., What are users saying about the loading times?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-semibold py-3 px-5 rounded-lg text-sm flex items-center gap-2 transition"
          >
            {loading ? "Thinking..." : (
              <>
                <Send className="h-4 w-4" />
                Ask
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="pt-2">
          <p className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
            <HelpCircle className="h-3.5 w-3.5" />
            Suggested Questions:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => setQuestion(q)}
                className="text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-slate-200 px-3 py-1.5 rounded-full transition text-left shadow-sm dark:shadow-none transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answers History */}
      <div className="space-y-6">
        {loading && (
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400 font-medium">
              Searching vector embeddings and querying Claude...
            </span>
          </div>
        )}

        {history.map((turn, index) => (
          <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4 backdrop-blur-sm">
            {/* Question Header */}
            <div className="flex gap-3 items-start border-b border-slate-800/80 pb-3">
              <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 mt-0.5">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Question Asked</span>
                <p className="text-slate-200 text-sm font-semibold mt-0.5">"{turn.question}"</p>
              </div>
            </div>

            {/* Answer Narrative */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Grounded Answer</span>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {turn.answer}
              </p>
            </div>

            {/* Citations / Evidence */}
            {turn.citations.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Grounded Citations ({turn.citations.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {turn.citations.map((cite, idx) => (
                    <div 
                      key={cite.id}
                      className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg text-xs space-y-2 relative hover:border-slate-800 transition"
                    >
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {cite.channel}
                        </span>
                        <span>[Feedback #{idx + 1}]</span>
                      </div>
                      
                      <p className="text-slate-400 text-[11px] leading-relaxed italic">
                        "{cite.content.length > 140 ? cite.content.slice(0, 140) + "..." : cite.content}"
                      </p>

                      <div className="flex justify-between items-center pt-1 text-[9px]">
                        {cite.customerLabel && (
                          <span className="text-indigo-400 font-semibold truncate max-w-[100px]">
                            @ {cite.customerLabel}
                          </span>
                        )}
                        <span className={`font-bold tracking-wider px-1.5 rounded uppercase ${getSentimentStyle(cite.sentiment)}`}>
                          {cite.sentiment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
