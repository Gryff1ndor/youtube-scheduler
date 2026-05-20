import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Niche persona & channel identity ──────────────────────────────────────────
const PERSONA = `You are the lead strategist for a viral YouTube Shorts channel called "Dr. Skel" specialising in 'Bizarre Hypotheticals', 'Dark Science', and 'Time Traveler' scenarios (e.g. 'PS5 in Ancient Greece', 'What if you never sleep?').

Generate metadata with:
- 3 ultra-viral, curiosity-inducing titles (max 50 chars each, 1-2 emojis, pose a question or crazy fact that makes someone STOP scrolling)
- A snappy 2-sentence description: first sentence = scroll-stopping hook, second = exactly what they'll see. End with 5 high-volume hashtags on a new line.
- 15 hyper-relevant tags: mix core hypothetical concept, dark science, time travel, viral shorts, and broad high-volume keywords.

CRITICAL: Return ONLY a raw, valid JSON object. No markdown. No backticks. No extra text.`;

// ── Niche-specific failsafe ────────────────────────────────────────────────────
function buildFallback(summary: string) {
  const s = summary.trim();
  return {
    titles: [
      "What if you NEVER slept? 😳🩸",
      "I took a PS5 to Ancient Rome 🏛️🎮",
      "Surviving 100 days without sleep 💀",
    ],
    description:
      `What actually happens to your body when you push past every human limit — the science is darker than you think. ` +
      `We break down the real biology, historical parallels, and moments where reality gets truly bizarre.\n\n` +
      `#BizarreHypotheticals #DarkScience #TimeTraveler #Shorts #WhatIf`,
    tags: [
      s,
      `${s} shorts`,
      `what if ${s}`,
      "bizarre hypotheticals",
      "dark science",
      "time traveler scenario",
      "viral shorts",
      "youtube shorts",
      "what if scenario",
      "crazy hypothetical",
      "mind blowing facts",
      "dark history",
      "science gone wrong",
      "alternate history",
      "shorts viral 2026",
    ],
  };
}

// ── POST /api/generate-metadata ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { summary } = await req.json();

    if (!summary?.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing video topic summary." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // ── No API key → instant niche fallback ───────────────────────────────────
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 900));
      console.info("[generate-metadata] No API key — serving niche fallback.");
      return NextResponse.json({
        success: true,
        source: "fallback",
        metadata: buildFallback(summary),
      });
    }

    // ── Gemini call using getGenerativeModel architecture ─────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `${PERSONA}

VIDEO BRIEF: "${summary}"

Return ONLY raw JSON matching exactly this schema:
{
  "titles": ["Punchy Title 1 🤯 (max 50 chars)", "Title 2 💀", "Title 3 🔥"],
  "description": "Scroll-stopping hook sentence. Exactly what they will see in this Short.\\n\\n#Hashtag1 #Hashtag2 #Hashtag3 #Hashtag4 #Hashtag5",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"]
}

titles MUST have exactly 3 entries, each under 50 characters. tags MUST have exactly 15 entries. Begin the JSON object now:`;

    try {
      const result = await model.generateContent(prompt);
      let rawText = result.response.text();

      console.info(`[generate-metadata] Raw Gemini output (first 200 chars): ${rawText.slice(0, 200)}`);

      // Strip markdown fences — belt-and-braces defence even with responseMimeType set
      rawText = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      let metadata: { titles?: unknown; tags?: unknown; description?: unknown };
      try {
        metadata = JSON.parse(rawText);
      } catch (parseErr) {
        console.error("[generate-metadata] JSON.parse failed. Raw text:", rawText.slice(0, 400));
        throw new Error(
          `Gemini returned unparseable output: ${parseErr instanceof Error ? parseErr.message : parseErr}`
        );
      }

      // Shape integrity guards
      if (!Array.isArray(metadata.titles) || metadata.titles.length === 0) {
        metadata.titles = [summary];
      }
      if (!Array.isArray(metadata.tags)) {
        metadata.tags =
          typeof metadata.tags === "string"
            ? (metadata.tags as string).split(",").map((t: string) => t.trim())
            : [];
      }

      console.info(`[generate-metadata] ✓ Success for brief: "${summary}"`);
      return NextResponse.json({ success: true, source: "gemini", metadata });

    } catch (geminiErr: unknown) {
      const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      const is429 =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("rate limit");

      console.warn(
        is429
          ? `[generate-metadata] Quota exceeded (429) — serving niche fallback.`
          : `[generate-metadata] Gemini error — serving fallback. Reason: ${errMsg}`
      );

      return NextResponse.json({
        success: true,
        source: "fallback",
        fallbackReason: is429 ? "quota_exceeded" : "api_error",
        metadata: buildFallback(summary),
      });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate metadata.";
    console.error("[generate-metadata] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
