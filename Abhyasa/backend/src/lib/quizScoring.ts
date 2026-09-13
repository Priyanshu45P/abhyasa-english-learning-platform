export type ScoringQuestion = {
  id: string;
  correctOptionId: string | null;
};

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionId: string;
};
//This code compares student answers with correct answers and returns the quiz score.
export function scoreQuizAttempt(
  questions: ScoringQuestion[],
  answers: SubmittedAnswer[]
) {
  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionId])
  );

  let correctCount = 0;

  for (const question of questions) {
    const selectedOptionId = answerMap.get(question.id);

    if (
      question.correctOptionId &&
      selectedOptionId &&
      selectedOptionId === question.correctOptionId
    ) {
      correctCount += 1;
    }
  }

  return {
    score: correctCount,
    totalQuestions: questions.length,
  };
}