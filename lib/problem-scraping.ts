import * as cheerio from "cheerio";

export interface ScrapedProblemReference {
  title: string;
  question: string;
  answer: string;
  sourceUrl: string;
}

const MIN_TEXT_LENGTH = 12;
const MAX_REFERENCES_PER_SOURCE = 12;
const PUZZLING_API_PAGE_SIZE = 40;

const BLOCKED_HOSTNAME_PATTERN =
  /^(localhost|.*\.local|.*\.internal|.*\.intranet)$/i;
const PUZZLING_HOSTNAME = "puzzling.stackexchange.com";
const BLOCKED_PUZZLING_TAGS = new Set([
  "anagram",
  "board-games",
  "cards",
  "calculation-puzzle",
  "chess",
  "cipher",
  "code",
  "cryptography",
  "geometry",
  "mathematics",
  "number-sequence",
  "pattern",
  "rebus",
  "sequence",
  "sports",
  "word",
  "wordplay",
]);
const BLOCKED_PUZZLING_TEXT =
  /\b(equation|sequence|solve for|find the letters?|missing letters?|wordsearch|roman numerals?|chess|geometry|number sequence|decode)\b/i;
const BLOCKED_LOCALIZED_PUZZLING_TEXT =
  /\b(shoot|shot|photographer|photo|camera|pun|homophone|wordplay|sounds? like|pronoun\w*|pronunc\w*|spelling|letters?|alphabet|anagram|acronym|initials?|consecutive letters?|translate|translation|german|french|spanish|scrabble|nato|phonetic alphabet|military alphabet|http status|status code|hexadecimal|\bhex\b|card game|playing cards?|poker|hearts|spades|clubs|diamonds|bicycle brand|monopoly|model airplane|toy airplane|remote-?controlled|rc plane|glider|stall speed|foucault|photosensitive|epilepsy)\b/i;
const NARRATIVE_PUZZLING_TEXT =
  /\b(why|how|what happened|what has happened|what was|who|where|dies?|died|survive|survived|killed|murder|hotel|pilot|doctor|guard|wife|man|woman|room|door|bridge|store|train|flight|plane)\b/i;

function isInternalHost(hostname: string) {
  if (BLOCKED_HOSTNAME_PATTERN.test(hostname)) return true;
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some(isNaN)) return false;
  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

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
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
      return !isInternalHost(parsed.hostname);
    } catch {
      return false;
    }
  });
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function textFromHtml(html: string) {
  return normalizeText(cheerio.load(html).text());
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

function isPuzzlingStackExchangeSource(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== PUZZLING_HOSTNAME) return false;
    return /^\/questions\/tagged\/lateral-thinking\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function stackExchangeApiUrl(path: string, params: Record<string, string | number>) {
  const url = new URL(`https://api.stackexchange.com/2.3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

type StackExchangeQuestion = {
  accepted_answer_id?: number;
  answer_count?: number;
  body?: string;
  is_answered?: boolean;
  link?: string;
  question_id: number;
  tags?: string[];
  title?: string;
};

type StackExchangeAnswer = {
  answer_id: number;
  body?: string;
  is_accepted?: boolean;
  question_id: number;
  score?: number;
};

type StackExchangeResponse<T> = {
  items?: T[];
};

function isNarrativePuzzlingQuestion(question: StackExchangeQuestion) {
  const tags = question.tags ?? [];
  if (tags.some((tag) => BLOCKED_PUZZLING_TAGS.has(tag))) return false;

  const title = textFromHtml(question.title ?? "");
  const body = textFromHtml(question.body ?? "");
  const combined = `${title} ${body}`;
  if (BLOCKED_PUZZLING_TEXT.test(combined)) return false;
  if (BLOCKED_LOCALIZED_PUZZLING_TEXT.test(combined)) return false;
  if (!NARRATIVE_PUZZLING_TEXT.test(combined)) return false;
  if (/<img\b/i.test(question.body ?? "") && body.length < 240) return false;
  return Boolean(question.is_answered && question.answer_count && question.link);
}

function hasBlockedPuzzlingReferenceContent(text: string) {
  return (
    BLOCKED_PUZZLING_TEXT.test(text) ||
    BLOCKED_LOCALIZED_PUZZLING_TEXT.test(text)
  );
}

function chooseAnswerForQuestion(
  question: StackExchangeQuestion,
  answersByQuestionId: Map<number, StackExchangeAnswer[]>,
) {
  const answers = answersByQuestionId.get(question.question_id) ?? [];
  return (
    answers.find((answer) => answer.answer_id === question.accepted_answer_id) ??
    answers[0] ??
    null
  );
}

export function extractPuzzlingStackExchangeReferences(
  questions: StackExchangeQuestion[],
  answers: StackExchangeAnswer[],
): ScrapedProblemReference[] {
  const answersByQuestionId = new Map<number, StackExchangeAnswer[]>();
  for (const answer of answers) {
    const current = answersByQuestionId.get(answer.question_id) ?? [];
    current.push(answer);
    current.sort((a, b) => {
      if (a.is_accepted !== b.is_accepted) return a.is_accepted ? -1 : 1;
      return Number(b.score ?? 0) - Number(a.score ?? 0);
    });
    answersByQuestionId.set(answer.question_id, current);
  }

  const references: ScrapedProblemReference[] = [];
  for (const question of questions) {
    if (!isNarrativePuzzlingQuestion(question)) continue;
    const answer = chooseAnswerForQuestion(question, answersByQuestionId);
    if (!answer) continue;

    const title = textFromHtml(question.title ?? "");
    const questionText = textFromHtml(question.body ?? "");
    const answerText = textFromHtml(answer.body ?? "");
    if (hasBlockedPuzzlingReferenceContent(`${title} ${questionText} ${answerText}`)) {
      continue;
    }
    if (
      title.length < 2 ||
      questionText.length < MIN_TEXT_LENGTH ||
      answerText.length < MIN_TEXT_LENGTH ||
      !question.link
    ) {
      continue;
    }

    references.push({
      title: title.slice(0, 80),
      question: questionText,
      answer: answerText,
      sourceUrl: question.link,
    });
    if (references.length >= MAX_REFERENCES_PER_SOURCE) break;
  }
  return references;
}

export async function fetchPuzzlingStackExchangeReferences(
  fetcher: typeof fetch = fetch,
) {
  const questionResponse = await fetcher(
    stackExchangeApiUrl("questions", {
      order: "desc",
      sort: "votes",
      tagged: "lateral-thinking",
      site: "puzzling",
      pagesize: PUZZLING_API_PAGE_SIZE,
      filter: "withbody",
    }),
    {
      headers: {
        "user-agent": "pelican-soup-riddle/1.0 problem-curation",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!questionResponse.ok) return [];

  const questionPayload = (await questionResponse.json()) as StackExchangeResponse<StackExchangeQuestion>;
  const questions = questionPayload.items ?? [];
  const answeredQuestionIds = questions
    .filter((question) => isNarrativePuzzlingQuestion(question))
    .map((question) => question.question_id);
  if (answeredQuestionIds.length === 0) return [];

  const answerResponse = await fetcher(
    stackExchangeApiUrl(`questions/${answeredQuestionIds.join(";")}/answers`, {
      order: "desc",
      sort: "votes",
      site: "puzzling",
      pagesize: 100,
      filter: "withbody",
    }),
    {
      headers: {
        "user-agent": "pelican-soup-riddle/1.0 problem-curation",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!answerResponse.ok) return [];

  const answerPayload = (await answerResponse.json()) as StackExchangeResponse<StackExchangeAnswer>;
  return extractPuzzlingStackExchangeReferences(questions, answerPayload.items ?? []);
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
      if (isPuzzlingStackExchangeSource(url)) {
        references.push(...(await fetchPuzzlingStackExchangeReferences(fetcher)));
        continue;
      }

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
