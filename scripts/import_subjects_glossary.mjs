import fs from "fs/promises";

const ATI_GLOSSARY_URL = "https://www.accesstoinsight.org/glossary.html";
const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ro&dt=t";

const CACHE_DIR = new URL("../.cache/", import.meta.url);
const OUTPUT_PATH = new URL("../_data/subjects_glossary.json", import.meta.url);

const stripHtml = (value) =>
  value
    .replace(/<a [^>]*>(.*?)<\/a>/g, "$1")
    .replace(/<span [^>]*>(.*?)<\/span>/g, "$1")
    .replace(/<cite>(.*?)<\/cite>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#257;/g, "ā")
    .replace(/&#299;/g, "ī")
    .replace(/&#363;/g, "ū")
    .replace(/&#7747;/g, "ṁ")
    .replace(/&#7751;/g, "ṇ")
    .replace(/&#775;m/g, "ṅ")
    .replace(/&#7789;/g, "ṭ")
    .replace(/&#7789;h/g, "ṭh")
    .replace(/&#241;/g, "ñ")
    .replace(/&#775;1/g, "ṇ")
    .replace(/&#257;/g, "ā")
    .replace(/&#7749;/g, "ṅ")
    .replace(/&#7779;/g, "ṣ")
    .replace(/&#39;/g, "'")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&ocirc;/g, "ô")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeLookupKey = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeEntryKey = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const cleanupImportedTerm = (value) => {
  const term = stripHtml(value).replace(/:$/, "").trim();

  return (
    {
      "brahman (from Pali brāhmaṇa)": "brahman",
      "deva; devatā": "deva / devatā",
      "Pā&#7735;i": "Pāḷi",
      "samaṇera (samaṇerī)": "samaṇera",
      "Vesak, Vesakha, Visakha, Wesak, etc. (visākha)": "Visākha",
    }[term] || term
  );
};

const paliExceptions = new Set([
  "bala",
  "arahant",
  "bhava",
  "bhikkhuni",
  "buddha",
  "dhamma",
  "dhana",
  "dukkha",
  "hiri",
  "iddhipada",
  "indriya",
  "jhana",
  "jati",
  "kamma",
  "karuna",
  "kayagatasati",
  "khanti",
  "kilesa",
  "kusala",
  "lokadhamma",
  "mana",
  "khandha",
  "metta",
  "muditā",
  "nama rupa",
  "nekkhamma",
  "nibbana",
  "nibbida",
  "nirvana",
  "ottappa",
  "parinibbana",
  "parisa",
  "pasada",
  "phassa",
  "piti",
  "sacca",
  "saddha",
  "sagga",
  "samadhi",
  "samatha",
  "sampajanna",
  "sangha",
  "sankhara",
  "sati",
  "sila",
  "samsara",
  "sutta",
  "tathagata",
  "tevijja",
  "theravada",
  "upanissaya",
  "vedana",
  "vimutti",
  "vinaya",
  "vipassana",
  "viraga",
  "viriya",
  "viveka",
]);

const excludedTerms = new Set([
  "jataka tales",
  "the bhikkhu patimokkha 227 rules for ordained monks bhikkhuni patimokkha 311 rules for ordained nuns see also vinaya",
]);

function isLikelyPali(term) {
  const normalized = normalizeLookupKey(term.replace(/\s*\([^)]*\)\s*$/, ""));

  if (paliExceptions.has(normalized)) {
    return true;
  }

  if (excludedTerms.has(normalized)) {
    return false;
  }

  if (/[ṭḍṇḷṃṅñāīū]/i.test(term)) {
    return true;
  }

  return false;
}

const normalizeLetter = (value) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .charAt(0)
    .toUpperCase();

  if ("XYZ".includes(normalized)) {
    return "XYZ";
  }

  if (normalized === "Q") {
    return "Q";
  }

  return /[A-Z]/.test(normalized) ? normalized : "#";
};

const localEntries = [
  { term: "appamādo", description_ro: "lucid" },
  { term: "āsava", description_ro: "scursuri" },
  { term: "araha", description_ro: "vrednic" },
  { term: "kamp", description_ro: "a tremura, a zdruncina" },
  { term: "sevanā", description_ro: "urma, întovărăși, a-și face de lucru(?)" },
  { term: "saññamo", description_ro: "înfrânare" },
  { term: "saṁvega", description_ro: "descurajare" },
  { term: "thera", description_ro: "venerabil" },
  { term: "vi", description_ro: "răzleț" },
  { term: "vi-", description_ro: "dis-", slug: "vi-prefix" },
].map((entry) => ({
  ...entry,
  description_en: "",
  description_ro_html: entry.description_ro,
  slug: entry.slug || slugify(entry.term),
  letter: normalizeLetter(entry.term),
  source: "local",
}));

const descriptionOverrides = new Map(
  [
    ["Anattā", "non-sine. Vezi și Tilakkhaṇa (trei caracteristici ale existenței)"],
    ["Ariya-aṭṭhaṅgika-magga", "calea de opt părți nobilă"],
    ["Hiri", "conștiință. Vezi și Ottappa (prudență morală)"],
    ["Mettā", "bunăvoință, bunătate pașnică. Vezi și Brahmavihāra; Pāramīs."],
    ["Pīti", "extaziere; exaltare. Vezi și Jhāna."],
    ["Saṅgha", "1. Obștea monahală; 2. Comunitatea Celor Treziți. Vezi și Monastic life; Tirataṇa (Tripla Giuvaierie)."],
    ["Taṇhā", "râvnă. Vezi și Kilesa (pângăriri); Paṭicca-samuppāda (origine dependentă); Sensuality."],
    ["Upekkhā", "echidistanță. Vezi și Brahmavihāra; Pāramīs;"],
    ["Vimutti", "izbăvire. Vezi și Awakening."],
    ["Vinaya", "Viața monahală."],
    ["Viññāṇa", "conștiință. Vezi și Khandha (agregatele atașamentului); Paṭicca-samuppāda (origine dependentă)."],
    ["Vipassanā", "introspecție. Vezi și Samatha (liniște); Tilakkhaṇa (trei caracteristici ale existenței)."],
  ].map(([term, description]) => [normalizeEntryKey(term), description])
);

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function fetchText(url, filename) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const text = await response.text();
  await fs.writeFile(new URL(filename, CACHE_DIR), text, "utf8");
  return text;
}

async function loadSourceFiles() {
  await ensureCacheDir();
  const atiGlossaryHtml = await fetchText(ATI_GLOSSARY_URL, "ati-glossary.html");

  return {
    html: atiGlossaryHtml,
  };
}

function extractEntries(html) {
  const glossaryChunkMatch = html.match(/<div id='COPYRIGHTED_TEXT_CHUNK'>([\s\S]*?)<\/div>\s*<\/div>\s*<!--  #content -->/);
  const glossaryChunk = glossaryChunkMatch ? glossaryChunkMatch[1] : html;
  const matches = [...glossaryChunk.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)];

  return matches
    .map((match) => {
      const [, rawTitle, rawDescription] = match;
      const title = cleanupImportedTerm(rawTitle);
      const cleanedTitle = title
        .replace(/\s*\[[^\]]*\]\s*$/i, "")
        .replace(/\s*\((?:Thai|Burmese|Skt\.[^)]*|Pali[^)]*)\)\s*$/i, "")
        .trim();
      const descriptionEnglish = stripHtml(rawDescription.replace(/<b>\[\s*MORE\s*\]<\/b>/gi, "").replace(/<b>\[<a[\s\S]*?<\/a>\]<\/b>/gi, ""));
      const slugMatch = rawTitle.match(/id="([^"]+)"/);
      const slug = slugMatch?.[1] || slugify(cleanedTitle);

      if (!cleanedTitle) return null;

      return {
        term: cleanedTitle,
        slug,
        description_en: descriptionEnglish,
        letter: normalizeLetter(cleanedTitle),
        source: "accesstoinsight",
      };
    })
    .filter(Boolean)
    .filter((entry) => isLikelyPali(entry.term))
    .filter((entry, index, all) => all.findIndex((candidate) => normalizeEntryKey(candidate.term) === normalizeEntryKey(entry.term)) === index);
}

function mergeEntries(importedEntries) {
  const merged = new Map();

  for (const entry of importedEntries) {
    merged.set(normalizeLookupKey(entry.term), entry);
  }

  for (const entry of localEntries) {
    merged.set(normalizeEntryKey(entry.term), entry);
  }

  return Array.from(merged.values());
}

async function translatePhrase(phrase) {
  const response = await fetch(`${TRANSLATE_URL}&q=${encodeURIComponent(phrase)}`, {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to translate phrase: ${phrase}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.[0]) ? payload[0].map((part) => part?.[0] || "").join("").trim() : phrase;
}

async function translateEntries(entries) {
  const cachePath = new URL("translation-cache.json", CACHE_DIR);
  let cache = {};

  try {
    cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch (error) {
    cache = {};
  }

  const uniquePhrases = [...new Set(entries.map((entry) => entry.description_en).filter(Boolean))];
  const missingPhrases = uniquePhrases.filter((phrase) => !cache[phrase]);
  const concurrency = 8;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, missingPhrases.length) }, async () => {
    while (cursor < missingPhrases.length) {
      const currentIndex = cursor;
      cursor += 1;
      const phrase = missingPhrases[currentIndex];
      cache[phrase] = await translatePhrase(phrase);
    }
  });

  await Promise.all(workers);

  for (const entry of entries) {
    entry.description_ro = entry.description_en ? cache[entry.description_en] || entry.description_en : entry.description_ro || "";
    const overrideKey = normalizeEntryKey(entry.term);
    if (descriptionOverrides.has(overrideKey)) {
      entry.description_ro = descriptionOverrides.get(overrideKey);
    }
  }

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
  return entries;
}

function buildSections(entries) {
  const sections = new Map();

  for (const entry of entries.sort((left, right) => left.term.localeCompare(right.term, "ro"))) {
    if (!sections.has(entry.letter)) {
      sections.set(entry.letter, []);
    }

    sections.get(entry.letter).push(entry);
  }

  return Array.from(sections.entries()).map(([letter, items]) => ({
    letter,
    items,
  }));
}

function buildSlugMap(entries) {
  const slugMap = new Map();

  const register = (key, entry) => {
    if (!key) {
      return;
    }

    const normalized = normalizeLookupKey(key);

    if (!slugMap.has(normalized)) {
      slugMap.set(normalized, {
        slug: entry.slug,
        term: entry.term,
      });
    }
  };

  for (const entry of entries) {
    register(entry.term, entry);
    register(entry.term.replace(/\s*\([^)]*\)\s*$/, ""), entry);
  }

  return slugMap;
}

function buildEntryBySlug(entries) {
  const entryBySlug = new Map();

  for (const entry of entries) {
    entryBySlug.set(entry.slug, entry);
  }

  return entryBySlug;
}

function findLinkedSlug(reference, slugMap) {
  const candidates = [
    reference,
    reference.replace(/\s*\([^)]*\)\s*$/, ""),
    reference.replace(/\.$/, ""),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeLookupKey(candidate);

    if (slugMap.has(normalized)) {
      return slugMap.get(normalized);
    }
  }

  return null;
}

function resolveCanonicalDescription(entry, slugMap, entryBySlug, seen = new Set()) {
  if (!entry || seen.has(entry.slug)) {
    return "";
  }

  seen.add(entry.slug);

  const english = entry.description_en || "";
  const romanian = entry.description_ro || english;
  const match = english.match(/^(.*?)(See also|See)\s+(.+)\.$/);

  if (!match) {
    return escapeHtml(romanian);
  }

  const seeMarkerMatch = romanian.match(/(?:^|[.!?])\s*(Vezi(?: și)?|Vezi,\s*de asemenea)\b/i);
  const intro = (seeMarkerMatch ? romanian.slice(0, seeMarkerMatch.index).trim() : romanian.trim())
    .replace(/[;,:\-–]\s*$/, "");

  if (intro) {
    return escapeHtml(intro);
  }

  const references = match[3].split(/\s*;\s*/);
  if (references.length !== 1) {
    return "";
  }

  const target = findLinkedSlug(references[0], slugMap);
  if (!target) {
    return "";
  }

  return resolveCanonicalDescription(entryBySlug.get(target.slug), slugMap, entryBySlug, seen);
}

function buildDescriptionHtml(entry, slugMap, entryBySlug) {
  const english = entry.description_en || "";
  const romanian = entry.description_ro || english;
  const match = english.match(/^(.*?)(See also|See)\s+(.+?)(?:\.)?$/);

  if (!match) {
    return escapeHtml(romanian);
  }

  const seeMarkerMatch = romanian.match(/(?:^|[.!?])\s*(Vezi(?: și)?|Vezi,\s*de asemenea)\b/i);
  const intro = match[1] && seeMarkerMatch ? escapeHtml(romanian.slice(0, seeMarkerMatch.index).trimEnd()) : "";
  const prefix = match[2] === "See also" ? "Vezi și " : "Vezi ";
  const references = match[3].split(/\s*;\s*/);
  const linkedReferences = references
    .map((reference) => {
      const target = findLinkedSlug(reference, slugMap);
      if (!target) {
        return null;
      }
      const label = escapeHtml(target.term);
      return `<a href="#${target.slug}">${label}</a>`;
    })
    .filter(Boolean);

  if (!linkedReferences.length) {
    const trimmedIntro = intro || escapeHtml(romanian.replace(/\s*Vezi(?: și)?[\s\S]*$/i, "").replace(/\s*Vezi,\s*de asemenea[\s\S]*$/i, "").trim().replace(/[;,:\-–]\s*$/, ""));
    if (trimmedIntro) {
      return trimmedIntro;
    }

    const directRomanianReference = romanian
      .replace(/^Vezi(?: și)?\s+/i, "")
      .replace(/^Vezi,\s*de asemenea\s+/i, "")
      .trim();

    return escapeHtml(directRomanianReference);
  }

  if (!intro && linkedReferences.length === 1) {
    const target = findLinkedSlug(references[0], slugMap);
    const canonicalDescription = resolveCanonicalDescription(entryBySlug.get(target?.slug), slugMap, entryBySlug);
    if (canonicalDescription) {
      return canonicalDescription;
    }
  }

  return `${intro ? `${intro} ` : ""}${prefix}${linkedReferences.join("; ")}.`;
}

async function main() {
  const { html } = await loadSourceFiles();
  const entries = mergeEntries(extractEntries(html));
  const translatedEntries = await translateEntries(entries);
  const slugMap = buildSlugMap(translatedEntries);
  const entryBySlug = buildEntryBySlug(translatedEntries);

  for (const entry of translatedEntries) {
    entry.description_ro_html = buildDescriptionHtml(entry, slugMap, entryBySlug);
  }

  const sections = buildSections(translatedEntries);

  await fs.mkdir(new URL("../_data/", import.meta.url), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(
      {
        title: "Glosar de subiecte",
        source_url: "https://www.accesstoinsight.org/glossary.html",
        source_name: "Access to Insight Glossary",
        generated_at: new Date().toISOString(),
        total_entries: translatedEntries.length,
        sections,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Generated glossary with ${translatedEntries.length} entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
