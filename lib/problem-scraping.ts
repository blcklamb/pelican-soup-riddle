import * as cheerio from "cheerio";

export interface ScrapedProblemReference {
  title: string;
  question: string;
  answer: string;
  sourceUrl: string;
}

const MIN_TEXT_LENGTH = 12;
const MAX_REFERENCES_PER_SOURCE = 12;

export function parseScrapeSourceUrls(value = "") {
  return [
    ...new Set(
      value
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ].filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  });
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripMarker(text: string, markers: RegExp[]) {
  let value = normalizeText(text);
  for (const marker of markers) {
    value = value.replace(marker, "").trim();
  }
  return value;
}

function isQuestionLine(text: string) {
  return /^(문제|Q\.?|Question)\s*[:：-]/i.test(text);
}

function isAnswerLine(text: string) {
  return /^(정답|답|해답|A\.?|Answer|Solution)\s*[:：-]/i.test(text);
}

export function extractProblemReferencesFromHtml(
  html: string,
  sourceUrl: string,
): ScrapedProblemReference[] {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer, header").remove();

  const lines: Array<{ kind: "heading" | "text"; text: string }> = [];
  $("h1, h2, h3, p, li, blockquote").each((_, element) => {
    const tag = element.tagName.toLowerCase();
    const isHeading = tag === "h1" || tag === "h2" || tag === "h3";
    const text = normalizeText($(element).text());
    if (text.length >= (isHeading ? 2 : MIN_TEXT_LENGTH)) {
      lines.push({
        kind: isHeading ? "heading" : "text",
        text,
      });
    }
  });

  const references: ScrapedProblemReference[] = [];
  let title = "";
  let question = "";

  for (const line of lines) {
    if (line.kind === "heading") {
      title = line.text.slice(0, 80);
      continue;
    }

    if (isQuestionLine(line.text)) {
      question = stripMarker(line.text, [/^(문제|Q\.?|Question)\s*[:：-]\s*/i]);
      continue;
    }

    if (question && isAnswerLine(line.text)) {
      const answer = stripMarker(line.text, [/^(정답|답|해답|A\.?|Answer|Solution)\s*[:：-]\s*/i]);
      if (question.length >= MIN_TEXT_LENGTH && answer.length >= MIN_TEXT_LENGTH) {
        references.push({
          title: title || question.slice(0, 40),
          question,
          answer,
          sourceUrl,
        });
      }
      question = "";
    }

    if (references.length >= MAX_REFERENCES_PER_SOURCE) break;
  }

  return references;
}

export async function fetchScrapedProblemReferences(
  urls: string[],
  fetcher: typeof fetch = fetch,
) {
  const references: ScrapedProblemReference[] = [];

  for (const url of urls) {
    try {
      const response = await fetcher(url, {
        headers: {
          "user-agent": "pelican-soup-riddle/1.0 problem-curation",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType && !contentType.includes("html") && !contentType.includes("text")) {
        continue;
      }
      references.push(...extractProblemReferencesFromHtml(await response.text(), url));
    } catch (error) {
      console.warn(`Failed to scrape problem references from ${url}`, error);
    }
  }

  return references;
}
