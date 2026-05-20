"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload as UploadIcon, Sparkles, Calendar, CheckCircle2,
  FileVideo, X, Loader2, Clock, Tag, AlignLeft,
  ChevronRight, Zap, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage =
  | "idle"
  | "generating"
  | "uploading"
  | "success"
  | "error";

type Metadata = {
  titles: string[];
  description: string;
  tags: string[];
};

// ── Stage status messages ──────────────────────────────────────────────────────

const STAGE_MESSAGES: Record<Stage, string> = {
  idle:       "",
  generating: "Gemini is engineering your metadata…",
  uploading:  "Streaming video chunks to YouTube servers…",
  success:    "Pipeline complete. Video staged successfully.",
  error:      "Something went wrong. Please try again.",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground-muted mb-2">
      {children}
    </p>
  );
}

function Field({
  label, icon: Icon, children,
}: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-foreground-subtle" />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

const inputCls = cn(
  "w-full rounded-lg border border-border bg-surface-elevated/60 px-3.5 py-2.5 text-sm text-foreground",
  "placeholder:text-foreground-subtle outline-none transition-all duration-200",
  "focus:border-[hsl(220_90%_56%)] focus:ring-1 focus:ring-[hsl(220_90%_56%)]/30",
);

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UploadPage() {
  // File state
  const [dragActive, setDragActive]   = useState(false);
  const [videoFile, setVideoFile]     = useState<File | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // Input fields
  const [brief, setBrief]             = useState("");
  const [publishAt, setPublishAt]     = useState("");

  // AI Preview
  const [metadata, setMetadata]       = useState<Metadata | null>(null);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDesc, setEditableDesc]   = useState("");
  const [editableTags, setEditableTags]   = useState<string[]>([]);

  // Pipeline state
  const [stage, setStage]             = useState<Stage>("idle");
  const [uploadResult, setUploadResult] = useState<{ videoId: string; message: string } | null>(null);

  const isBusy = stage === "generating" || stage === "uploading";

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Invalid format", { description: "Please upload a video file (MP4, MOV, etc)." });
      return;
    }
    if (file.size > 10 * 1024 ** 3) {
      toast.error("File too large", { description: "Max file size is 10 GB." });
      return;
    }
    setVideoFile(file);
    setStage("idle");
    setMetadata(null);
    setUploadResult(null);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }, [acceptFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  // ── Unified pipeline ───────────────────────────────────────────────────────

  const handlePipeline = async () => {
    // ── Pre-flight validation — check everything before touching loading state ──
    if (!videoFile) {
      toast.error("No video attached", {
        description: "Please drag & drop or browse for a video file first.",
      });
      return;
    }

    if (!publishAt) {
      toast.error("No schedule date selected", {
        description: "Please pick a publish date and time before scheduling.",
      });
      return;
    }

    if (!brief.trim()) {
      toast.error("Missing brief", { description: "Enter a video topic/concept brief first." });
      return;
    }

    // ── Step 1: Gemini metadata generation ──
    setStage("generating");
    let generatedMeta: Metadata;
    try {
      const res  = await fetch("/api/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: brief }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      generatedMeta = data.metadata;
      setMetadata(generatedMeta);
      setSelectedTitle(0);
      setEditableTitle(generatedMeta.titles[0] || "");
      setEditableDesc(generatedMeta.description || "");
      setEditableTags(generatedMeta.tags || []);
    } catch (err: any) {
      toast.error("AI generation failed", { description: err.message });
      setStage("error");
      return;
    }

    // ── Step 2: YouTube upload ──
    // (videoFile is guaranteed non-null here — validated above)
    setStage("uploading");
    try {
      // Use editableTitle only if the user has actually typed something
      // (state updates are async — generatedMeta is always fresh here)
      const finalTitle = editableTitle.trim() || generatedMeta.titles[0] || "Untitled AI Schedule";
      const finalDesc  = editableDesc.trim()  || generatedMeta.description || "";
      const finalTags  = editableTags.length   ? editableTags : generatedMeta.tags;

      console.info("[upload] Sending title:", finalTitle);

      const form = new FormData();
      form.append("video",       videoFile);
      form.append("title",       finalTitle);
      form.append("description", finalDesc);
      form.append("tags",        finalTags.join(", "));
      if (publishAt) form.append("publishAt", publishAt);

      const res  = await fetch("/api/youtube/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUploadResult({ videoId: data.videoId, message: data.message });
      setStage("success");
      toast.success("Upload complete!", { description: data.message });
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
      setStage("error");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-6 lg:gap-8"
    >
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            AI Scheduler
          </h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Drop a video · brief Gemini · schedule to YouTube in one pipeline.
          </p>
        </div>
        {/* Pipeline status pill */}
        <AnimatePresence mode="wait">
          {isBusy && (
            <motion.div
              key="busy"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted shadow-sm"
            >
              <Loader2 size={11} className="animate-spin text-[hsl(220_90%_56%)]" />
              {STAGE_MESSAGES[stage]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6 items-start">

        {/* ════════════════════════════════════════════════════════════════
            LEFT COLUMN — Input Canvas
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* ── 1. Video drop zone ──────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <SectionLabel>1 · Video File</SectionLabel>

            <AnimatePresence mode="wait">
              {!videoFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer",
                    "transition-all duration-300 select-none",
                    dragActive
                      ? "border-[hsl(220_90%_56%)] bg-[hsl(220_90%_56%)]/5 scale-[1.01]"
                      : "border-border hover:border-[hsl(220_90%_56%)]/60 hover:bg-surface-elevated/60"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <motion.div
                    animate={{ y: dragActive ? -4 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220_90%_56%)]/10 text-[hsl(220_90%_56%)] mb-4"
                  >
                    <UploadIcon size={22} />
                  </motion.div>
                  <p className="text-sm font-medium text-foreground">
                    {dragActive ? "Release to stage" : "Drag & drop your video"}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    or click to browse · MP4, MOV, AVI · up to 10 GB
                  </p>
                  {/* Dev simulate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dummy = new File([""], "demo_video.mp4", { type: "video/mp4" });
                      Object.defineProperty(dummy, "size", { value: 104857600 });
                      acceptFile(dummy);
                    }}
                    className="absolute bottom-3 right-3 text-[10px] font-mono text-foreground-subtle/40 hover:text-[hsl(220_90%_56%)] transition-colors border border-border/20 px-1.5 py-0.5 rounded bg-surface/50"
                  >
                    [Dev Simulate]
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="staged"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(220_90%_56%)]/10 text-[hsl(220_90%_56%)]">
                    <FileVideo size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{videoFile.name}</p>
                    <p className="text-xs text-foreground-muted">{formatSize(videoFile.size)}</p>
                  </div>
                  <button
                    onClick={() => { setVideoFile(null); setMetadata(null); setStage("idle"); setUploadResult(null); }}
                    className="rounded-md p-1.5 text-foreground-subtle hover:text-foreground hover:bg-surface transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── 2. Brief + Schedule ─────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
            <SectionLabel>2 · Brief & Schedule</SectionLabel>

            <Field label="Video Topic / Core Concept Brief" icon={AlignLeft}>
              <textarea
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="e.g. How I grew my YouTube channel to 100k subscribers using AI-generated content strategy…"
                className={cn(inputCls, "resize-none font-sans leading-relaxed")}
              />
            </Field>

            <Field label="Schedule Publish Date & Time" icon={Calendar}>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className={cn(inputCls, "dark:[color-scheme:dark]")}
              />
              {publishAt && (
                <p className="text-[10px] text-foreground-muted flex items-center gap-1">
                  <Clock size={9} />
                  Video will go live at: <span className="text-foreground font-medium ml-0.5">{new Date(publishAt).toLocaleString()}</span>
                </p>
              )}
            </Field>
          </div>

          {/* ── CTA button ──────────────────────────────────────────────── */}
          <motion.button
            onClick={handlePipeline}
            disabled={isBusy || !brief.trim() || !videoFile || !publishAt}
            whileHover={!isBusy && !!videoFile && !!publishAt ? { scale: 1.02, y: -1 } : {}}
            whileTap={!isBusy && !!videoFile && !!publishAt ? { scale: 0.98 } : {}}
            className={cn(
              "relative w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold text-sm text-white overflow-hidden",
              "transition-all duration-300 shadow-lg",
              isBusy || !brief.trim() || !videoFile || !publishAt
                ? "bg-foreground/20 cursor-not-allowed shadow-none"
                : "bg-[hsl(220_90%_56%)] shadow-[hsl(220_90%_56%)]/30 shadow-lg hover:shadow-[hsl(220_90%_56%)]/50"
            )}
          >
            {/* Animated glow pulse */}
            {!isBusy && brief.trim() && videoFile && publishAt && (
              <motion.div
                className="absolute inset-0 bg-white/10 rounded-xl"
                animate={{ opacity: [0, 0.15, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            )}
            {isBusy ? (
              <><Loader2 size={16} className="animate-spin" />{STAGE_MESSAGES[stage]}</>
            ) : !videoFile ? (
              <><UploadIcon size={16} className="opacity-60" />Attach a video to continue<ChevronRight size={14} className="opacity-40" /></>
            ) : !publishAt ? (
              <><Calendar size={16} className="opacity-60" />Select a publish date to continue<ChevronRight size={14} className="opacity-40" /></>
            ) : (
              <><Sparkles size={16} />Generate SEO & Schedule Video<ChevronRight size={14} className="opacity-60" /></>
            )}
          </motion.button>

          {/* Error state */}
          <AnimatePresence>
            {stage === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400 text-center"
              >
                Pipeline failed — check the console for details.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT COLUMN — AI Preview Canvas
        ════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-surface shadow-sm min-h-[520px] flex flex-col overflow-hidden">

          {/* Canvas header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-[hsl(220_90%_56%)]" />
              <span className="text-xs font-semibold text-foreground">AI Preview Canvas</span>
            </div>
            <AnimatePresence mode="wait">
              {stage === "generating" && (
                <motion.span
                  key="gen"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-[hsl(220_90%_56%)] font-medium flex items-center gap-1"
                >
                  <Loader2 size={9} className="animate-spin" />
                  Generating…
                </motion.span>
              )}
              {stage === "success" && (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-emerald-400 font-medium flex items-center gap-1"
                >
                  <CheckCircle2 size={9} />
                  Complete
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">

            {/* Empty state */}
            {!metadata && stage !== "generating" && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-3 px-8 py-12 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border/60 text-foreground-subtle">
                  <Sparkles size={22} className="opacity-40" />
                </div>
                <p className="text-sm font-medium text-foreground-muted">Metadata will appear here</p>
                <p className="text-xs text-foreground-subtle max-w-xs">
                  Enter a video brief and click Generate. Gemini will engineer your titles, description, and tags.
                </p>
              </motion.div>
            )}

            {/* Generating skeleton shimmer */}
            {stage === "generating" && !metadata && (
              <motion.div
                key="shimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-4 p-5"
              >
                {[80, 60, 90, 100, 70, 100, 100].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full bg-surface-elevated animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </motion.div>
            )}

            {/* Metadata preview */}
            {metadata && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto"
              >
                {/* Titles — selectable */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>Optimized Titles (pick one)</SectionLabel>
                  {metadata.titles.map((t, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => { setSelectedTitle(i); setEditableTitle(t); }}
                      className={cn(
                        "text-left rounded-lg border px-3.5 py-2.5 text-xs font-medium leading-relaxed transition-all duration-200",
                        selectedTitle === i
                          ? "border-[hsl(220_90%_56%)] bg-[hsl(220_90%_56%)]/8 text-foreground"
                          : "border-border bg-surface-elevated/40 text-foreground-muted hover:border-border-strong hover:text-foreground"
                      )}
                    >
                      <span className="text-[hsl(220_90%_56%)] font-bold mr-1.5">{i + 1}.</span>{t}
                    </motion.button>
                  ))}
                  {/* Editable override */}
                  <input
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    placeholder="Edit or override selected title…"
                    className={cn(inputCls, "mt-1")}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>SEO Description</SectionLabel>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlignLeft size={10} className="text-foreground-subtle" />
                    <span className="text-[10px] text-foreground-subtle">Editable · {editableDesc.length} chars</span>
                  </div>
                  <textarea
                    rows={7}
                    value={editableDesc}
                    onChange={(e) => setEditableDesc(e.target.value)}
                    className={cn(inputCls, "resize-none font-mono text-[11px] leading-relaxed")}
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>15 Targeted Tags</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {editableTags.map((tag, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="inline-flex items-center gap-1 rounded-full bg-[hsl(220_90%_56%)]/10 border border-[hsl(220_90%_56%)]/20 text-[hsl(220_90%_56%)] px-2.5 py-1 text-[10px] font-medium"
                      >
                        <Tag size={8} />
                        {tag}
                        <button
                          onClick={() => setEditableTags(editableTags.filter((_, j) => j !== i))}
                          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Upload success state */}
                <AnimatePresence>
                  {stage === "success" && uploadResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <p className="text-sm font-semibold text-foreground">Upload Complete</p>
                      </div>
                      <p className="text-xs text-foreground-muted">{uploadResult.message}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://studio.youtube.com/video/${uploadResult.videoId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(220_90%_56%)] hover:underline"
                        >
                        <ExternalLink size={11} />
                          Open in YouTube Studio
                        </a>
                        <span className="text-foreground-subtle text-[10px] font-mono">· {uploadResult.videoId}</span>
                      </div>
                    </motion.div>
                  )}
                  {stage === "success" && !uploadResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex items-center gap-2"
                    >
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <p className="text-xs text-foreground-muted">
                        Metadata generated. Add a video file to also upload & schedule.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
