import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BookText,
  Languages,
  Mic,
  School,
  Users,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContentStore } from "@/stores/contentStore";
import { useClassroomStore } from "@/stores/classroomStore";
import { useProgressStore } from "@/stores/progressStore";

type TeacherQuizAttempt = {
  id: string;
  userId: string;
  userNameSnapshot: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
};

function average(values: number[]) {
  if (values.length === 0) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

export default function TeacherDashboard() {
  const {
    grammarLessons,
    stories,
    vocabItems,
    pronunciationExercises,
    initialized,
    initializeContent,
  } = useContentStore();

  const {
    teacherClassrooms,
    isLoading,
    error,
    fetchTeacherClassrooms,
    createClassroom,
  } = useClassroomStore();

  const { fetchTeacherAnalytics, teacherAnalytics } = useProgressStore();

  const [classroomName, setClassroomName] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!initialized) {
      void initializeContent();
    }
    void fetchTeacherClassrooms();
    void fetchTeacherAnalytics();
  }, [
    initialized,
    initializeContent,
    fetchTeacherClassrooms,
    fetchTeacherAnalytics,
  ]);

  const totalStudents = teacherClassrooms.reduce(
    (sum, classroom) => sum + classroom.studentsCount,
    0
  );

  const quizAttempts: TeacherQuizAttempt[] = teacherAnalytics?.quizAttempts ?? [];
  const pronunciationAttempts = teacherAnalytics?.pronunciationAttempts ?? [];
  const completions = teacherAnalytics?.completions ?? [];
// teacher analytics
  const avgQuizScore = useMemo(() => {
    if (!quizAttempts.length) return 0;
// Convert every quiz attempt into percentage and average it.
    const total = quizAttempts.reduce((sum, attempt) => {
      if (!attempt.totalQuestions) return sum;
      return sum + (attempt.score / attempt.totalQuestions) * 100;
    }, 0);

    return Math.round(total / quizAttempts.length);
  }, [quizAttempts]);

  const avgPronunciationScore = useMemo(() => {
    if (!pronunciationAttempts.length) return 0;
// Average all pronunciation match percentages.
    return average(
      pronunciationAttempts.map((attempt) => attempt.matchPercent)
    );
  }, [pronunciationAttempts]);

  const totalQuizAttempts = quizAttempts.length;
  const totalCompletions = completions.length;

  const recentAttempts = useMemo(() => {
    return [...quizAttempts]
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .slice(0, 6);
  }, [quizAttempts]);
// Students needing attention
  const studentPerformance = useMemo(() => {
    const grouped = new Map<
      string,
      {
        userId: string;
        name: string;
        attempts: number;
        avgScore: number;
      }
    >();

    for (const attempt of quizAttempts) {
      const percent =
        attempt.totalQuestions === 0
          ? 0
          : (attempt.score / attempt.totalQuestions) * 100;

      const existing = grouped.get(attempt.userId);

      if (!existing) { // First attempt for this student.
        grouped.set(attempt.userId, {
          userId: attempt.userId,
          name: attempt.userNameSnapshot,
          attempts: 1,
          avgScore: Math.round(percent),
        });
      } else { // Update average after another attempt
        const nextAttempts = existing.attempts + 1;
        const nextAvg =
          (existing.avgScore * existing.attempts + percent) / nextAttempts;

        grouped.set(attempt.userId, {
          ...existing,
          attempts: nextAttempts,
          avgScore: Math.round(nextAvg),
        });
      }
    }
// Lowest-performing students first.
    return Array.from(grouped.values()).sort((a, b) => a.avgScore - b.avgScore);
  }, [quizAttempts]);
// Students below 60% average are shown as needing attention.
  const studentsNeedingAttention = useMemo(() => {
    return studentPerformance.filter(
      (student) => student.attempts > 0 && student.avgScore < 60
    );
  }, [studentPerformance]);

  const classroomSummaries = useMemo(() => {
    return teacherClassrooms.map((classroom) => {
      const studentIds = new Set(classroom.students.map((student) => student.id));

      const classroomAttempts = quizAttempts.filter((attempt) =>
        studentIds.has(attempt.userId)
      );

      const classroomPronunciationAttempts = pronunciationAttempts.filter(
        (attempt) => studentIds.has(attempt.userId)
      );

      const classroomCompletions = completions.filter((item) =>
        studentIds.has(item.userId)
      );

      const averageScore =
        classroomAttempts.length === 0
          ? 0
          : Math.round(
              classroomAttempts.reduce((sum, attempt) => {
                if (!attempt.totalQuestions) return sum;
                return sum + (attempt.score / attempt.totalQuestions) * 100;
              }, 0) / classroomAttempts.length
            );

      return {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        studentsCount: classroom.studentsCount,
        attemptsCount: classroomAttempts.length,
        pronunciationAttemptsCount: classroomPronunciationAttempts.length,
        completionsCount: classroomCompletions.length,
        averageScore,
      };
    });
  }, [teacherClassrooms, quizAttempts, pronunciationAttempts, completions]);

  const stats = [
    {
      title: "Grammar Lessons",
      value: String(grammarLessons.length),
      icon: BookOpen,
      note: "Live lessons from database",
    },
    {
      title: "Stories",
      value: String(stories.length),
      icon: BookText,
      note: "Live stories from database",
    },
    {
      title: "Vocabulary Items",
      value: String(vocabItems.length),
      icon: Languages,
      note: "Live vocabulary from database",
    },
    {
      title: "Pronunciation",
      value: String(pronunciationExercises.length),
      icon: Mic,
      note: "Speech practice exercises",
    },
    {
      title: "Classrooms",
      value: String(teacherClassrooms.length),
      icon: School,
      note: "Classrooms you created",
    },
    {
      title: "Students Joined",
      value: String(totalStudents),
      icon: Users,
      note: "Students across your classrooms",
    },
    {
      title: "Quiz Attempts",
      value: String(totalQuizAttempts),
      icon: ClipboardCheck,
      note: "Student quiz submissions",
    },
    {
      title: "Completed Items",
      value: String(totalCompletions),
      icon: CheckCircle2,
      note: "Student completed content",
    },
    {
      title: "Avg Quiz Score",
      value: `${avgQuizScore}%`,
      icon: TrendingUp,
      note: "Student performance",
    },
    {
      title: "Avg Pronunciation",
      value: `${avgPronunciationScore}%`,
      icon: Mic,
      note: "Speech practice average",
    },
  ];

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!classroomName.trim()) {
      setFormError("Classroom name is required.");
      return;
    }

    setIsCreating(true);
    const result = await createClassroom(classroomName.trim());
    setIsCreating(false);

    if (!result.success) {
      setFormError(result.error || "Failed to create classroom.");
      return;
    }

    setClassroomName("");
    void fetchTeacherClassrooms();
  };

  return (
    <div className="space-y-6">
      <Header
        title="Teacher Dashboard"
        description="Create classrooms and monitor student performance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.title} className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{item.value}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Create Classroom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClassroom} className="space-y-3">
              <Input
                placeholder="Enter classroom name"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
              />
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Classroom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              My Classrooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isLoading ? (
              <p className="text-muted-foreground">Loading classrooms...</p>
            ) : teacherClassrooms.length === 0 ? (
              <p className="text-muted-foreground">No classrooms created yet.</p>
            ) : (
              teacherClassrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <p className="font-medium">{classroom.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Code:{" "}
                    <span className="font-mono font-semibold">
                      {classroom.code}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Students: {classroom.studentsCount}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Classroom Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classroomSummaries.length === 0 ? (
              <p className="text-muted-foreground">No classrooms available.</p>
            ) : (
              classroomSummaries.map((classroom) => (
                <div
                  key={classroom.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{classroom.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Students: {classroom.studentsCount}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Quiz Attempts: {classroom.attemptsCount}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Completed Items: {classroom.completionsCount}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pronunciation Attempts:{" "}
                        {classroom.pronunciationAttemptsCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-lg font-bold">{classroom.averageScore}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Students Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentsNeedingAttention.length === 0 ? (
              <p className="text-sm text-emerald-700">
                No major low-score alerts right now.
              </p>
            ) : (
              studentsNeedingAttention.slice(0, 6).map((student) => (
                <div
                  key={student.userId}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 text-amber-700 shrink-0" />
                    <div>
                      <Link to={`/teacher/students/${student.userId}`}>
                        <p className="font-medium text-amber-900 hover:underline cursor-pointer">
                          {student.name}
                        </p>
                      </Link>
                      <p className="mt-1 text-sm text-amber-800">
                        Average score: {student.avgScore}%
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Attempts: {student.attempts}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl">
            Recent Quiz Attempts
          </CardTitle>
          <Link to="/teacher/quiz-results">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {!recentAttempts.length ? (
            <p className="text-muted-foreground">No attempts yet.</p>
          ) : (
            recentAttempts.map((attempt) => {
              const percent = attempt.totalQuestions
                ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                : 0;

              return (
                <div
                  key={attempt.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/teacher/students/${attempt.userId}`}>
                        <p className="font-medium hover:underline cursor-pointer">
                          {attempt.userNameSnapshot}
                        </p>
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Score: {attempt.score}/{attempt.totalQuestions} ({percent}%)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(attempt.completedAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Result</p>
                      <p className="text-lg font-bold">{percent}%</p>
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