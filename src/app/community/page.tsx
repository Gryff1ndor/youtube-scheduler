"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageCircle, Loader2, Send, ThumbsUp,
  Clock, Film, CheckCircle2, RefreshCw, Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Comment = {
  id: string;
  authorName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  publishedAt: string;
  videoTitle: string;
  videoId: string;
  likeCount: number;
  replied: boolean;
  replyText?: string;
};

type ReplyState = {
  draft: string;
  isGenerating: boolean;
  isPosting: boolean;
  posted: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-3/4 rounded bg-white/5" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-16">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <MessageCircle size={24} className="text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/30">No comments yet</p>
      <p className="text-xs text-white/20 max-w-[180px]">Comments from your channel will appear here</p>
    </div>
  );
}

// ── Action Panel (right side) placeholder ─────────────────────────────────────

function SelectPrompt() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-16 h-16 rounded-2xl bg-[hsl(220_90%_56%/0.1)] border border-[hsl(220_90%_56%/0.2)] flex items-center justify-center"
      >
        <Sparkles size={28} className="text-[hsl(220,90%,56%)]" />
      </motion.div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold text-white/60">Select a comment</p>
        <p className="text-xs text-white/30 max-w-[200px] leading-relaxed">
          Click any comment from the feed to draft an AI-powered reply
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ReplyState>>({});
  const [activeTab, setActiveTab] = useState<"inbox" | "replied">("inbox");

  // ── Derived state ───────────────────────────────────────────────────────────
  const displayedComments = comments.filter((c) =>
    activeTab === "inbox" ? !c.replied : c.replied
  );

  // ── Fetch comments ──────────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
        // Auto-select first comment of current tab only on tablet/desktop to avoid hiding the inbox on mobile
        if (window.innerWidth >= 768) {
          const firstInTab = data.comments.find((c: Comment) => activeTab === "inbox" ? !c.replied : c.replied);
          if (firstInTab && !selectedId) {
            setSelectedId(firstInTab.id);
          }
        }
      } else {
        toast.error("Failed to load comments", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Network error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchComments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate AI reply ───────────────────────────────────────────────────────
  const handleDraftReply = async (comment: Comment) => {
    setReplies((prev) => ({
      ...prev,
      [comment.id]: { draft: "", isGenerating: true, isPosting: false, posted: false },
    }));

    try {
      const res = await fetch("/api/community/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: comment.id,
          commentText: comment.textDisplay,
          videoTitle: comment.videoTitle,
          authorName: comment.authorName,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReplies((prev) => ({
        ...prev,
        [comment.id]: { draft: data.reply, isGenerating: false, isPosting: false, posted: false },
      }));
    } catch (err: any) {
      toast.error("Generation failed", { description: err.message });
      setReplies((prev) => {
        const next = { ...prev };
        delete next[comment.id];
        return next;
      });
    }
  };

  // ── Post reply to YouTube ───────────────────────────────────────────────────
  const handlePostReply = async (comment: Comment) => {
    const state = replies[comment.id];
    if (!state?.draft?.trim()) return;

    setReplies((prev) => ({
      ...prev,
      [comment.id]: { ...state, isPosting: true },
    }));

    try {
      const res = await fetch("/api/community/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: comment.id,
          commentText: comment.textDisplay,
          videoTitle: comment.videoTitle,
          authorName: comment.authorName,
          // In a real flow, pass the edited draft here
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReplies((prev) => ({
        ...prev,
        [comment.id]: { draft: state.draft, isGenerating: false, isPosting: false, posted: true },
      }));

      // Immediately move to Replied tab locally
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, replied: true } : c))
      );

      toast.success(data.posted ? "Reply posted to YouTube! ✓" : "Reply drafted (dev mode)");
    } catch (err: any) {
      toast.error("Failed to post reply", { description: err.message });
      setReplies((prev) => ({
        ...prev,
        [comment.id]: { ...state, isPosting: false },
      }));
    }
  };

  const selectedComment = comments.find((c) => c.id === selectedId) ?? null;
  const selectedReply = selectedId ? replies[selectedId] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 h-[calc(100vh-var(--topnav-height)-2rem)]"
    >
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Community</span>
            <span className="text-[11px] font-semibold text-[hsl(220,90%,56%)] bg-[hsl(220_90%_56%/0.1)] border border-[hsl(220_90%_56%/0.2)] px-2 py-0.5 rounded-full uppercase tracking-widest">
              Engine
            </span>
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {isLoading ? "Loading comments…" : `${comments.length} comments · Gemini-powered reply drafting`}
          </p>
        </div>

        <button
          onClick={fetchComments}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg",
            "border border-border bg-surface-elevated text-foreground-muted",
            "hover:text-foreground hover:bg-surface transition-all duration-200",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Main Two-Panel Layout ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── LEFT: Comment Feed ── */}
        <div className={cn(
          "w-full md:w-[320px] lg:w-[340px] xl:w-[380px] shrink-0 flex-col min-h-0 bg-surface border border-border rounded-2xl overflow-hidden",
          selectedId ? "hidden md:flex" : "flex"
        )}>
          {/* Feed header & Tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-elevated/30 shrink-0">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => {
                  setActiveTab("inbox");
                  setSelectedId(null);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                  activeTab === "inbox" 
                    ? "bg-[hsl(220_90%_56%/0.15)] text-[hsl(220,90%,56%)] shadow-sm" 
                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                Inbox
              </button>
              <button
                onClick={() => {
                  setActiveTab("replied");
                  setSelectedId(null);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                  activeTab === "replied" 
                    ? "bg-[hsl(220_90%_56%/0.15)] text-[hsl(220,90%,56%)] shadow-sm" 
                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                Replied
              </button>
            </div>
            
            {!isLoading && (
              <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                {displayedComments.length}
              </span>
            )}
          </div>

          {/* Scrollable feed */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex flex-col divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => <CommentSkeleton key={i} />)}
              </div>
            ) : displayedComments.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col">
                {displayedComments.map((comment, idx) => {
                  const isSelected = comment.id === selectedId;
                  const hasReply = !!replies[comment.id];

                  return (
                    <motion.button
                      key={comment.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.3 }}
                      onClick={() => setSelectedId(comment.id)}
                      className={cn(
                        "w-full text-left px-4 py-3.5 border-b border-border/60 last:border-b-0",
                        "flex items-start gap-3 transition-all duration-200 relative",
                        isSelected
                          ? "bg-[hsl(220_90%_56%/0.08)] border-l-2 border-l-[hsl(220,90%,56%)]"
                          : "hover:bg-surface-elevated/40"
                      )}
                    >
                      {/* Active indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="comment-active-bar"
                          className="absolute left-0 top-0 bottom-0 w-0.5 bg-[hsl(220,90%,56%)] rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}

                      {/* Avatar */}
                      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                        <AvatarImage src={comment.authorProfileImageUrl} alt={comment.authorName} />
                        <AvatarFallback className="text-[10px] bg-surface-elevated">
                          {initials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={cn(
                            "text-xs font-semibold truncate",
                            isSelected ? "text-neutral-900 dark:text-white" : "text-foreground"
                          )}>
                            {comment.authorName}
                          </span>
                          <span className="text-[10px] text-foreground-muted shrink-0">
                            {relativeTime(comment.publishedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                          {comment.textDisplay}
                        </p>
                        {/* Reply drafted badge */}
                        {hasReply && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[hsl(220,90%,56%)] bg-[hsl(220_90%_56%/0.1)] px-1.5 py-0.5 rounded-sm">
                            <Sparkles size={9} />
                            {replies[comment.id]?.posted ? "Replied" : "Draft ready"}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── RIGHT: Action Center ── */}
        <div className={cn(
          "flex-1 min-w-0 flex-col min-h-0 bg-surface border border-border rounded-2xl overflow-hidden",
          !selectedId ? "hidden md:flex" : "flex"
        )}>

          {/* Panel header */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-elevated/30 shrink-0">
            <button 
              className="md:hidden p-1 -ml-2 mr-1 text-foreground-muted hover:text-foreground bg-white/5 rounded-md border border-white/10"
              onClick={() => setSelectedId(null)}
              aria-label="Back to Inbox"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <Sparkles size={15} className="text-[hsl(220,90%,56%)]" />
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Action Center
            </span>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!selectedComment ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <SelectPrompt />
                </motion.div>
              ) : (
                <motion.div
                  key={selectedComment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-5 p-5 h-full"
                >
                  {/* ── Comment Card ── */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm p-5 space-y-4">
                    {/* Author row */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-[hsl(220_90%_56%/0.3)]">
                        <AvatarImage src={selectedComment.authorProfileImageUrl} alt={selectedComment.authorName} />
                        <AvatarFallback className="text-xs bg-surface-elevated font-semibold">
                          {initials(selectedComment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedComment.authorName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                            <Film size={9} />
                            {selectedComment.videoTitle}
                          </span>
                          <span className="text-foreground-muted/30 text-[10px]">·</span>
                          <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                            <Clock size={9} />
                            {relativeTime(selectedComment.publishedAt)}
                          </span>
                          {selectedComment.likeCount > 0 && (
                            <>
                              <span className="text-foreground-muted/30 text-[10px]">·</span>
                              <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                                <ThumbsUp size={9} />
                                {selectedComment.likeCount}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-sm text-foreground/90 leading-[1.75] font-light">
                      {selectedComment.textDisplay}
                    </p>
                  </div>

                  {/* ── Reply Zone ── */}
                  <div className="flex-1 flex flex-col gap-4">
                    {selectedComment.replied ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="rounded-2xl border border-[hsl(220_90%_56%/0.25)] bg-[hsl(220_90%_56%/0.04)] p-4 flex gap-3 relative overflow-hidden">
                          {/* Thread connection line */}
                          <div className="absolute left-6 -top-4 w-0.5 h-6 bg-[hsl(220_90%_56%/0.25)] rounded-full" />
                          <div className="w-8 h-8 rounded-full bg-[hsl(220_90%_56%/0.15)] flex items-center justify-center shrink-0 border border-[hsl(220_90%_56%/0.3)]">
                            <Sparkles size={14} className="text-[hsl(220,90%,56%)]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold text-[hsl(220,90%,56%)]">Your Reply</p>
                              <span className="text-[10px] text-foreground-muted flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                <CheckCircle2 size={10} className="text-[hsl(220,90%,56%)]" /> Sent
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed font-light mt-1.5">
                              {selectedComment.replyText || "Replied via YouTube."}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {/* No reply yet — show CTA */}
                        {!selectedReply && (
                          <motion.div
                            key="cta"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                          >
                            <button
                              id="draft-ai-reply-btn"
                              onClick={() => handleDraftReply(selectedComment)}
                              className={cn(
                                "group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl",
                                "text-sm font-semibold text-white",
                                "bg-[hsl(220,90%,56%)] hover:bg-[hsl(220,90%,62%)]",
                                "transition-all duration-300 ease-out",
                                "shadow-[0_0_20px_hsl(220_90%_56%/0.35)] hover:shadow-[0_0_35px_hsl(220_90%_56%/0.55)]"
                              )}
                            >
                              {/* Subtle shimmer */}
                              <span
                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
                                  backgroundSize: "200% 100%",
                                }}
                              />
                              <Sparkles size={16} className="shrink-0" />
                              <span>Draft AI Reply</span>
                            </button>
                          </motion.div>
                        )}

                        {/* Generating state */}
                        {selectedReply?.isGenerating && (
                          <motion.div
                            key="generating"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                            className="rounded-2xl border border-[hsl(220_90%_56%/0.25)] bg-[hsl(220_90%_56%/0.04)] p-5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-7 h-7 rounded-lg bg-[hsl(220_90%_56%/0.15)] border border-[hsl(220_90%_56%/0.3)] flex items-center justify-center">
                                <Sparkles size={13} className="text-[hsl(220,90%,56%)]" />
                              </div>
                              <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Gemini is composing…</span>
                            </div>

                            {/* Animated shimmer lines */}
                            <div className="space-y-2.5">
                              {[100, 85, 65].map((w, i) => (
                                <div
                                  key={i}
                                  className="h-3 rounded-full bg-white/[0.06] overflow-hidden"
                                  style={{ width: `${w}%` }}
                                >
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-transparent via-[hsl(220_90%_56%/0.4)] to-transparent"
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Draft ready — editable textarea + post button */}
                        {selectedReply && !selectedReply.isGenerating && selectedReply.draft && (
                          <motion.div
                            key="draft"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col gap-3"
                          >
                            {/* Reply composer card */}
                            <div className="rounded-2xl border border-[hsl(220_90%_56%/0.25)] bg-[hsl(220_90%_56%/0.04)] overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[hsl(220_90%_56%/0.15)]">
                                <div className="w-5 h-5 rounded-md bg-[hsl(220_90%_56%/0.15)] flex items-center justify-center">
                                  <Sparkles size={11} className="text-[hsl(220,90%,56%)]" />
                                </div>
                                <span className="text-xs font-semibold text-[hsl(220,90%,56%)]">Gemini Draft</span>
                                <span className="ml-auto text-[10px] text-foreground-muted flex items-center gap-1">
                                  <Edit3 size={9} />
                                  Editable
                                </span>
                              </div>
                              <textarea
                                id="reply-textarea"
                                className={cn(
                                  "w-full bg-transparent px-4 py-3.5 text-sm text-foreground/90",
                                  "leading-relaxed resize-none outline-none placeholder:text-foreground-muted/40",
                                  "min-h-[100px]"
                                )}
                                value={replies[selectedComment.id]?.draft ?? ""}
                                onChange={(e) =>
                                  setReplies((prev) => ({
                                    ...prev,
                                    [selectedComment.id]: {
                                      ...prev[selectedComment.id],
                                      draft: e.target.value,
                                    },
                                  }))
                                }
                                disabled={selectedReply.posted}
                              />
                            </div>

                            {/* Action row */}
                            {selectedReply.posted ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold"
                              >
                                <CheckCircle2 size={15} />
                                Reply sent!
                              </motion.div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleDraftReply(selectedComment)}
                                  className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg border border-border hover:bg-surface-elevated"
                                >
                                  <RefreshCw size={12} />
                                  Regenerate
                                </button>

                                <button
                                  id="post-reply-btn"
                                  onClick={() => handlePostReply(selectedComment)}
                                  disabled={selectedReply.isPosting || !replies[selectedComment.id]?.draft?.trim()}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                                    "text-sm font-semibold text-white",
                                    "bg-[hsl(220,90%,56%)] hover:bg-[hsl(220,90%,62%)]",
                                    "transition-all duration-200",
                                    "shadow-[0_0_16px_hsl(220_90%_56%/0.3)] hover:shadow-[0_0_24px_hsl(220_90%_56%/0.5)]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                  )}
                                >
                                  {selectedReply.isPosting ? (
                                    <><Loader2 size={14} className="animate-spin" /> Posting…</>
                                  ) : (
                                    <><Send size={14} /> Post Reply</>
                                  )}
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
