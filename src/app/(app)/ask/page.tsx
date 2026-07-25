"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight
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
  const [expandedCitations, setExpandedCitations] = useState<Record<number, boolean>>({});

  // 💾 Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("loop_chat_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, []);

  // 💾 Save chat history to localStorage whenever updated
  const saveHistory = (newHistory: ChatTurn[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("loop_chat_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  };

  const clearChatHistory = () => {
    setHistory([]);
    setQuestion("");
    setError("");
    setExpandedCitations({});
    try {
      localStorage.removeItem("loop_chat_history");
    } catch (e) {}
  };

  const toggleCitation = (index: number) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

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
        citations: data.citations || [],
      };

      const updatedHistory = [newTurn, ...history];
      saveHistory(updatedHistory);
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Ask LOOP
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Grounded answers built only from your feedback data — with sources.
          </p>
        </div>

        <button
          type="button"
          onClick={clearChatHistory}
          className="py-2 px-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition"
        >
          <span className="text-base leading-none text-indigo-600 dark:text-indigo-400">+</span> New Chat
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between space-y-6">
        {/* Empty State / Prompt Cards */}
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-8 text-center space-y-8">
            {/* Center Violet Icon Box */}
            <div className="space-y-4 max-w-md">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Ask LOOP Anything
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
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
                  className={`p-4 rounded-2xl text-xs font-medium transition shadow-sm hover:border-indigo-500 text-left leading-relaxed ${
                    idx === 0
                      ? "border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-white shadow-md shadow-indigo-500/10 font-bold"
                      : "border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
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
              <div key={index} className="space-y-4">
                {/* User Prompt Bubble (Right Aligned) */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs py-3 px-5 rounded-2xl rounded-tr-none shadow-md max-w-lg leading-relaxed">
                    {turn.question}
                  </div>
                </div>

                {/* AI Answer Bubble (Left Aligned) */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none backdrop-blur-sm max-w-3xl">
                  {/* Answer Narrative */}
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {turn.answer}
                  </p>

                  {/* Collapsible Citations Toggle Arrow */}
                  {turn.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => toggleCitation(index)}
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-bold transition"
                      >
                        {expandedCitations[index] ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        <span>Citations ({turn.citations.length} sources parsed)</span>
                      </button>

                      {/* Expanded Citation Cards */}
                      {expandedCitations[index] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 animate-in fade-in duration-200">
                          {turn.citations.map((cite, idx) => (
                            <div 
                              key={cite.id}
                              className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3 rounded-xl text-xs space-y-2 relative hover:border-indigo-400 dark:hover:border-slate-700 transition"
                            >
                              <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/20 font-bold">
                                  {cite.channel}
                                </span>
                                <span>[Feedback #{idx + 1}]</span>
                              </div>
                              
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed italic">
                                "{cite.content.length > 140 ? cite.content.slice(0, 140) + "..." : cite.content}"
                              </p>

                              <div className="flex justify-between items-center pt-1 text-[9px]">
                                {cite.customerLabel && (
                                  <span className="text-indigo-600 dark:text-violet-400 font-bold truncate max-w-[120px]">
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
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Bar */}
        {loading && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
            <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Searching vector embeddings and querying Claude...
            </span>
          </div>
        )}

        {/* Bottom Input Search Bar */}
        <div className="pt-2">
          {error && (
            <div className="mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 p-2 rounded-2xl shadow-lg dark:shadow-xl backdrop-blur-md">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ask a question about user feedback..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-xs font-medium disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-500/20 border border-indigo-400/20 shrink-0"
            >
              {loading ? "Thinking..." : "Ask >>"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
