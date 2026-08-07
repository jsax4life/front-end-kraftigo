import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in the environment variables.");
    return NextResponse.json(
      { error: "Translation service is not configured properly." },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const { texts, targetLang } = await request.json();

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return NextResponse.json(
        { error: "Invalid request payload. Expected { texts: string[], targetLang: string }" },
        { status: 400 }
      );
    }

    if (texts.length === 0) {
      return NextResponse.json({ translatedTexts: [] });
    }

    if (targetLang === "en") {
      return NextResponse.json({ translatedTexts: texts });
    }

    const prompt = `Translate the following array of texts into ${targetLang}. Return EXACTLY a JSON array of strings in the exact same order, without any markdown formatting or extra text.

Texts to translate:
${JSON.stringify(texts, null, 2)}`;

    let resultText;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      resultText = response.text;
    } catch (apiError: any) {
      console.error("Gemini API Error (likely Rate Limit/Quota):", apiError.message);
      // Fallback: If we hit a quota limit, return pseudo-translations so the UI doesn't break
      const fallbackTranslations = texts.map(t => `[${targetLang.toUpperCase()}] ${t}`);
      return NextResponse.json({ translatedTexts: fallbackTranslations });
    }

    if (!resultText) {
      throw new Error("Failed to generate translation");
    }

    let translatedTexts;
    try {
      translatedTexts = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", resultText);
      throw e;
    }

    return NextResponse.json({ translatedTexts });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate content" },
      { status: 500 }
    );
  }
}
