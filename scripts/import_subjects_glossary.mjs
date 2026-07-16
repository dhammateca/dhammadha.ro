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

const referenceAliases = new Map([
  ["paramis", "pāramī, pāramitā"],
  ["pali", "Pāḷi"],
]);

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
  { term: "appamādo", description_ro: "Lucid." },
  { term: "āsava", description_ro: "Scursuri." },
  { term: "araha", description_ro: "Vrednic." },
  { term: "kamp", description_ro: "A tremura, a zdruncina." },
  { term: "sevanā", description_ro: "Urma, întovărăși, a-și face de lucru(?)." },
  { term: "saññamo", description_ro: "Înfrânare." },
  { term: "saṁvega", description_ro: "Descurajare." },
  { term: "thera", description_ro: "Venerabil." },
  { term: "vi", description_ro: "Răzleț." },
  { term: "vi-", description_ro: "Dis-.", slug: "vi-prefix" },
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
    ["Anattā", "Non-sine. Vezi și Tilakkhaṇa (trei caracteristici ale existenței)"],
    ["Ariya-aṭṭhaṅgika-magga", "Calea de opt părți nobilă"],
    ["Avijjā", "Neconștientizare; ignoranţă; conștientizare întunecată; amăgire despre natura minții."],
    ["Deva / devatā", "Zeu. Literal, „unul strălucitor” - un locuitor al tărâmurilor cerești."],
    ["Buddha", "Numele dat celui care redescoperă pentru el însuși calea eliberatoare a Dhammei, după o lungă perioadă în care a fost uitată de lume. Potrivit tradiției, un lung șir de Buddha se întinde în trecutul îndepărtat. Cel mai recent Buddha s-a născut Siddhattha Gotama în India în secolul al VI-lea î.Hr. Un tânăr bine educat și bogat, el și-a renunțat la familia și moștenirea princiară în floarea vieții sale pentru a căuta adevărata libertate și sfârșitul suferinței (dukkha). După șapte ani de austerități în pădure, a redescoperit „calea de mijloc” și și-a atins scopul, devenind Buddha."],
    ["Hiri", "Conștiință. Vezi și Ottappa (prudență morală)"],
    ["Mettā", "Bunăvoință, bunătate pașnică. Vezi și Brahmavihāra; Pāramīs."],
    ["Nekkhamma", "Renunţare; literal, „libertatea de poftă senzuală”. Unul dintre cei zece pāramīs."],
    ["Paññā-vimutti", "Izbăvire. Vezi și Awakening."],
    ["Pīti", "Extaziere; exaltare. Vezi și Jhāna."],
    ["Paññā", "Discernământ; perspicacitate; înţelepciune; inteligență; bunul simț; ingeniozitate. Una dintre cele zece perfecțiuni (pāramīs)."],
    ["Saṅgha", "Obștea monahală; Comunitatea Celor Treziți. Vezi și Monastic life; Tirataṇa (Tripla Giuvaierie)."],
    ["Sāvaka", "Literal, „ascultător”. Un discipol al lui Buddha, în special un discipol nobil."],
    ["Sacca", "Adevărul. Una dintre cele zece perfecțiuni (pāramīs)."],
    ["Taṇhā", "Râvnă. Vezi și Kilesa (pângăriri); Paṭicca-samuppāda (origine dependentă); Sensuality."],
    ["Upekkhā", "Echidistanță. Vezi și Brahmavihāra; Pāramīs."],
    ["Vimutti", "Izbăvire. Vezi și Awakening."],
    ["Vinaya", "Viața monahală."],
    ["Viññāṇa", "Conștiință. Vezi și Khandha (agregatele atașamentului); Paṭicca-samuppāda (origine dependentă)."],
    ["Vipassanā", "Introspecție. Vezi și Samatha (liniște); Tilakkhaṇa (trei caracteristici ale existenței)."],
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
    const aliasTarget = referenceAliases.get(normalized);

    if (slugMap.has(normalized)) {
      return slugMap.get(normalized);
    }

    if (aliasTarget) {
      const aliasKey = normalizeLookupKey(aliasTarget);
      if (slugMap.has(aliasKey)) {
        return slugMap.get(aliasKey);
      }
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

function linkReferenceToken(token, slugMap) {
  const trimmed = token.trim();
  if (!trimmed) {
    return token;
  }

  const parentheticalMatch = trimmed.match(/^(.+?)(\s*\([^)]*\))$/);
  const baseTerm = parentheticalMatch ? parentheticalMatch[1].trim() : trimmed;
  const parenthetical = parentheticalMatch ? parentheticalMatch[2] : "";
  const target = findLinkedSlug(baseTerm, slugMap) || findLinkedSlug(trimmed, slugMap);

  if (!target) {
    return token;
  }

  const leadingWhitespace = token.match(/^\s*/)?.[0] || "";
  const trailingWhitespace = token.match(/\s*$/)?.[0] || "";
  return `${leadingWhitespace}<a href="#${target.slug}">${escapeHtml(baseTerm)}</a>${escapeHtml(parenthetical)}${trailingWhitespace}`;
}

function linkReferenceSpan(span, slugMap) {
  const parts = span.split(/(\s*;\s*|\s*,\s*|\s+și\s+)/);
  const linkedTokens = [];

  for (let index = 0; index < parts.length; index += 2) {
    const linkedToken = linkReferenceToken(parts[index], slugMap);
    if (linkedToken !== parts[index]) {
      linkedTokens.push({
        token: linkedToken,
        separator: parts[index - 1] || "",
      });
    }
  }

  if (!linkedTokens.length) {
    return {
      html: "",
      linkedCount: 0,
    };
  }

  return {
    html: linkedTokens
      .map((item, index) => `${index === 0 ? "" : item.separator}${item.token}`)
      .join(""),
    linkedCount: linkedTokens.length,
  };
}

function cleanupReferenceArtifacts(html) {
  return html
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.;:!?])\s*([.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*[.;,:]\s*/, "")
    .trim();
}

function linkParentheticalGlossaryRefs(html, slugMap) {
  const segments = html.split(/(<a [\s\S]*?<\/a>)/);

  return segments
    .map((segment) => {
      if (segment.startsWith("<a ")) {
        return segment;
      }

      return segment.replace(/\(([^()<>]+)\)/g, (match, inside) => {
        const trimmed = inside.trim();
        if (!trimmed || /^vezi\b/i.test(trimmed)) {
          return match;
        }

        const target = findLinkedSlug(trimmed, slugMap);
        if (!target) {
          return match;
        }

        return `(vezi <a href="#${target.slug}">${escapeHtml(target.term)}</a>)`;
      });
    })
    .join("");
}

function linkInlineReferences(html, slugMap) {
  const segments = html.split(/(<a [\s\S]*?<\/a>)/);

  return segments
    .map((segment) => {
      if (segment.startsWith("<a ")) {
        return segment;
      }

      let result = "";
      let cursor = 0;
      const markerPattern = /\b(Vezi(?: și)?|vezi(?: și)?)(:?)\s+/g;
      let markerMatch;

      while ((markerMatch = markerPattern.exec(segment)) !== null) {
        const [matchedText, marker, colon] = markerMatch;
        const start = markerMatch.index + matchedText.length;
        const markerIsParenthetical = segment[markerMatch.index - 1] === "(";
        let end = segment.length;

        for (let index = start; index < segment.length; index += 1) {
          const char = segment[index];
          if (char === "." || char === "]" || (markerIsParenthetical && char === ")")) {
            end = index;
            break;
          }
        }

        const span = segment.slice(start, end);
        const { html: linkedSpan, linkedCount } = linkReferenceSpan(span, slugMap);

        result += segment.slice(cursor, markerMatch.index);

        if (!linkedCount) {
          if (markerIsParenthetical && result.endsWith("(")) {
            result = result.slice(0, -1);
            cursor = end + 1;
            markerPattern.lastIndex = end + 1;
            continue;
          }
        } else {
          result += `${marker}${colon} ${linkedSpan}`;
        }

        cursor = end;
        markerPattern.lastIndex = end;
      }

      return result + segment.slice(cursor);
    })
    .join("");
}

function buildDescriptionHtml(entry, slugMap, entryBySlug) {
  const english = entry.description_en || "";
  const romanian = entry.description_ro || english;
  const match = english.match(/^(.*?)(See also|See)\s+(.+?)(?:\.)?$/);

  if (!match) {
    return cleanupReferenceArtifacts(linkParentheticalGlossaryRefs(linkInlineReferences(escapeHtml(romanian), slugMap), slugMap));
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
      return cleanupReferenceArtifacts(linkParentheticalGlossaryRefs(linkInlineReferences(trimmedIntro, slugMap), slugMap));
    }

    const directRomanianReference = romanian
      .replace(/^Vezi(?: și)?\s+/i, "")
      .replace(/^Vezi,\s*de asemenea\s+/i, "")
      .trim();

    return cleanupReferenceArtifacts(linkParentheticalGlossaryRefs(linkInlineReferences(escapeHtml(directRomanianReference), slugMap), slugMap));
  }

  if (!intro && linkedReferences.length === 1) {
    const target = findLinkedSlug(references[0], slugMap);
    const canonicalDescription = resolveCanonicalDescription(entryBySlug.get(target?.slug), slugMap, entryBySlug);
    if (canonicalDescription) {
      return cleanupReferenceArtifacts(linkParentheticalGlossaryRefs(linkInlineReferences(canonicalDescription, slugMap), slugMap));
    }
  }

  return cleanupReferenceArtifacts(linkParentheticalGlossaryRefs(linkInlineReferences(`${intro ? `${intro} ` : ""}${prefix}${linkedReferences.join("; ")}.`, slugMap), slugMap));
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
