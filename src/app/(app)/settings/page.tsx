"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  UserPlus, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Building,
  UserCheck,
  Zap,
  Trash2
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "VIEWER";
  const isReadOnly = userRole !== "ADMIN";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Live Webhook State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testFiring, setTestFiring] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<{ id: string; name: string; email: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith("http")) {
      showToast("⚠️ Please paste a valid Slack or Discord Webhook URL first.", "error");
      return;
    }

    setTestFiring(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/alerts/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        showToast(`⚠️ ${data.error || "Failed to dispatch webhook"}`, "error");
        return;
      }

      setTestResult(data);
      showToast("✅ Real Webhook Saved & Alert Fired to Channel!", "success");
    } catch (err: any) {
      showToast(`⚠️ ${err.message || "Failed to save webhook"}`, "error");
    } finally {
      setTestFiring(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const executeDeleteMember = async (memberId: string, memberName: string) => {
    setDeleteConfirmMember(null);
    if (isReadOnly || userRole !== "ADMIN") return;

    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || "Failed to remove member"}`, "error");
        return;
      }
      setMembers(members.filter((m) => m.id !== memberId));
      showToast(`✅ Member ${memberName} removed successfully!`, "success");
    } catch (err: any) {
      showToast(`⚠️ ${err.message || "Failed to remove member"}`, "error");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setFormSuccess(`User ${data.name} added successfully!`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("VIEWER");
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "ADMIN":
        return "bg-violet-500/10 text-violet-400 border border-violet-500/25";
      case "ANALYST":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Settings & Members
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage workspace settings, add team members, and verify role-based permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Add Member Form (ADMIN only) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              Invite Team Member
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Add a user directly to this tenant workspace.
            </p>

            {isReadOnly ? (
              <div className="mt-4 bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs p-4 rounded-lg flex gap-3 items-start">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold">ADMIN Role Required</p>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    You are signed in as an **{userRole}**. Only workspace administrators can manage or create member accounts.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {formSuccess && (
                  <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {formSuccess}
                  </div>
                )}

                {formError && (
                  <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Workspace Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm cursor-pointer transition-colors"
                    >
                      <option value="VIEWER">VIEWER (Read-Only)</option>
                      <option value="ANALYST">ANALYST (Ingest & Triage)</option>
                      <option value="ADMIN">ADMIN (Full Workspace Control)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition disabled:opacity-50"
                  >
                    {formLoading ? "Adding User..." : "Create Team Member"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

          {/* Right: Team Members List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200 mb-4">
              <Users className="h-5 w-5 text-indigo-400" />
              Active Workspace Members
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-900/50 border border-slate-850 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800 pr-1">
                {members.map((member) => {
                  const isSelf = member.id === session?.user?.id;
                  return (
                    <div key={member.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 shrink-0">
                          <UserCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{member.name}</p>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${getRoleBadge(member.role)}`}>
                          {member.role}
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">
                          Joined: {new Date(member.createdAt).toLocaleDateString()}
                        </span>

                        {userRole === "ADMIN" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmMember({ id: member.id, name: member.name, email: member.email })}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition"
                            title={`Remove ${member.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-Time Automated Alert Rules Panel */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  Real-Time Automated Alert Rules
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Live database evaluator triggers immediate alert banners & webhook dispatches
                </p>
              </div>

              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                3 Rules Live
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Rule 1 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-200">Critical Negative Spike Evaluator</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fires a red workspace banner when &gt;3 NEG sentiment feedback logs arrive within 1 hour.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase shrink-0">
                  ACTIVE
                </span>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-200">VIP Pro Account Threat Evaluator</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fires a high-priority retention alert when Pro/Enterprise customer submits negative feedback.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase shrink-0">
                  ACTIVE
                </span>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-200">Theme Volume Surge Evaluator</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fires alert when theme complaints increase by +50% vs prior period.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase shrink-0">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Slack & Discord Webhook Integration */}
            <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="text-base">💬</span> Slack & Discord Incoming Webhook URL
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect Project LOOP directly to your team's Slack or Discord channel.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start sm:self-auto">
                  HTTP POST JSON
                </span>
              </div>

              {/* Input & Save Webhook */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    disabled={testFiring}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shrink-0 shadow-lg shadow-indigo-600/20"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {testFiring ? "Saving Webhook..." : "Save Webhook"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Member Confirmation Modal */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 -mt-12 sm:-mt-16">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Remove Workspace Member
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{deleteConfirmMember.name}</strong> (<span className="text-indigo-500 dark:text-indigo-400">{deleteConfirmMember.email}</span>) from this tenant workspace?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteMember(deleteConfirmMember.id, deleteConfirmMember.name)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg shadow-rose-600/20"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Localhost Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border font-bold text-xs animate-in slide-in-from-top duration-300 ${
            toastType === "error"
              ? "bg-rose-600 text-white border-rose-400"
              : "bg-emerald-600 text-white border-emerald-400"
          }`}
        >
          {toastType === "error" ? (
            <AlertCircle className="h-5 w-5 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
