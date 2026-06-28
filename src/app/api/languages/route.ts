import { NextResponse } from "next/server";

// Comprehensive static language list — avoids any external API dependency.
// restcountries.com v3.1 is deprecated; this is more reliable.
const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani",
  "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Catalan",
  "Chinese", "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian",
  "Finnish", "French", "Galician", "Georgian", "German", "Greek", "Gujarati",
  "Haitian Creole", "Hausa", "Hebrew", "Hindi", "Hungarian", "Icelandic",
  "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada",
  "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latvian",
  "Lithuanian", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese",
  "Maori", "Marathi", "Mongolian", "Nepali", "Norwegian", "Pashto", "Persian",
  "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Serbian",
  "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili",
  "Swedish", "Tagalog", "Tajik", "Tamil", "Telugu", "Thai", "Tigrinya",
  "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese",
  "Welsh", "Xhosa", "Yoruba", "Zulu",
].sort();

export async function GET() {
  return NextResponse.json(LANGUAGES);
}
