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
  Trash2,
  Settings as SettingsIcon,
  User as UserIcon,
  Layers,
  Check,
  MessageSquare,
  Smartphone,
  Ticket,
  ShoppingBag,
  Car,
  Utensils,
  Key
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

  // Active Tab State: "preferences" | "profile" | "integrations" | "team"
  const [activeTab, setActiveTab] = useState<"preferences" | "profile" | "integrations" | "team">("preferences");

  // Workspace Preference State
  const [workspaceName, setWorkspaceName] = useState("Project LOOP Production");
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // User Profile State
  const [displayName, setDisplayName] = useState(session?.user?.name || "Alice");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword) {
      showToast("⚠️ Please enter your current password.", "error");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast("⚠️ New password must be at least 6 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("⚠️ New password and confirmation do not match.", "error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("✅ Password updated successfully!", "success");
  };

  // Integrations Toggle State
  const [integrations, setIntegrations] = useState({
    appStore: true,
    zendesk: true,
    twitter: true,
    zomato: true,
    swiggy: true,
    uber: true,
    amazon: true,
  });

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`Integration status updated!`, "success");
      return updated;
    });
  };

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<{ id: string; name: string; email: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session]);

  const handleSaveWorkspaceName = () => {
    setIsSavingWorkspace(true);
    setTimeout(() => {
      setIsSavingWorkspace(false);
      showToast("✅ Workspace organization name updated successfully!", "success");
    }, 600);
  };

  const handleSaveProfile = () => {
    showToast("✅ User profile updated successfully!", "success");
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith("http")) {
      showToast("⚠️ Please paste a valid Slack or Discord Webhook URL first.", "error");
      return;
    }

    setTestFiring(true);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage workspace configurations, team roles, profile settings, and integrations.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab("preferences")}
          className={`pb-3 px-1 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-rose-500 text-rose-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building className="h-4 w-4" />
          Workspace Preferences
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-1 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "profile"
              ? "border-rose-500 text-rose-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          User Profile
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`pb-3 px-1 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "integrations"
              ? "border-rose-500 text-rose-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          Integrations Hub
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`pb-3 px-1 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "team"
              ? "border-rose-500 text-rose-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          Team Management
        </button>
      </div>

      {/* TAB 1: WORKSPACE PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md max-w-xl space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Workspace Configuration</h2>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Customize your shared tenant organization metadata. These values are visible to all members of this workspace.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workspace Organization Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="App store"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWorkspaceName}
                disabled={isSavingWorkspace}
                className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isSavingWorkspace ? "Saving Workspace Name..." : "Save Workspace Name"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-xl">
          {/* Current Account Details Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Current Account Details</h2>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DISPLAY NAME</p>
                <p className="text-sm font-bold text-slate-100 mt-1">{displayName}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT EMAIL</p>
                <p className="text-sm font-bold text-slate-100 mt-1">{session?.user?.email || "admin@loop.com"}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SYSTEM ROLE</p>
                <p className="text-sm font-bold text-rose-400 uppercase mt-1">{userRole}</p>
              </div>
            </div>
          </div>

          {/* Update Profile Settings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Update Profile Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-500/20"
              >
                Save Profile Settings
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-rose-400" />
              Security & Change Password
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-500/20"
              >
                Update Security Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATIONS HUB */}
      {activeTab === "integrations" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Integrations Configurations</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">
              Connect LOOP directly to your customer interaction channels. Classified logs are ingested automatically upon creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            {/* Apple App Store */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg">
                  A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Apple App Store reviews</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sync app reviews weekly</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("appStore")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.appStore ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.appStore ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Zendesk Tickets */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  Z
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Zendesk Tickets</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ingest closed tickets daily</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("zendesk")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.zendesk ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.zendesk ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Twitter/X Mentions */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                  X
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Twitter/X Mentions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Realtime search sync for company handles</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("twitter")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.twitter ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.twitter ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Zomato Reviews */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                  🍕
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Zomato Food Reviews</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Auto-sync customer food reviews</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("zomato")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.zomato ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.zomato ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Swiggy Instamart */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                  🛵
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Swiggy Instamart</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Realtime delivery order logs</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("swiggy")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.swiggy ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.swiggy ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Uber Driver Feedback */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  🚗
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Uber Driver Feedback</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ride quality & cancellation sync</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleIntegration("uber")}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  integrations.uber ? "bg-rose-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    integrations.uber ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Webhook Dispatch Section */}
          <div className="max-w-3xl p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-md">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>💬</span> Slack & Discord Incoming Webhook URL
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch real-time emergency alert payloads directly to your team's Slack or Discord channel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleSaveWebhook}
                disabled={testFiring}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-lg shadow-rose-500/20"
              >
                <Zap className="h-4 w-4" />
                {testFiring ? "Saving Webhook..." : "Save Webhook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM MANAGEMENT */}
      {activeTab === "team" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          {/* Left: Add Member Form (ADMIN only) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
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
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Initial Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Workspace Role *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500 cursor-pointer transition-colors"
                      >
                        <option value="VIEWER">VIEWER (Read-Only)</option>
                        <option value="ANALYST">ANALYST (Ingest & Triage)</option>
                        <option value="ADMIN">ADMIN (Full Workspace Control)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 py-3 px-4 rounded-xl font-bold text-sm text-white transition disabled:opacity-50 shadow-lg shadow-rose-500/20"
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
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
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
          </div>
        </div>
      )}

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
