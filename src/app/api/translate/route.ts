import { NextResponse } from "next/server";
import { enqueueTranslation } from "@/lib/translationQueue";

export async function POST(request: Request) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error("DEEPL_API_KEY is not set in the environment variables.");
    return NextResponse.json(
      { error: "Translation service is not configured properly." },
      { status: 500 }
    );
  }

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

    // Skip translation for English — just return as-is
    if (targetLang.toLowerCase() === "en") {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Enqueue to server-side mutex: only 1 DeepL request runs at a time.
    // Concurrent requests wait their turn instead of hammering the API.
    const translatedTexts = await enqueueTranslation(texts, targetLang, apiKey);
    return NextResponse.json({ translatedTexts });

  } catch (error) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { error: "Failed to translate content" },
      { status: 500 }
    );
  }
}

