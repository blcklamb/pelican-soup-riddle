import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2];
if (!file) throw new Error("JSON 파일 경로가 필요합니다.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Supabase 환경변수가 필요합니다.");
}

const allowedCategories = new Set(["Paradox", "Weird", "Logic", "Mystery"]);
const allowedDifficulties = new Set(["Easy", "Medium", "Hard"]);
const items = JSON.parse(await readFile(file, "utf8"));
if (!Array.isArray(items)) throw new Error("최상위 값은 배열이어야 합니다.");

function requiredText(item, key, minLength = 1) {
  const value = item[key];
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new Error(`${key} 값이 올바르지 않습니다.`);
  }
  return value.trim();
}

function validate(item, index) {
  const releaseDate = requiredText(item, "releaseDate", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    throw new Error(`${index + 1}번 문제의 releaseDate 형식이 잘못되었습니다.`);
  }
  if (!allowedCategories.has(item.category)) {
    throw new Error(`${index + 1}번 문제의 category가 잘못되었습니다.`);
  }
  if (!allowedDifficulties.has(item.difficulty)) {
    throw new Error(`${index + 1}번 문제의 difficulty가 잘못되었습니다.`);
  }
  if (!Array.isArray(item.answerKeywords) || item.answerKeywords.length < 3) {
    throw new Error(`${index + 1}번 문제에는 키워드가 3개 이상 필요합니다.`);
  }
  if (item.source === "Web" && !item.sourceUrl) {
    throw new Error(`${index + 1}번 Web 문제에는 sourceUrl이 필요합니다.`);
  }

  return {
    releaseDate,
    title: requiredText(item, "title", 2),
    question: requiredText(item, "question", 30),
    answer: requiredText(item, "answer", 30),
    explanation: requiredText(item, "explanation", 20),
    answerKeywords: item.answerKeywords.map((keyword) => String(keyword).trim()),
    category: item.category,
    difficulty: item.difficulty,
    source: item.source === "Web" ? "Web" : "Manual",
    sourceUrl: item.sourceUrl ? String(item.sourceUrl) : "",
  };
}

const problems = items.map(validate);
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

for (const problem of problems) {
  const { data, error } = await supabase.rpc("publish_curated_daily_problem", {
    p_release_date: problem.releaseDate,
    p_title: problem.title,
    p_question: problem.question,
    p_answer: problem.answer,
    p_explanation: problem.explanation,
    p_answer_keywords: problem.answerKeywords,
    p_category: problem.category,
    p_difficulty: problem.difficulty,
    p_source: problem.source,
    p_source_url: problem.sourceUrl,
    p_is_released: problem.releaseDate <= today,
  });
  if (error) throw new Error(`${problem.releaseDate} ${problem.title}: ${error.message}`);
  process.stdout.write(`Imported ${problem.releaseDate} ${problem.title} (${data})\n`);
}
