import { describe, expect, it } from "vitest";
import { scoreQuizAttempt } from "../src/lib/quizScoring.js";

describe("scoreQuizAttempt", () => {
  it("scores all correct answers", () => { // Checks score is 2/2 when both answers are correct.
    const result = scoreQuizAttempt(
      [
        { id: "q1", correctOptionId: "a1" },
        { id: "q2", correctOptionId: "b2" },
      ],
      [
        { questionId: "q1", selectedOptionId: "a1" },
        { questionId: "q2", selectedOptionId: "b2" },
      ]
    );

    expect(result).toEqual({
      score: 2,
      totalQuestions: 2,
    });
  });

  it("scores mixed correct and incorrect answers", () => { // Checks only correct answers are counted.
    const result = scoreQuizAttempt(
      [
        { id: "q1", correctOptionId: "a1" },
        { id: "q2", correctOptionId: "b2" },
        { id: "q3", correctOptionId: "c3" },
      ],
      [
        { questionId: "q1", selectedOptionId: "a1" },
        { questionId: "q2", selectedOptionId: "wrong" },
        { questionId: "q3", selectedOptionId: "c3" },
      ]
    );

    expect(result).toEqual({
      score: 2,
      totalQuestions: 3,
    });
  });

  it("ignores answers for unknown questions", () => { // Unknown question ID should not affect score.
    const result = scoreQuizAttempt(
      [{ id: "q1", correctOptionId: "a1" }],
      [
        { questionId: "q1", selectedOptionId: "a1" },
        { questionId: "unknown", selectedOptionId: "x" },
      ]
    );

    expect(result).toEqual({
      score: 1,
      totalQuestions: 1,
    });
  });

  it("does not count unanswered questions as correct", () => { // Missing answer should not be counted as correct.
    const result = scoreQuizAttempt(
      [
        { id: "q1", correctOptionId: "a1" },
        { id: "q2", correctOptionId: "b2" },
      ],
      [{ questionId: "q1", selectedOptionId: "a1" }]
    );

    expect(result).toEqual({
      score: 1,
      totalQuestions: 2,
    });
  });

  it("does not count questions without a correct option", () => { // If correct option is null, it should not count.
    const result = scoreQuizAttempt(
      [{ id: "q1", correctOptionId: null }],
      [{ questionId: "q1", selectedOptionId: "a1" }]
    );

    expect(result).toEqual({
      score: 0,
      totalQuestions: 1,
    });
  });
});