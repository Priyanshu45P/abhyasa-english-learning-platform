import { describe, expect, it } from "vitest";
import {
  buildPronunciationResult,
  getSentenceSimilarityPercent,
  getWordSimilarityPercent,
  levenshteinDistance,
  normalizePronunciationText,
} from "./pronunciation";

describe("pronunciation helpers", () => {
  it("normalises case, punctuation, and extra spaces", () => {
    expect(normalizePronunciationText("  Hello,   WORLD! ")).toBe("hello world");
  });

  it("calculates levenshtein distance", () => {
    expect(levenshteinDistance("cat", "cat")).toBe(0);
    expect(levenshteinDistance("cat", "cut")).toBe(1);
    expect(levenshteinDistance("cat", "cats")).toBe(1);
  });

  it("gives 100 percent for identical words", () => {
    expect(getWordSimilarityPercent("hello", "hello")).toBe(100);
  });

  it("gives high similarity for close words", () => {
    expect(getWordSimilarityPercent("hello", "hallo")).toBeGreaterThanOrEqual(
      70
    );
  });

  it("scores matching sentences highly", () => {
    const score = getSentenceSimilarityPercent(
      "i go to school",
      "i go to school"
    );

    expect(score).toBe(100);
  });

  it("builds exact result for matching word", () => {
    const result = buildPronunciationResult("Apple", "apple", "word");

    expect(result.score).toBe("exact");
    expect(result.matchPercent).toBe(100);
  });

  it("builds close result for similar word", () => {
    const result = buildPronunciationResult("hello", "hallo", "word");

    expect(result.score).toBe("close");
    expect(result.matchPercent).toBeGreaterThanOrEqual(70);
  });

  it("builds mismatch result for different phrase", () => {
    const result = buildPronunciationResult(
      "good morning",
      "banana table",
      "phrase"
    );

    expect(result.score).toBe("mismatch");
    expect(result.matchPercent).toBeLessThan(70);
  });

  it("returns zero when transcript is empty", () => {
    const result = buildPronunciationResult("hello", "", "word");

    expect(result.score).toBe("mismatch");
    expect(result.matchPercent).toBe(0);
  });
});