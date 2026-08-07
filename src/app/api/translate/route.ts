import { NextResponse } from "next/server";

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

    if (targetLang.toLowerCase() === "en") {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Determine if it's a Free or Pro DeepL API key
    const isFreeAPI = apiKey.endsWith(":fx");
    const baseUrl = isFreeAPI 
      ? "https://api-free.deepl.com/v2/translate" 
      : "https://api.deepl.com/v2/translate";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang.toUpperCase(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepL API Error:", response.status, errorText);
      
      // Fallback: Return original strings instead of breaking UI
      return NextResponse.json({ translatedTexts: texts });
    }

    const data = await response.json();
    
    // DeepL returns: { translations: [{ detected_source_language: "EN", text: "..." }] }
    if (data && data.translations && Array.isArray(data.translations)) {
      const translatedTexts = data.translations.map((t: any) => t.text);
      return NextResponse.json({ translatedTexts });
    } else {
      throw new Error("Invalid response format from DeepL");
    }
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate content" },
      { status: 500 }
    );
  }
}
