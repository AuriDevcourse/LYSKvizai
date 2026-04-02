// In-memory translation cache (persists via globalThis across HMR)
const g = globalThis as typeof globalThis & {
  __translation_cache?: Map<string, string>;
};
if (!g.__translation_cache) g.__translation_cache = new Map();
const cache = g.__translation_cache;

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text}`;
}

// Lithuanian proper nouns: maps every case form → base (nominative) form.
// When translating, case forms are replaced with placeholders and restored as the base form.
function buildNounMap(entries: [string, ...string[]][]): Map<string, string> {
  const m = new Map<string, string>();
  for (const [base, ...forms] of entries) {
    m.set(base, base);
    for (const f of forms) m.set(f, base);
  }
  return m;
}

const PROPER_NOUNS = buildNounMap([
  // Cities & towns
  ["Vilnius", "Vilniaus", "Vilnių", "Vilniuje"],
  ["Kaunas", "Kauno", "Kauną", "Kaune"],
  ["Klaipėda", "Klaipėdos", "Klaipėdą", "Klaipėdoje"],
  ["Šiauliai", "Šiaulių", "Šiauliuose"],
  ["Panevėžys", "Panevėžio", "Panevėžyje"],
  ["Trakai", "Trakų", "Trakuose", "Trakais"],
  ["Druskininkai", "Druskininkų", "Druskininkuose"],
  ["Palanga", "Palangos", "Palangoje"],
  ["Marijampolė", "Marijampolės"],
  ["Alytus", "Alytaus"],
  ["Utena", "Utenos"],
  ["Telšiai", "Telšių"],
  ["Tauragė", "Tauragės"],
  ["Varėna", "Varėnos", "Varėnoje"],
  ["Birštonas", "Birštono"],
  ["Nida", "Nidos"],
  ["Neringa", "Neringos"],
  ["Kernavė", "Kernavės"],
  ["Anykščiai", "Anykščių"],
  // Historical figures
  ["Mindaugas", "Mindaugo", "Mindaugą", "Mindaugui"],
  ["Gediminas", "Gedimino", "Gediminą", "Gediminui"],
  ["Vytautas", "Vytauto", "Vytautą"],
  ["Kęstutis", "Kęstučio"],
  ["Jogaila", "Jogailos"],
  ["Algirdas", "Algirdo"],
  ["Traidenis", "Traidenio"],
  ["Žygimantas", "Žygimanto"],
  ["Barbora", "Barboros"],
  ["Čiurlionis", "Čiurlionio"],
  ["Basanavičius", "Basanavičiaus"],
  ["Kudirka", "Kudirkos"],
  ["Maironis", "Maironio"],
  ["Smetona", "Smetonos"],
  ["Daukantas", "Daukanto"],
  // Rivers & lakes
  ["Nemunas", "Nemuno", "Nemune"],
  ["Neris", "Neries"],
  ["Nevėžis", "Nevėžio"],
  ["Šventoji", "Šventosios"],
  ["Dubysa", "Dubysos"],
  ["Merkys", "Merkio"],
  ["Drūkšiai", "Drūkšių"],
  ["Tauragnas", "Tauragno"],
  ["Galvė", "Galvės"],
  ["Plateliai", "Platelių"],
  // Regions & landmarks
  ["Žemaitija", "Žemaitijos"],
  ["Aukštaitija", "Aukštaitijos"],
  ["Dzūkija", "Dzūkijos"],
  ["Suvalkija", "Suvalkijos"],
  ["Kuršiai", "Kuršių"],
  ["Baltija", "Baltijos"],
  // Countries — map to English name
  ["Lithuania", "Lietuva", "Lietuvos", "Lietuvą", "Lietuvoje"],
  ["Poland", "Lenkija", "Lenkijos", "Lenkiją"],
  ["Russia", "Rusija", "Rusijos"],
  ["Germany", "Vokietija", "Vokietijos"],
]);

const PLACEHOLDER_PREFIX = "XPNX";

function protectProperNouns(text: string): { protected: string; replacements: Map<string, string> } {
  const replacements = new Map<string, string>();
  let counter = 0;

  // Match words (including Lithuanian chars) that start with uppercase
  const protected_ = text.replace(/[A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+/g, (match) => {
    const base = PROPER_NOUNS.get(match);
    if (base) {
      const placeholder = `${PLACEHOLDER_PREFIX}${counter}${PLACEHOLDER_PREFIX}`;
      replacements.set(placeholder, base); // always restore to base/nominative form
      counter++;
      return placeholder;
    }
    return match;
  });

  return { protected: protected_, replacements };
}

function restoreProperNouns(text: string, replacements: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of replacements) {
    result = result.replaceAll(placeholder, original);
    // Also handle case where translator added spaces around placeholder
    const spaced = placeholder.split("").join(" ");
    result = result.replaceAll(spaced, original);
  }
  return result;
}

/**
 * Translate text using dynamic import of google-translate-api-x.
 * Falls back to returning original text if the library fails.
 */
async function callTranslate(
  text: string,
  from: string,
  to: string
): Promise<string> {
  try {
    const { default: translate } = await import("google-translate-api-x");
    const res = await translate(text, { from, to });
    return res.text;
  } catch {
    return text;
  }
}

/**
 * Translate a single string. Returns original on error.
 */
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim()) return text;
  if (from === to) return text;

  const key = cacheKey(text, from, to);
  const cached = cache.get(key);
  if (cached) return cached;

  const { protected: protectedText, replacements } = protectProperNouns(text);
  const translated = await callTranslate(protectedText, from, to);
  const final = restoreProperNouns(translated, replacements);

  if (final !== text) {
    cache.set(key, final);
  }
  return final;
}

/**
 * Translate an array of strings in a single batch for efficiency.
 */
export async function translateBatch(
  texts: string[],
  from: string,
  to: string
): Promise<string[]> {
  if (from === to) return texts;

  // Check which ones need translation
  const results: string[] = new Array(texts.length);
  const toTranslate: { index: number; text: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (!texts[i] || !texts[i].trim()) {
      results[i] = texts[i] ?? "";
      continue;
    }
    const key = cacheKey(texts[i], from, to);
    const cached = cache.get(key);
    if (cached) {
      results[i] = cached;
    } else {
      toTranslate.push({ index: i, text: texts[i] });
    }
  }

  if (toTranslate.length === 0) return results;

  // Protect proper nouns in each text
  const protectedItems = toTranslate.map((t) => protectProperNouns(t.text));

  // Chunk into small batches to avoid Google Translate's character limit
  const CHUNK_SIZE = 5;
  for (let c = 0; c < toTranslate.length; c += CHUNK_SIZE) {
    const chunkIndices = toTranslate.slice(c, c + CHUNK_SIZE);
    const chunkProtected = protectedItems.slice(c, c + CHUNK_SIZE);

    const separator = "\n||||\n";
    const batchText = chunkProtected.map((p) => p.protected).join(separator);

    try {
      const translated = await callTranslate(batchText, from, to);
      const parts = translated.split(/\n?\|{4}\n?/);

      for (let i = 0; i < chunkIndices.length; i++) {
        const raw = (parts[i] ?? chunkIndices[i].text).trim();
        const final = restoreProperNouns(raw, chunkProtected[i].replacements);
        results[chunkIndices[i].index] = final;
        cache.set(cacheKey(chunkIndices[i].text, from, to), final);
      }
    } catch {
      for (const item of chunkIndices) {
        if (!results[item.index]) results[item.index] = item.text;
      }
    }
  }

  return results;
}
