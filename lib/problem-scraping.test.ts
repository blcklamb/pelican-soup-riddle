import { describe, expect, it, vi } from "vitest";
import {
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
});
