import { NextResponse } from "next/server";

// Static demonym → ISO cca2 map — avoids the deprecated restcountries.com v3.1 API.
const NATIONALITIES: Record<string, string> = {
  Afghan: "AF", Albanian: "AL", Algerian: "DZ", American: "US",
  Andorran: "AD", Angolan: "AO", Argentine: "AR", Armenian: "AM",
  Australian: "AU", Austrian: "AT", Azerbaijani: "AZ", Bahraini: "BH",
  Bangladeshi: "BD", Belarusian: "BY", Belgian: "BE", Bolivian: "BO",
  Bosnian: "BA", Brazilian: "BR", British: "GB", Bulgarian: "BG",
  Burkinabe: "BF", Cambodian: "KH", Cameroonian: "CM", Canadian: "CA",
  Chilean: "CL", Chinese: "CN", Colombian: "CO", Congolese: "CG",
  Croatian: "HR", Cuban: "CU", Czech: "CZ", Danish: "DK",
  Dominican: "DO", Dutch: "NL", Ecuadorian: "EC", Egyptian: "EG",
  Emirati: "AE", Estonian: "EE", Ethiopian: "ET", Filipino: "PH",
  Finnish: "FI", French: "FR", Gabonese: "GA", Gambian: "GM",
  Georgian: "GE", German: "DE", Ghanaian: "GH", Greek: "GR",
  Guatemalan: "GT", Guinean: "GN", Haitian: "HT", Honduran: "HN",
  Hungarian: "HU", Icelandic: "IS", Indian: "IN", Indonesian: "ID",
  Iranian: "IR", Iraqi: "IQ", Irish: "IE", Israeli: "IL",
  Italian: "IT", Ivorian: "CI", Jamaican: "JM", Japanese: "JP",
  Jordanian: "JO", Kazakh: "KZ", Kenyan: "KE", Kuwaiti: "KW",
  Kyrgyz: "KG", Laotian: "LA", Latvian: "LV", Lebanese: "LB",
  Liberian: "LR", Libyan: "LY", Lithuanian: "LT", Luxembourgish: "LU",
  Macedonian: "MK", Malagasy: "MG", Malawian: "MW", Malaysian: "MY",
  Maldivian: "MV", Malian: "ML", Maltese: "MT", Mauritanian: "MR",
  Mexican: "MX", Moldovan: "MD", Mongolian: "MN", Moroccan: "MA",
  Mozambican: "MZ", Namibian: "NA", Nepalese: "NP", Nicaraguan: "NI",
  Nigerian: "NG", Norwegian: "NO", Omani: "OM", Pakistani: "PK",
  Palestinian: "PS", Panamanian: "PA", Paraguayan: "PY", Peruvian: "PE",
  Polish: "PL", Portuguese: "PT", Qatari: "QA", Romanian: "RO",
  Russian: "RU", Rwandan: "RW", Saudi: "SA", Senegalese: "SN",
  Serbian: "RS", Singaporean: "SG", Slovak: "SK", Slovenian: "SI",
  Somali: "SO", Spanish: "ES", Swedish: "SE", Swiss: "CH",
  Syrian: "SY", Taiwanese: "TW", Tajik: "TJ", Tanzanian: "TZ",
  Thai: "TH", Togolese: "TG", Tunisian: "TN", Turkish: "TR",
  Turkmen: "TM", Ugandan: "UG", Ukrainian: "UA", Uruguayan: "UY",
  Uzbek: "UZ", Venezuelan: "VE", Vietnamese: "VN", Yemeni: "YE",
  Zambian: "ZM", Zimbabwean: "ZW",
  // Multi-word demonyms
  "New Zealander": "NZ", "South African": "ZA", "South Korean": "KR",
  "Sri Lankan": "LK", "Sierra Leonean": "SL", "Costa Rican": "CR",
  "Dominican Republic": "DO", "El Salvadoran": "SV",
};

export async function GET() {
  // Return sorted array of { demonym, code } objects
  const sorted = Object.entries(NATIONALITIES)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([demonym, code]) => ({ demonym, code }));

  return NextResponse.json(sorted);
}
