import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

export function compareTexts(expected: string, actual: string): {
  score: 'exact' | 'close' | 'mismatch';
  feedback: string;
  matchPercent: number;
} {
  const normExpected = normalizeText(expected);
  const normActual = normalizeText(actual);

  if (normExpected === normActual) {
    return { score: 'exact', feedback: 'Perfect match! Excellent pronunciation.', matchPercent: 100 };
  }

  const expectedWords = normExpected.split(' ');
  const actualWords = normActual.split(' ');
  let matchCount = 0;

  expectedWords.forEach((word) => {
    if (actualWords.includes(word)) matchCount++;
  });

  const matchPercent = Math.round((matchCount / expectedWords.length) * 100);

  if (matchPercent >= 70) {
    const missing = expectedWords.filter((w) => !actualWords.includes(w));
    return {
      score: 'close',
      feedback: `Close! ${matchPercent}% match. Words to review: ${missing.join(', ')}`,
      matchPercent,
    };
  }

  return {
    score: 'mismatch',
    feedback: `${matchPercent}% match. Keep practising — try speaking more slowly and clearly.`,
    matchPercent,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
