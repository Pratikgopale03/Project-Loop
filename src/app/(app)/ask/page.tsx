"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bot,
  User,
  RotateCcw
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
      case "POS": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "NEG": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  // 🎨 Clean Markdown Answer Formatter
  const renderFormattedAnswer = (rawAnswer: string) => {
    const lines = rawAnswer.split("\n").filter((line) => line.trim() !== "");
    return (
      <div className="space-y-3 font-sans text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
        {lines.map((line, idx) => {
          let cleanLine = line.trim();

          // Bullet item
          const isBullet = cleanLine.startsWith("•") || cleanLine.startsWith("-");
          if (isBullet) {
            cleanLine = cleanLine.replace(/^[•-]\s*/, "");
          }

          // Replace **[Feedback #X]** with a clean badge highlight
          const parts = cleanLine.split(/(\*\*\[Feedback #[0-9]+\]\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith("**[Feedback #") && part.endsWith("]**")) {
              const label = part.replace(/\*\*/g, "");
              return (
                <span
                  key={pIdx}
                  className="inline-flex items-center px-2 py-0.5 mx-1 text-[11px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
                >
                  {label}
                </span>
              );
            } else if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            } else if (part.startsWith("*") && part.endsWith("*")) {
              return (
                <em key={pIdx} className="italic text-slate-700 dark:text-slate-300">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                <div className="flex-1">{renderedLine}</div>
              </div>
            );
          }

          return <p key={idx}>{renderedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Ask LOOP
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium">
            Grounded AI intelligence powered directly by customer feedback data.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearChatHistory}
            className="py-2 px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            New Chat
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between space-y-6">
        {/* Empty State / Preset Cards */}
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-10 text-center space-y-8">
            {/* Center Glowing AI Icon Box */}
            <div className="space-y-4 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 text-white">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Ask LOOP Anything
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Query customer sentiment, bug reports, or feature requests.<br />
                The AI searches live vector embeddings before generating grounded answers.
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
                  className={`p-4 rounded-2xl text-xs font-medium transition shadow-sm text-left leading-relaxed ${
                    idx === 0
                      ? "border-2 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-slate-900 dark:text-white shadow-md shadow-indigo-500/10 font-bold"
                      : "border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
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
              <div key={index} className="space-y-4 animate-in fade-in duration-200">
                {/* User Prompt Bubble (Right Aligned) */}
                <div className="flex justify-end items-center gap-2">
                  <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 text-white font-semibold text-xs py-3 px-5 rounded-2xl rounded-tr-xs shadow-md shadow-indigo-500/15 max-w-lg leading-relaxed">
                    {turn.question}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-300 dark:border-slate-700">
                    <User className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* AI Answer Card (Left Aligned) */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-md max-w-3xl">
                  {/* AI Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Bot className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        LOOP AI Intelligence
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      Grounded Answer
                    </span>
                  </div>

                  {/* Formatted Answer Narrative */}
                  {renderFormattedAnswer(turn.answer)}

                  {/* Collapsible Citations Toggle Arrow */}
                  {turn.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => toggleCitation(index)}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-bold transition group"
                      >
                        <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 group-hover:bg-indigo-100">
                          {expandedCitations[index] ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Citations ({turn.citations.length} sources parsed)</span>
                      </button>

                      {/* Expanded Citation Cards matching Image 2 */}
                      {expandedCitations[index] && (
                        <div className="space-y-3 mt-3 animate-in fade-in duration-200">
                          {turn.citations.map((cite) => (
                            <div 
                              key={cite.id}
                              className="bg-slate-50 dark:bg-[#0f121d] border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs space-y-2 relative shadow-sm"
                            >
                              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic">
                                "{cite.content}"
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
                                <span>Source ID: <code className="font-mono text-slate-600 dark:text-slate-300">{cite.id.slice(0, 8)}</code></span>
                                <Link
                                  href="/inbox"
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                                >
                                  Inspect Log &rarr;
                                </Link>
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
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Searching vector embeddings and querying Claude...
            </span>
          </div>
        )}

        {/* Bottom Floating Glass Input Bar */}
        <div className="pt-2">
          {error && (
            <div className="mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-md focus-within:border-indigo-500 transition-colors">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ask a question about user feedback..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-xs md:text-sm font-medium disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 border border-indigo-400/20 shrink-0"
            >
              <span>Ask</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
