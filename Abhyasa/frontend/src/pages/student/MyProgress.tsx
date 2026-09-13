import { useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import { CheckCircle2, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c", "#dc2626"];

export default function MyProgress() {
  const {
    grammarLessons,
    stories,
    vocabLists,
    pronunciationExercises,
    quizzes,
    initializeContent,
    initialized,
  } = useContentStore();

  const {
    fetchMyProgress,
    fetchStudentAnalytics,
    getCompletedCountByType,
    studentAnalytics,
  } = useProgressStore();
// Load all content if not already loaded.
  useEffect(() => {
    if (!initialized) {
      void initializeContent();
    }
    void fetchMyProgress(); // Load student's completed content.
    void fetchStudentAnalytics(); // Load quiz attempts and pronunciation attempts.
  }, [initialized, initializeContent, fetchMyProgress, fetchStudentAnalytics]);

  const completionRows = useMemo(
    () => [
      {
        key: "grammar",
        label: "Grammar",
        completed: getCompletedCountByType("grammar"),
        total: grammarLessons.length,
        color: "#16a34a",
      },
      {
        key: "story",
        label: "Story",
        completed: getCompletedCountByType("story"),
        total: stories.length,
        color: "#2563eb",
      },
      {
        key: "vocab",
        label: "Vocab",
        completed: getCompletedCountByType("vocab"),
        total: vocabLists.length,
        color: "#7c3aed",
      },
      {
        key: "pronunciation",
        label: "Pronunciation",
        completed: getCompletedCountByType("pronunciation"),
        total: pronunciationExercises.length,
        color: "#ea580c",
      },
      {
        key: "quiz",
        label: "Quiz",
        completed: getCompletedCountByType("quiz"),
        total: quizzes.length,
        color: "#e11d48",
      },
    ],
    [
      getCompletedCountByType,
      grammarLessons.length,
      stories.length,
      vocabLists.length,
      pronunciationExercises.length,
      quizzes.length,
    ]
  );

  const totalCompleted = useMemo(
    () => completionRows.reduce((sum, item) => sum + item.completed, 0),
    [completionRows]
  );

  const totalItems = useMemo(
    () => completionRows.reduce((sum, item) => sum + item.total, 0),
    [completionRows]
  );

  const completionData = useMemo(
    () =>
      completionRows.map((item) => ({
        name: item.label,
        value: item.completed,
      })),
    [completionRows]
  );

  const chartData = useMemo(
    () =>
      completionRows
        .filter((item) => item.completed > 0)
        .map((item) => ({
          name: item.label,
          value: item.completed,
          color: item.color,
        })),
    [completionRows]
  );

  const quizTrend = useMemo(() => {
    return (
      studentAnalytics?.quizAttempts.map((a) => ({
        date: new Date(a.completedAt).toLocaleDateString(),
        score:
          a.totalQuestions > 0
            ? Math.round((a.score / a.totalQuestions) * 100)
            : 0,
      })) || []
    );
  }, [studentAnalytics]);
// pronunciation Trend Graph
  const pronunciationTrend = useMemo(() => {
    return (
      studentAnalytics?.pronunciationAttempts.map((a) => ({
        date: new Date(a.timestamp).toLocaleDateString(), // X-axis date.
        score: a.matchPercent, // Y-axis pronunciation match percentage.
      })) || []
    );
  }, [studentAnalytics]);

  const recentQuizAttempts = studentAnalytics?.quizAttempts.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <Header title="My Progress" description="Track your learning journey" />

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Completion Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            {totalCompleted} of {totalItems} items completed
          </p>

          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartData.length
                        ? chartData
                        : [{ name: "No data", value: 1, color: "#e5e7eb" }]
                    }
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={76}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {(chartData.length
                      ? chartData
                      : [{ name: "No data", value: 1, color: "#e5e7eb" }]
                    ).map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {completionRows.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-[110px] text-base text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-base font-medium">
                    {item.completed}/{item.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Quiz Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quizTrend}> // Quiz Score Trend line chart.
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Pronunciation Trend</CardTitle> 
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pronunciationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#ea580c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Completion by Type</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {completionRows.map((item, index) => (
                  <Cell key={item.key} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQuizAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            recentQuizAttempts.map((a) => (
              <div key={a.id} className="flex justify-between border-b py-2 last:border-b-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 size-4" />
                  Quiz Attempt
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(a.completedAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}