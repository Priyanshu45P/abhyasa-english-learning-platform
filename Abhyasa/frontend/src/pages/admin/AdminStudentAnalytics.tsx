import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  BookText,
  ClipboardCheck,
  Languages,
  Mic,
  School,
  Search,
  Users,
} from "lucide-react";

type StudentAnalyticsItem = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  classroomsCount: number;
  completedCount: number;
  quizAttemptsCount: number;
  pronunciationAttemptsCount: number;
  averageQuizScore: number;
  averagePronunciationScore: number;
  lastActivityAt: string | null;
  completedByType: {
    grammar: number;
    story: number;
    vocab: number;
    pronunciation: number;
    quiz: number;
  };
  classrooms: Array<{
    id: string;
    name: string;
    code: string;
    joinedAt: string;
    teacher: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  recentQuizAttempts: Array<{
    id: string;
    quizId: string;
    quizTitle: string;
    quizLevel: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    completedAt: string;
  }>;
  recentPronunciationAttempts: Array<{
    id: string;
    exerciseId: string;
    targetText: string;
    level: string;
    type: string;
    score: "exact" | "close" | "mismatch";
    matchPercent: number;
    timestamp: string;
  }>;
};

export default function AdminStudentAnalytics() {
  const [students, setStudents] = useState<StudentAnalyticsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await apiFetch<StudentAnalyticsItem[]>(
          "/admin/student-analytics"
        );

        setStudents(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load student analytics."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [students, searchTerm]);

  const totals = useMemo(
    () => ({
      students: students.length,
      classrooms: students.reduce((sum, item) => sum + item.classroomsCount, 0),
      completions: students.reduce((sum, item) => sum + item.completedCount, 0),
      quizAttempts: students.reduce(
        (sum, item) => sum + item.quizAttemptsCount,
        0
      ),
      pronunciationAttempts: students.reduce(
        (sum, item) => sum + item.pronunciationAttemptsCount,
        0
      ),
    }),
    [students]
  );

  return (
    <div className="space-y-6">
      <Header
        title="Student Analytics"
        description="View global student progress, quiz performance, pronunciation attempts, and classroom activity."
        actions={
          <Link to="/admin/dashboard">
            <Button type="button" variant="outline" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {totals.students}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Classroom Joins</CardTitle>
            <School className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {totals.classrooms}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <BarChart3 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {totals.completions}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <ClipboardCheck className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {totals.quizAttempts}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Speech Attempts</CardTitle>
            <Mic className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {totals.pronunciationAttempts}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="font-display text-xl">Students</CardTitle>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student name or email"
                className="pl-9 sm:w-72"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading student analytics...
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="rounded-lg border border-border/60 p-4 bg-background"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{student.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joined{" "}
                      {new Date(student.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last Activity:{" "}
                      {student.lastActivityAt
                        ? new Date(student.lastActivityAt).toLocaleDateString("en-GB")
                        : "No activity yet"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[720px]">
                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Classrooms</p>
                      <p className="mt-1 font-semibold">
                        {student.classroomsCount}
                      </p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="mt-1 font-semibold">
                        {student.completedCount}
                      </p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Avg Quiz</p>
                      <p className="mt-1 font-semibold">
                        {student.averageQuizScore}%
                      </p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Avg Speech</p>
                      <p className="mt-1 font-semibold">
                        {student.averagePronunciationScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="size-4 text-primary" />
                      Grammar
                    </div>
                    <p className="mt-1 font-semibold">
                      {student.completedByType.grammar}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookText className="size-4 text-primary" />
                      Stories
                    </div>
                    <p className="mt-1 font-semibold">
                      {student.completedByType.story}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Languages className="size-4 text-primary" />
                      Vocab
                    </div>
                    <p className="mt-1 font-semibold">
                      {student.completedByType.vocab}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className="size-4 text-primary" />
                      Pronunciation
                    </div>
                    <p className="mt-1 font-semibold">
                      {student.completedByType.pronunciation}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ClipboardCheck className="size-4 text-primary" />
                      Quiz
                    </div>
                    <p className="mt-1 font-semibold">
                      {student.completedByType.quiz}
                    </p>
                  </div>
                </div>

                {student.classrooms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Classrooms</p>

                    {student.classrooms.map((classroom) => (
                      <Link
                        key={classroom.id}
                        to={`/admin/classrooms/${classroom.id}`}
                        className="block rounded-md border border-border/60 p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{classroom.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Code:{" "}
                              <span className="font-mono">{classroom.code}</span>
                            </p>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Teacher: {classroom.teacher.name} · Joined{" "}
                            {new Date(classroom.joinedAt).toLocaleDateString("en-GB")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {(student.recentQuizAttempts.length > 0 ||
                  student.recentPronunciationAttempts.length > 0) && (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Quiz Attempts</p>

                      {student.recentQuizAttempts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No quiz attempts yet.
                        </p>
                      ) : (
                        student.recentQuizAttempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className="rounded-md border border-border/60 p-3"
                          >
                            <p className="text-sm font-medium">
                              {attempt.quizTitle}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Score: {attempt.score}/{attempt.totalQuestions} (
                              {attempt.percentage}%)
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(attempt.completedAt).toLocaleDateString(
                                "en-GB"
                              )}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Recent Pronunciation Attempts
                      </p>

                      {student.recentPronunciationAttempts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No pronunciation attempts yet.
                        </p>
                      ) : (
                        student.recentPronunciationAttempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className="rounded-md border border-border/60 p-3"
                          >
                            <p className="text-sm font-medium">
                              {attempt.targetText}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Score: {attempt.score} · Match:{" "}
                              {Math.round(attempt.matchPercent)}%
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(attempt.timestamp).toLocaleDateString(
                                "en-GB"
                              )}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}