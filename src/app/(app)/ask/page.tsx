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
    "What are customers saying about performance and speed?",
    "Why are users complaining about account billing?",
    "Show me feedback requesting dark mode support.",
    "Summarize App Store crash issues.",
  ];

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "POS": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "NEG": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Ask LOOP
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Grounded answers built only from your feedback data — with sources.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setHistory([]);
            setQuestion("");
            setError("");
          }}
          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition"
        >
          <span className="text-base leading-none text-[#ff5538]">+</span> New Chat
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between space-y-6">
        {/* Empty State / Prompt Cards */}
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-8 text-center space-y-8">
            {/* Center Coral Icon Box */}
            <div className="space-y-4 max-w-md">
              <div className="w-16 h-16 bg-[#ff5538]/10 border border-[#ff5538]/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#ff5538]/10">
                <MessageSquare className="h-8 w-8 text-[#ff5538]" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Ask LOOP Anything
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Inquire about customer trends, feature requests, or friction points.<br />
                The AI searches raw feedback using embeddings before answering.
              </p>
            </div>

            {/* 2x2 Preset Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => setQuestion(q)}
                  className={`p-4 bg-slate-900/80 border rounded-2xl text-xs font-medium text-slate-300 hover:text-white transition shadow-sm hover:border-[#ff5538] text-left leading-relaxed ${
                    idx === 0
                      ? "border-[#ff5538]/80 bg-slate-900/90 shadow-md shadow-[#ff5538]/10"
                      : "border-slate-800/80 hover:bg-slate-900"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Answers History */
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
            {history.map((turn, index) => (
              <div key={index} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                {/* Question Header */}
                <div className="flex gap-3 items-start border-b border-slate-800/80 pb-4">
                  <div className="p-2 rounded-xl bg-[#ff5538]/10 text-[#ff5538] border border-[#ff5538]/20 mt-0.5">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Question Asked</span>
                    <p className="text-slate-100 text-sm font-bold mt-0.5">"{turn.question}"</p>
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
                      <BookOpen className="h-3.5 w-3.5 text-[#ff5538]" />
                      Grounded Citations ({turn.citations.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {turn.citations.map((cite, idx) => (
                        <div 
                          key={cite.id}
                          className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs space-y-2 relative hover:border-slate-700 transition"
                        >
                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-bold">
                              {cite.channel}
                            </span>
                            <span>[Feedback #{idx + 1}]</span>
                          </div>
                          
                          <p className="text-slate-400 text-[11px] leading-relaxed italic">
                            "{cite.content.length > 140 ? cite.content.slice(0, 140) + "..." : cite.content}"
                          </p>

                          <div className="flex justify-between items-center pt-1 text-[9px]">
                            {cite.customerLabel && (
                              <span className="text-[#ff5538] font-bold truncate max-w-[120px]">
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
        )}

        {/* Loading Bar */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#ff5538] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-300 font-semibold">
              Searching vector embeddings and querying Claude...
            </span>
          </div>
        )}

        {/* Bottom Input Search Bar */}
        <div className="pt-2">
          {error && (
            <div className="mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 bg-slate-900/90 border border-slate-800/90 p-2 rounded-2xl shadow-xl backdrop-blur-md">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ask a question about user feedback..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs font-medium disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-[#ff5538] hover:bg-[#e04529] disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-[#ff5538]/20 shrink-0"
            >
              {loading ? "Thinking..." : "Ask >>"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
