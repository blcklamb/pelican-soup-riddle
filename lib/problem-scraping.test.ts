import { describe, expect, it, vi } from "vitest";
import {
  extractPuzzlingStackExchangeReferences,
  extractProblemReferencesFromHtml,
  fetchScrapedProblemReferences,
  parseScrapeSourceUrls,
} from "@/lib/problem-scraping";

describe("parseScrapeSourceUrls", () => {
  it("keeps unique http urls from a comma separated env value", () => {
    expect(
      parseScrapeSourceUrls(
        " https://example.com/a,not-a-url,https://example.com/a,http://example.com/b ",
      ),
    ).toEqual(["https://example.com/a", "http://example.com/b"]);
  });
});

describe("extractProblemReferencesFromHtml", () => {
  it("extracts problem and answer candidates from fixture html", () => {
    const references = extractProblemReferencesFromHtml(
      `
        <article>
          <h2>사라진 엘리베이터</h2>
          <p>문제: 남자는 엘리베이터 버튼을 누르지 못해서 매일 계단을 올라갔다. 비 오는 날만은 집까지 편하게 갔다. 왜일까?</p>
          <p>정답: 남자는 키가 작아 높은 층 버튼을 누르지 못했다. 비 오는 날에는 우산 끝으로 버튼을 누를 수 있었다.</p>
        </article>
      `,
      "https://example.com/puzzles",
    );

    expect(references).toEqual([
      {
        title: "사라진 엘리베이터",
        question:
          "남자는 엘리베이터 버튼을 누르지 못해서 매일 계단을 올라갔다. 비 오는 날만은 집까지 편하게 갔다. 왜일까?",
        answer:
          "남자는 키가 작아 높은 층 버튼을 누르지 못했다. 비 오는 날에는 우산 끝으로 버튼을 누를 수 있었다.",
        sourceUrl: "https://example.com/puzzles",
      },
    ]);
  });
});

describe("extractPuzzlingStackExchangeReferences", () => {
  it("keeps accepted narrative lateral-thinking questions and rejects pattern/math items", () => {
    const references = extractPuzzlingStackExchangeReferences(
      [
        {
          question_id: 1,
          accepted_answer_id: 10,
          answer_count: 2,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "Guard gets fired after saving CEO's life",
          link: "https://puzzling.stackexchange.com/questions/1/guard",
          body: "<p>A guard saves a CEO from a flight, then gets fired. Why?</p>",
        },
        {
          question_id: 2,
          accepted_answer_id: 20,
          answer_count: 1,
          is_answered: true,
          tags: ["pattern", "lateral-thinking"],
          title: "Find the letters",
          link: "https://puzzling.stackexchange.com/questions/2/pattern",
          body: "<p>Find the missing letters in this sequence.</p>",
        },
      ],
      [
        {
          answer_id: 10,
          question_id: 1,
          is_accepted: true,
          score: 5,
          body: "<p>He knew because he dreamed it while sleeping on duty.</p>",
        },
        {
          answer_id: 20,
          question_id: 2,
          is_accepted: true,
          score: 10,
          body: "<p>The answer is a letter pattern.</p>",
        },
      ],
    );

    expect(references).toEqual([
      {
        title: "Guard gets fired after saving CEO's life",
        question: "A guard saves a CEO from a flight, then gets fired. Why?",
        answer: "He knew because he dreamed it while sleeping on duty.",
        sourceUrl: "https://puzzling.stackexchange.com/questions/1/guard",
      },
    ]);
  });
});

describe("fetchScrapedProblemReferences", () => {
  it("passes source urls through fetched references and skips failures", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          "<h2>문제 하나</h2><p>문제: 사람이 방에 들어가자 모두 박수를 쳤다. 그는 아무 말도 하지 않았다. 왜일까?</p><p>정답: 그는 공연자였고 무대에 등장하는 순간 관객이 박수를 친 것이다.</p>",
          { headers: { "content-type": "text/html" } },
        ),
      )
      .mockRejectedValueOnce(new Error("blocked"));

    const references = await fetchScrapedProblemReferences(
      ["https://example.com/ok", "https://example.com/fail"],
      fetcher,
    );

    expect(references).toHaveLength(1);
    expect(references[0]?.sourceUrl).toBe("https://example.com/ok");
  });

  it("uses the Puzzling Stack Exchange API adapter for lateral-thinking tag pages", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                question_id: 31761,
                accepted_answer_id: 31762,
                answer_count: 1,
                is_answered: true,
                tags: ["lateral-thinking"],
                title: "Guard gets fired after saving CEO's life",
                link: "https://puzzling.stackexchange.com/questions/31761/guard-gets-fired-after-saving-ceos-life",
                body: "<p>A guard saves the CEO and is fired. Why?</p>",
              },
            ],
          }),
          { headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                answer_id: 31762,
                question_id: 31761,
                is_accepted: true,
                score: 1,
                body: "<p>The guard dreamed it, so he slept during the night shift.</p>",
              },
            ],
          }),
          { headers: { "content-type": "application/json" } },
        ),
      );

    const references = await fetchScrapedProblemReferences(
      ["https://puzzling.stackexchange.com/questions/tagged/lateral-thinking"],
      fetcher,
    );

    expect(String(fetcher.mock.calls[0]?.[0])).toContain(
      "api.stackexchange.com/2.3/questions",
    );
    expect(String(fetcher.mock.calls[1]?.[0])).toContain(
      "api.stackexchange.com/2.3/questions/31761/answers",
    );
    expect(references).toEqual([
      {
        title: "Guard gets fired after saving CEO's life",
        question: "A guard saves the CEO and is fired. Why?",
        answer: "The guard dreamed it, so he slept during the night shift.",
        sourceUrl:
          "https://puzzling.stackexchange.com/questions/31761/guard-gets-fired-after-saving-ceos-life",
      },
    ]);
  });
});
