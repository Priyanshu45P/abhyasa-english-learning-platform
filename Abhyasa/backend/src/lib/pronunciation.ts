export type PronunciationScore = "exact" | "close" | "mismatch";

export type PronunciationResult = {
  expected: string;
  transcript: string;
  score: PronunciationScore;
  matchPercent: number;
  feedback: string;
};

export function normalizePronunciationText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinDistance(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

export function getWordSimilarityPercent(expected: string, transcript: string) {
  const maxLength = Math.max(expected.length, transcript.length, 1);
  const distance = levenshteinDistance(expected, transcript);

  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

export function getSentenceSimilarityPercent(expected: string, transcript: string) {
  const expectedWords = expected.split(" ").filter(Boolean);
  const transcriptWords = transcript.split(" ").filter(Boolean);

  if (expectedWords.length === 0 && transcriptWords.length === 0) return 100;

  let matched = 0;

  for (let i = 0; i < Math.min(expectedWords.length, transcriptWords.length); i += 1) {
    if (expectedWords[i] === transcriptWords[i]) {
      matched += 1;
    } else {
      const wordSimilarity = getWordSimilarityPercent(
        expectedWords[i],
        transcriptWords[i]
      );

      if (wordSimilarity >= 75) matched += 1;
    }
  }

  const denominator = Math.max(expectedWords.length, transcriptWords.length, 1);

  return Math.round((matched / denominator) * 100);
}

export function buildPronunciationResult(
  expected: string,
  transcript: string,
  type: "word" | "phrase" | "sentence"
): PronunciationResult {
  const normalizedExpected = normalizePronunciationText(expected);
  const normalizedTranscript = normalizePronunciationText(transcript);

  let matchPercent = 0;

  if (!normalizedExpected || !normalizedTranscript) {
    matchPercent = 0;
  } else if (type === "word") {
    matchPercent = getWordSimilarityPercent(
      normalizedExpected,
      normalizedTranscript
    );
  } else {
    const sentencePercent = getSentenceSimilarityPercent(
      normalizedExpected,
      normalizedTranscript
    );

    const charPercent = getWordSimilarityPercent(
      normalizedExpected,
      normalizedTranscript
    );

    matchPercent = Math.round(sentencePercent * 0.7 + charPercent * 0.3);
  }

  let score: PronunciationScore = "mismatch";
  let feedback = "Try again and speak more clearly.";

  if (matchPercent >= 90) {
    score = "exact";
    feedback = "Excellent pronunciation. Your speech matched the target very well.";
  } else if (matchPercent >= 70) {
    score = "close";
    feedback = "Good attempt. You are close, but a few sounds need clearer pronunciation.";
  } else if (matchPercent >= 45) {
    score = "mismatch";
    feedback = "You are partly correct. Listen again, speak slowly, and try one more time.";
  }

  return {
    expected,
    transcript,
    score,
    matchPercent,
    feedback,
  };
}