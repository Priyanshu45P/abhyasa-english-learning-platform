import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { useClassroomStore } from "@/stores/classroomStore";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type SubmitQuizAttemptResponse = {
  attemptId: string;
  score: number;
  totalQuestions: number;
};

export default function QuizAttempt() {
  const { classroomId, id } = useParams<{ classroomId?: string; id?: string }>();

  const {
    selectedClassroomContent,
    fetchClassroomContent,
    clearSelectedClassroomContent,
  } = useClassroomStore();

  const { quizzes, initialized, initializeContent } = useContentStore();
  const { fetchMyProgress, markComplete, isCompleted } = useProgressStore();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [attemptTotal, setAttemptTotal] = useState<number | null>(null);

  useEffect(() => {
    void fetchMyProgress();

    if (classroomId) {
      void fetchClassroomContent(classroomId);
    }

    if (!initialized) {
      void initializeContent();
    }

    return () => {
      clearSelectedClassroomContent();
    };
  }, [
    fetchMyProgress,
    classroomId,
    fetchClassroomContent,
    clearSelectedClassroomContent,
    initialized,
    initializeContent,
  ]);

  const quiz = useMemo(() => {
    if (classroomId && selectedClassroomContent?.quizzes) {
      return selectedClassroomContent.quizzes.find((item) => item.id === id);
    }

    return quizzes.find((item) => item.id === id);
  }, [classroomId, selectedClassroomContent, quizzes, id]);

  if (!quiz || !id) {
    return <div className="p-8 text-muted-foreground">Quiz not found.</div>;
  }

  const completed = isCompleted("quiz", quiz.id);

  const totalQuestions = quiz.questions.length;
  const localCorrectCount = quiz.questions.reduce((count, question) => {
    return selectedAnswers[question.id] === question.correctOptionId ? count + 1 : count;
  }, 0);

  const scoreToShow = attemptScore ?? localCorrectCount;
  const totalToShow = attemptTotal ?? totalQuestions;
  const scorePercent =
    totalToShow === 0 ? 0 : Math.round((scoreToShow / totalToShow) * 100);

  const backTo = classroomId
    ? `/student/classrooms/${classroomId}`
    : "/student/dashboard";
 // Make sure every question has an answer.
  const handleSubmit = async () => {
    setSubmitError("");

    const unanswered = quiz.questions.some((question) => !selectedAnswers[question.id]);
    if (unanswered) {
      setSubmitError("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {  // Prepare answers for backend.
      const payload = {
        quizId: quiz.id,
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: selectedAnswers[question.id],
        })),
      };
// Send answers to backend.
      const result = await apiFetch<SubmitQuizAttemptResponse>("/quizzes/attempts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
 // Show score returned by backend.
      setAttemptScore(result.score);
      setAttemptTotal(result.totalQuestions);
      setSubmitted(true);
// Mark quiz as completed.
      await markComplete("quiz", quiz.id);
      await fetchMyProgress();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title={quiz.title}
        description={quiz.description}
        actions={
          <Link to={backTo}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />

      {submitted && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Your score</p>
                <p className="text-sm text-muted-foreground">
                  {scoreToShow} / {totalToShow} correct
                </p>
              </div>
              <div className="text-2xl font-bold">{scorePercent}%</div>
            </div>

            <div className="mt-4">
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Quiz completed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {submitError && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {submitError}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">Question {index + 1}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="font-medium">{question.text}</p>

              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = selectedAnswers[question.id] === option.id;
                  const isCorrect = option.id === question.correctOptionId;
                  const showCorrect = submitted && isCorrect;
                  const showWrong = submitted && selected && !isCorrect;

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        showCorrect
                          ? "border-emerald-300 bg-emerald-50"
                          : showWrong
                          ? "border-rose-300 bg-rose-50"
                          : selected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={selected}
                        disabled={submitted || isSubmitting}
                        onChange={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [question.id]: option.id,
                          }))
                        }
                      />
                      <span className="text-sm">{option.text}</span>
                    </label>
                  );
                })}
              </div>

              {submitted && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    {selectedAnswers[question.id] === question.correctOptionId
                      ? "Correct"
                      : "Incorrect"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pb-6">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : completed ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" />
            Quiz completed
          </div>
        ) : (
          <Button onClick={() => void markComplete("quiz", quiz.id)}>
            <CheckCircle2 className="size-4 mr-2" />
            Finish Quiz
          </Button>
        )}
      </div>
    </div>
  );
}