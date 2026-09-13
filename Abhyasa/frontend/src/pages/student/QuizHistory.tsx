import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgressStore } from "@/stores/progressStore";
import { ClipboardCheck } from "lucide-react";

type StudentQuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  userNameSnapshot: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
};

export default function QuizHistory() {
  const { studentAnalytics, fetchStudentAnalytics } = useProgressStore();

  const [quizFilter, setQuizFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    void fetchStudentAnalytics();
  }, [fetchStudentAnalytics]);

  const attempts: StudentQuizAttempt[] = studentAnalytics?.quizAttempts ?? [];

  const quizOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; label: string }> = [];

    for (const attempt of attempts) {
      if (!seen.has(attempt.quizId)) {
        seen.add(attempt.quizId);
        options.push({
          id: attempt.quizId,
          label: `Quiz ${attempt.quizId.slice(0, 8)}`,
        });
      }
    }

    return options;
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      const percent =
        attempt.totalQuestions > 0
          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
          : 0;

      const matchesQuiz =
        quizFilter === "all" || attempt.quizId === quizFilter;

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "excellent" && percent >= 80) ||
        (scoreFilter === "good" && percent >= 60 && percent < 80) ||
        (scoreFilter === "needs-work" && percent < 60);

      return matchesQuiz && matchesScore;
    });
  }, [attempts, quizFilter, scoreFilter]);

  const summary = useMemo(() => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
      };
    }

    const percents = attempts.map((attempt) =>
      attempt.totalQuestions > 0
        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
        : 0
    );

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(
        percents.reduce((sum, value) => sum + value, 0) / percents.length
      ),
      bestScore: Math.max(...percents),
    };
  }, [attempts]);

  return (
    <div className="space-y-6">
      <Header
        title="Past Quiz Results"
        description="Review your previous quiz attempts and scores."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">
              {summary.totalAttempts}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">
              {summary.averageScore}%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">
              {summary.bestScore}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <select
            value={quizFilter}
            onChange={(e) => setQuizFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All quizzes</option>
            {quizOptions.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.label}
              </option>
            ))}
          </select>

          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All scores</option>
            <option value="excellent">80% and above</option>
            <option value="good">60% to 79%</option>
            <option value="needs-work">Below 60%</option>
          </select>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Attempt History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quiz attempts found.
            </p>
          ) : (
            filteredAttempts.map((attempt) => {
              const percent =
                attempt.totalQuestions > 0
                  ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                  : 0;

              const resultTone =
                percent >= 80
                  ? "bg-emerald-100 text-emerald-700"
                  : percent >= 60
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700";

              return (
                <div
                  key={attempt.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="size-4 text-primary" />
                        <p className="font-medium">
                          Quiz {attempt.quizId.slice(0, 8)}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Score: {attempt.score}/{attempt.totalQuestions}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Attempted{" "}
                        {new Date(attempt.completedAt).toLocaleString("en-GB")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${resultTone}`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}