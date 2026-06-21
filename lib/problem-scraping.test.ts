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

  it("rejects translation-dependent, external-rule, and scale-redefinition answers", () => {
    const references = extractPuzzlingStackExchangeReferences(
      [
        {
          question_id: 3,
          accepted_answer_id: 30,
          answer_count: 1,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "My strange hotel room neighbours",
          link: "https://puzzling.stackexchange.com/questions/3/hotel",
          body: "<p>A family in a hotel takes the lift down but walks up ten floors after dinner. Why?</p>",
        },
        {
          question_id: 4,
          accepted_answer_id: 40,
          answer_count: 1,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "Friends met up at the bar",
          link: "https://puzzling.stackexchange.com/questions/4/shot",
          body: "<p>A man said he shot his family and dog, but nobody was worried. Why?</p>",
        },
        {
          question_id: 5,
          accepted_answer_id: 50,
          answer_count: 1,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "A loving marriage?",
          link: "https://puzzling.stackexchange.com/questions/5/hearts",
          body: "<p>The heartless man threw down his shovel as his wife fell. Why?</p>",
        },
        {
          question_id: 6,
          accepted_answer_id: 60,
          answer_count: 1,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "How did the pilot survive the crash?",
          link: "https://puzzling.stackexchange.com/questions/6/pilot",
          body: "<p>A pilot's plane crashed and disintegrated, but the pilot walked away. Why?</p>",
        },
      ],
      [
        {
          answer_id: 30,
          question_id: 3,
          is_accepted: true,
          score: 10,
          body: "<p>The parents wanted to tire the children out so they would sleep.</p>",
        },
        {
          answer_id: 40,
          question_id: 4,
          is_accepted: true,
          score: 10,
          body: "<p>He was a photographer, so he shot photos with a camera.</p>",
        },
        {
          answer_id: 50,
          question_id: 5,
          is_accepted: true,
          score: 10,
          body: "<p>They were playing the card game Hearts, and he had only spades.</p>",
        },
        {
          answer_id: 60,
          question_id: 6,
          is_accepted: true,
          score: 10,
          body: "<p>It was a model airplane, so the pilot was never inside it.</p>",
        },
      ],
    );

    expect(references).toEqual([
      {
        title: "My strange hotel room neighbours",
        question:
          "A family in a hotel takes the lift down but walks up ten floors after dinner. Why?",
        answer: "The parents wanted to tire the children out so they would sleep.",
        sourceUrl: "https://puzzling.stackexchange.com/questions/3/hotel",
      },
    ]);
  });

  it("rejects answers that hinge on how a word is pronounced", () => {
    const references = extractPuzzlingStackExchangeReferences(
      [
        {
          question_id: 7,
          accepted_answer_id: 70,
          answer_count: 1,
          is_answered: true,
          tags: ["lateral-thinking"],
          title: "The strange phone call",
          link: "https://puzzling.stackexchange.com/questions/7/call",
          body: "<p>A man heard one word on the phone and immediately drove to the hospital. Why?</p>",
        },
      ],
      [
        {
          answer_id: 70,
          question_id: 7,
          is_accepted: true,
          score: 10,
          body: "<p>The word is pronounced the same as another, so he misheard the message.</p>",
        },
      ],
    );

    expect(references).toEqual([]);
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

  it("does not use the API adapter for non lateral-thinking Puzzling URLs", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("<html><body></body></html>", {
          headers: { "content-type": "text/html" },
        }),
      );

    await fetchScrapedProblemReferences(
      ["https://puzzling.stackexchange.com/questions/31761/guard"],
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      "https://puzzling.stackexchange.com/questions/31761/guard",
    );
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain(
      "api.stackexchange.com",
    );
  });
});
