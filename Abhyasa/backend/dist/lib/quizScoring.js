export function scoreQuizAttempt(questions, answers) {
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedOptionId]));
    let correctCount = 0;
    for (const question of questions) {
        const selectedOptionId = answerMap.get(question.id);
        if (question.correctOptionId &&
            selectedOptionId &&
            selectedOptionId === question.correctOptionId) {
            correctCount += 1;
        }
    }
    return {
        score: correctCount,
        totalQuestions: questions.length,
    };
}
