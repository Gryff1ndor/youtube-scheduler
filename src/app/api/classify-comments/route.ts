import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "mock-key",
});

export async function POST(req: Request) {
  try {
    const { comments } = await req.json();

    if (!comments || !Array.isArray(comments)) {
      return NextResponse.json({ success: false, error: "Missing comments array." }, { status: 400 });
    }

    // Mock fallback if API Key is not configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.toLowerCase().includes("your_")) {
      console.warn("Using offline mock for Gemini classification.");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockClassifications: Record<string, string> = {};
      comments.forEach((c: any) => {
        const txt = c.text.toLowerCase();
        if (txt.includes("http") || txt.includes("whatsapp") || txt.includes("girls")) {
          mockClassifications[c.id] = "Spam";
        } else if (txt.includes("issue") || txt.includes("how") || txt.includes("?")) {
          mockClassifications[c.id] = "Question";
        } else {
          mockClassifications[c.id] = "Praise";
        }
      });
      return NextResponse.json({ success: true, classifications: mockClassifications });
    }

    // Real Gemini Implementation
    const prompt = `
      You are an expert YouTube community moderator. Classify the following list of comments into exactly one of three categories:
      - "Question": If the user is asking for help, clarification, or has an inquiry.
      - "Spam": If the comment contains scam links, crypto bots, unrelated promotions, or explicit bot behavior.
      - "Praise": If the comment is positive, thankful, or generally supportive.

      Return ONLY a raw JSON object where the keys are the comment IDs and the values are the categories. Do not include markdown formatting like \`\`\`json.
      
      Comments:
      ${JSON.stringify(comments, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const classifications = JSON.parse(resultText);

    return NextResponse.json({
      success: true,
      classifications
    });

  } catch (err: any) {
    console.error("Gemini Classification Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
