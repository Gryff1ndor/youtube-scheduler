"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Check,
  ChevronRight,
  LogOut,
  Mail,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

type Tab = "profile" | "notifications" | "appearance" | "security" | "billing";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Profile state
  const [localName, setLocalName] = useState("");
  const [localImage, setLocalImage] = useState("");

  // Notification preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  // File input ref for avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed profile state from session
  useEffect(() => {
    if (session?.user) {
      setLocalName(session.user.name || "");
      setLocalImage(session.user.image || "");
    }
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      toast.error("Image too large", { description: "Please choose a file smaller than 1 MB." });
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalImage(url);
    toast.success("Avatar updated — click Save Changes to confirm.");
  };

  const handleSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "profile",       label: "Profile",       icon: User,        desc: "Manage your personal details" },
    { id: "notifications", label: "Notifications", icon: Bell,        desc: "Configure how you receive alerts" },
    { id: "appearance",    label: "Appearance",    icon: Palette,     desc: "Customize the application theme" },
    { id: "security",      label: "Security",      icon: Shield,      desc: "Update your password and 2FA" },
    { id: "billing",       label: "Billing",       icon: CreditCard,  desc: "Manage your subscription and payments" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="flex flex-col gap-6 lg:gap-8 max-w-6xl mx-auto w-full"
    >
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left",
                activeTab === tab.id
                  ? "bg-surface-elevated text-foreground shadow-sm border border-border"
                  : "text-foreground-muted hover:bg-surface hover:text-foreground border border-transparent"
              )}
            >
              <tab.icon
                size={18}
                className={activeTab === tab.id ? "text-[hsl(220,90%,56%)]" : "opacity-60"}
              />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <ChevronRight size={14} className="ml-auto opacity-50" />
              )}
            </button>
          ))}

          <div className="my-4 h-px bg-border w-full" />

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut size={18} className="opacity-80" />
            Sign out
          </button>
        </aside>

        {/* ── Content Area ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* Panel header */}
            <div className="px-6 py-5 border-b border-border bg-surface-elevated/30">
              <h2 className="text-lg font-semibold text-foreground">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-foreground-muted mt-1">
                {tabs.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            {/* Panel body */}
            <div className="p-6 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl"
                >

                  {/* ────── PROFILE ────── */}
                  {activeTab === "profile" && (
                    <div className="space-y-8">
                      {/* Avatar row */}
                      <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-full border-2 border-border overflow-hidden bg-surface-elevated shrink-0">
                          {localImage ? (
                            <img
                              src={localImage}
                              alt="Profile"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xl font-semibold text-foreground-muted">
                              {(localName || session?.user?.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          {/* Hidden native file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-surface-elevated border border-border hover:bg-surface text-sm font-medium text-foreground rounded-lg transition-colors"
                          >
                            Change Avatar
                          </button>
                          <p className="text-xs text-foreground-subtle mt-2">
                            JPG, GIF or PNG. 1 MB max.
                          </p>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="space-y-5">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-foreground">Display Name</label>
                          <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[hsl(220,90%,56%)] focus:ring-1 focus:ring-[hsl(220,90%,56%)] transition-shadow"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-foreground">Email Address</label>
                          <input
                            type="email"
                            defaultValue={session?.user?.email || ""}
                            disabled
                            className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-foreground-subtle">
                            Your email is managed by your Google provider.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────── NOTIFICATIONS ────── */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Communication Channels
                      </h3>

                      {/* Email */}
                      <div className="flex items-center justify-between py-3 border-b border-border/50">
                        <div className="flex items-start gap-3">
                          <Mail size={18} className="text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Email Notifications</p>
                            <p className="text-xs text-foreground-muted mt-0.5">
                              Receive daily summaries and critical alerts.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-black/10 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[hsl(220,90%,56%)]" />
                        </label>
                      </div>

                      {/* Push */}
                      <div className="flex items-center justify-between py-3 border-b border-border/50">
                        <div className="flex items-start gap-3">
                          <Smartphone size={18} className="text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Push Notifications</p>
                            <p className="text-xs text-foreground-muted mt-0.5">
                              Real-time alerts sent to your active devices.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={pushEnabled}
                            onChange={(e) => setPushEnabled(e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-black/10 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[hsl(220,90%,56%)]" />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ────── APPEARANCE ────── */}
                  {activeTab === "appearance" && (
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <label className="text-sm font-medium text-foreground">Theme Preference</label>
                        <p className="text-xs text-foreground-muted">
                          Select a theme for the dashboard. Applied to all workspaces.
                        </p>
                        <div className="inline-block p-4 rounded-xl border border-border bg-surface-elevated/40 w-fit">
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────── SECURITY / BILLING (placeholder) ────── */}
                  {(activeTab === "security" || activeTab === "billing") && (
                    <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-surface-elevated/20">
                      <Shield size={32} className="text-foreground-muted/50 mb-4" />
                      <h3 className="text-sm font-medium text-foreground">Coming Soon</h3>
                      <p className="text-xs text-foreground-subtle max-w-xs mt-1.5">
                        This section is under development. Check back soon!
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-elevated/30 flex items-center justify-end shrink-0">
              <button
                onClick={handleSave}
                disabled={saveStatus !== "idle"}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300",
                  saveStatus === "saved"
                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "bg-[hsl(220,90%,56%)] hover:bg-[hsl(220,90%,62%)] shadow-[0_0_15px_hsl(220_90%_56%/0.3)]",
                  "disabled:opacity-80 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  {saveStatus === "idle" && "Save Changes"}
                  {saveStatus === "saving" && (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  )}
                  {saveStatus === "saved" && (
                    <>
                      <Check size={16} />
                      Saved
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}
