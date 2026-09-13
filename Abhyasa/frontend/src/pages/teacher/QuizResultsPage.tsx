import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgressStore } from "@/stores/progressStore";

type TeacherQuizAttempt = {
  id: string;
  quizId: string;
  quizTitle: string;
  quizLevel: "beginner" | "intermediate" | "advanced";
  userId: string;
  userNameSnapshot: string;
  userEmail: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  classrooms: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

function LevelBadge({
  level,
}: {
  level: "beginner" | "intermediate" | "advanced";
}) {
  const className =
    level === "beginner"
      ? "bg-emerald-100 text-emerald-700"
      : level === "intermediate"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {level}
    </span>
  );
}

export default function QuizResultsPage() {
  const { teacherAnalytics, fetchTeacherAnalytics } = useProgressStore();

  const [quizFilter, setQuizFilter] = useState("all");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    void fetchTeacherAnalytics();
  }, [fetchTeacherAnalytics]);

  const attempts: TeacherQuizAttempt[] = teacherAnalytics?.quizAttempts ?? [];

  const quizOptions = useMemo(() => {
    const seen = new Map<string, string>();

    for (const attempt of attempts) {
      if (!seen.has(attempt.quizId)) {
        seen.set(attempt.quizId, attempt.quizTitle);
      }
    }

    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const classroomOptions = useMemo(() => {
    const seen = new Map<string, string>();

    for (const attempt of attempts) {
      for (const classroom of attempt.classrooms) {
        if (!seen.has(classroom.id)) {
          seen.set(classroom.id, classroom.name);
        }
      }
    }

    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    const normalizedStudent = studentFilter.trim().toLowerCase();

    return attempts.filter((attempt) => {
      const matchesQuiz =
        quizFilter === "all" || attempt.quizId === quizFilter;

      const matchesClassroom =
        classroomFilter === "all" ||
        attempt.classrooms.some((item) => item.id === classroomFilter);

      const matchesStudent =
        !normalizedStudent ||
        attempt.userNameSnapshot.toLowerCase().includes(normalizedStudent) ||
        attempt.userEmail.toLowerCase().includes(normalizedStudent);

      return matchesQuiz && matchesClassroom && matchesStudent;
    });
  }, [attempts, quizFilter, classroomFilter, studentFilter]);

  const summary = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return {
        attempts: 0,
        avgScore: 0,
        bestScore: 0,
      };
    }

    const percents = filteredAttempts.map((attempt) =>
      attempt.totalQuestions > 0
        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
        : 0
    );

    return {
      attempts: filteredAttempts.length,
      avgScore: Math.round(
        percents.reduce((sum, value) => sum + value, 0) / percents.length
      ),
      bestScore: Math.max(...percents),
    };
  }, [filteredAttempts]);

  return (
    <div className="space-y-6">
      <Header
        title="Quiz Results"
        description="View student quiz attempts, marks, and classroom performance."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{summary.attempts}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{summary.avgScore}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{summary.bestScore}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <select
            value={quizFilter}
            onChange={(e) => setQuizFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All quizzes</option>
            {quizOptions.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>

          <select
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All classrooms</option>
            {classroomOptions.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>

          <input
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            placeholder="Search by student name or email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quiz attempts found for the selected filters.
            </p>
          ) : (
            filteredAttempts.map((attempt) => {
              const percent =
                attempt.totalQuestions > 0
                  ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                  : 0;

              return (
                <div
                  key={attempt.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium break-words">{attempt.quizTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        Student: {attempt.userNameSnapshot}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {attempt.userEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {attempt.score}/{attempt.totalQuestions} ({percent}%)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(attempt.completedAt).toLocaleString("en-GB")}
                      </p>

                      {attempt.classrooms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {attempt.classrooms.map((classroom) => (
                            <span
                              key={classroom.id}
                              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                            >
                              {classroom.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <LevelBadge level={attempt.quizLevel} />
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
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