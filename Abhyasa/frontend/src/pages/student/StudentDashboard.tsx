import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClassroomStore } from "@/stores/classroomStore";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import {
  BookOpen,
  BookText,
  Mic,
  ClipboardCheck,
  Languages,
  School,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

function getQuizPercent(attempt: { score: number; totalQuestions: number }) {
  if (attempt.totalQuestions === 0) return 0;

  return Math.round((attempt.score / attempt.totalQuestions) * 100);
}

function getTrendLabel(delta: number) {
  if (delta > 5) return `Improving +${delta}%`;
  if (delta < -5) return `Dropping ${Math.abs(delta)}%`;

  return "Stable";
}

export default function StudentDashboard() {
  const [classroomCode, setClassroomCode] = useState("");

  const {
    initialized,
    initializeContent,
    grammarLessons,
    stories,
    pronunciationExercises,
    quizzes,
    vocabLists,
  } = useContentStore();

  const {
    studentClassrooms,
    isLoading: isClassroomLoading,
    error,
    fetchStudentClassrooms,
    joinClassroom,
  } = useClassroomStore();

  const {
    fetchMyProgress,
    fetchStudentAnalytics,
    getCompletedCountByType,
    getTotalCompletedCount,
    studentAnalytics,
  } = useProgressStore();

  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!initialized) {
      void initializeContent();
    }

    void fetchStudentClassrooms();
    void fetchMyProgress();
    void fetchStudentAnalytics();
  }, [
    initialized,
    initializeContent,
    fetchStudentClassrooms,
    fetchMyProgress,
    fetchStudentAnalytics,
  ]);

  const stats = useMemo(
    () => [
      {
        title: "Grammar",
        value: grammarLessons.length,
        completed: getCompletedCountByType("grammar"),
        icon: BookOpen,
      },
      {
        title: "Stories",
        value: stories.length,
        completed: getCompletedCountByType("story"),
        icon: BookText,
      },
      {
        title: "Vocabulary",
        value: vocabLists.length,
        completed: getCompletedCountByType("vocab"),
        icon: Languages,
      },
      {
        title: "Quizzes",
        value: quizzes.length,
        completed: getCompletedCountByType("quiz"),
        icon: ClipboardCheck,
      },
      {
        title: "Pronunciation",
        value: pronunciationExercises.length,
        completed: getCompletedCountByType("pronunciation"),
        icon: Mic,
      },
    ],
    [
      grammarLessons.length,
      stories.length,
      vocabLists.length,
      quizzes.length,
      pronunciationExercises.length,
      getCompletedCountByType,
    ]
  );

  const handleJoinClassroom = async () => {
    const trimmedCode = classroomCode.trim().toUpperCase();

    if (!trimmedCode) {
      setJoinError("Please enter a classroom code.");
      return;
    }

    setJoinError("");
    setIsJoining(true);

    const result = await joinClassroom(trimmedCode);

    setIsJoining(false);

    if (!result.success) {
      setJoinError(result.error ?? "Unable to join classroom.");
      return;
    }

    setClassroomCode("");
    await fetchStudentClassrooms();
  };

  const avgQuizScore = useMemo(() => {
    if (!studentAnalytics?.quizAttempts?.length) return 0;

    const total = studentAnalytics.quizAttempts.reduce((sum, attempt) => {
      if (attempt.totalQuestions === 0) return sum;
      return sum + (attempt.score / attempt.totalQuestions) * 100;
    }, 0);

    return Math.round(total / studentAnalytics.quizAttempts.length);
  }, [studentAnalytics]);

  const avgPronunciationScore = useMemo(() => {
    if (!studentAnalytics?.pronunciationAttempts?.length) return 0;

    const total = studentAnalytics.pronunciationAttempts.reduce(
      (sum, attempt) => sum + attempt.matchPercent,
      0
    );

    return Math.round(total / studentAnalytics.pronunciationAttempts.length);
  }, [studentAnalytics]);

  const totalAvailableContent = useMemo(() => {
    return (
      grammarLessons.length +
      stories.length +
      vocabLists.length +
      quizzes.length +
      pronunciationExercises.length
    );
  }, [
    grammarLessons.length,
    stories.length,
    vocabLists.length,
    quizzes.length,
    pronunciationExercises.length,
  ]);

  const completionRate = useMemo(() => {
    if (totalAvailableContent === 0) return 0;

    return Math.min(
      100,
      Math.round((getTotalCompletedCount() / totalAvailableContent) * 100)
    );
  }, [getTotalCompletedCount, totalAvailableContent]);

  const quizTrend = useMemo(() => {
    const attempts = [...(studentAnalytics?.quizAttempts ?? [])]
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      )
      .map(getQuizPercent);

    if (attempts.length < 2) {
      return {
        current: avgQuizScore,
        delta: 0,
        label: "Need 2+ attempts",
      };
    }

    const current = attempts[attempts.length - 1];
    const previous = attempts[attempts.length - 2];
    const delta = current - previous;

    return {
      current,
      delta,
      label: getTrendLabel(delta),
    };
  }, [studentAnalytics, avgQuizScore]);

  const pronunciationTrend = useMemo(() => {
    const attempts = [...(studentAnalytics?.pronunciationAttempts ?? [])]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .map((attempt) => attempt.matchPercent);

    if (attempts.length < 2) {
      return {
        current: avgPronunciationScore,
        delta: 0,
        label: "Need 2+ attempts",
      };
    }

    const current = attempts[attempts.length - 1];
    const previous = attempts[attempts.length - 2];
    const delta = current - previous;

    return {
      current,
      delta,
      label: getTrendLabel(delta),
    };
  }, [studentAnalytics, avgPronunciationScore]);

  const weakAreas = useMemo(() => {
    const items: string[] = [];

    if (studentAnalytics?.quizAttempts?.length && avgQuizScore < 60) {
      items.push("Quiz performance needs more practice.");
    }

    if (
      studentAnalytics?.pronunciationAttempts?.length &&
      avgPronunciationScore < 60
    ) {
      items.push("Pronunciation needs more practice.");
    }

    if (getCompletedCountByType("grammar") === 0 && grammarLessons.length > 0) {
      items.push("You have not completed any grammar lessons yet.");
    }

    if (getCompletedCountByType("story") === 0 && stories.length > 0) {
      items.push("You have not completed any stories yet.");
    }

    if (totalAvailableContent > 0 && completionRate < 50) {
      items.push("Overall completion is below 50%. Continue with assigned lessons.");
    }

    if (quizTrend.delta < -5) {
      items.push("Your latest quiz score dropped compared with the previous attempt.");
    }

    if (pronunciationTrend.delta < -5) {
      items.push(
        "Your latest pronunciation result dropped compared with the previous attempt."
      );
    }

    return items;
  }, [
    studentAnalytics,
    avgQuizScore,
    avgPronunciationScore,
    getCompletedCountByType,
    grammarLessons.length,
    stories.length,
    totalAvailableContent,
    completionRate,
    quizTrend.delta,
    pronunciationTrend.delta,
  ]);

  const recentActivities = useMemo(() => {
    const completionActivities =
      studentAnalytics?.completions?.map((item) => ({
        id: `completion-${item.id}`,
        type: "completion",
        label: `Completed ${item.contentType}`,
        date: item.updatedAt,
      })) ?? [];

    const quizActivities =
      studentAnalytics?.quizAttempts?.map((item) => ({
        id: `quiz-${item.id}`,
        type: "quiz",
        label: `Quiz score: ${item.score}/${item.totalQuestions}`,
        date: item.completedAt,
      })) ?? [];

    const pronunciationActivities =
      studentAnalytics?.pronunciationAttempts?.map((item) => ({
        id: `pronunciation-${item.id}`,
        type: "pronunciation",
        label: `Pronunciation: ${item.matchPercent}%`,
        date: item.timestamp,
      })) ?? [];

    return [...completionActivities, ...quizActivities, ...pronunciationActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [studentAnalytics]);

  return (
    <div className="space-y-6">
      <Header
        title="Student Dashboard"
        description="Track your learning progress and performance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className="shadow-sm border-border/60">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{stat.title}</CardTitle>
                <Icon className="size-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">
                  {stat.completed}/{stat.value}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completed content
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <TrendingUp className="size-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Total Completed</p>
              <p className="mt-1 text-2xl font-bold">{getTotalCompletedCount()}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Average Quiz Score</p>
                <p className="mt-1 text-xl font-bold">{avgQuizScore}%</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Average Pronunciation</p>
                <p className="mt-1 text-xl font-bold">{avgPronunciationScore}%</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Quiz Attempts</p>
                <p className="mt-1 text-xl font-bold">
                  {studentAnalytics?.quizAttempts?.length ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Pronunciation Attempts</p>
                <p className="mt-1 text-xl font-bold">
                  {studentAnalytics?.pronunciationAttempts?.length ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="mt-1 text-xl font-bold">{completionRate}%</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Quiz Trend</p>
                <p className="mt-1 text-xl font-bold">{quizTrend.current}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {quizTrend.label}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background">
                <p className="text-sm text-muted-foreground">Pronunciation Trend</p>
                <p className="mt-1 text-xl font-bold">
                  {pronunciationTrend.current}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pronunciationTrend.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Join Classroom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              id="classroom-code"
              name="classroomCode"
              value={classroomCode}
              onChange={(e) => setClassroomCode(e.target.value)}
              placeholder="Enter classroom code"
              className="font-mono uppercase"
              autoComplete="off"
            />

            {joinError && <p className="text-sm text-destructive">{joinError}</p>}
            {error && !joinError && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button onClick={handleJoinClassroom} disabled={isJoining}>
              {isJoining ? "Joining..." : "Join Classroom"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <CheckCircle2 className="size-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity yet.
              </p>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-border/60 p-3 bg-background"
                >
                  <p className="font-medium">{activity.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleString("en-GB")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Weak Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakAreas.length === 0 ? (
              <p className="text-sm text-emerald-700">
                You are doing well. No major weak areas detected.
              </p>
            ) : (
              weakAreas.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  {item}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl">My Classrooms</CardTitle>
          <Link to="/student/classrooms">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {isClassroomLoading ? (
            <p className="text-sm text-muted-foreground">Loading classrooms...</p>
          ) : studentClassrooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center">
              <School className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">No classrooms joined yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use a classroom code to join and access learning content.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentClassrooms.map((c) => (
                <Link
                  key={c.id}
                  to={`/student/classrooms/${c.id}`}
                  className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Code: <span className="font-mono">{c.code}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Teacher: {c.teacher.name}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}