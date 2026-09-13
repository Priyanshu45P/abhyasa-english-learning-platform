import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgressStore } from "@/stores/progressStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function StudentAnalytics() {
  const { studentId } = useParams();

  const { selectedStudentAnalytics, fetchStudentDetails } = useProgressStore();

  useEffect(() => {
    if (studentId) fetchStudentDetails(studentId);
  }, [studentId]);

  const attempts = selectedStudentAnalytics?.quizAttempts ?? [];

  const summary = useMemo(() => {
    if (!attempts.length) return { avg: 0, best: 0, total: 0 };
// Convert attempts into percentage scores.
    const percents = attempts.map(
      (a: any) => (a.score / a.totalQuestions) * 100
    );

    return {
      total: attempts.length,
      avg: Math.round(
        percents.reduce((s: number, v: number) => s + v, 0) / percents.length
      ),
      best: Math.max(...percents),
    };
  }, [attempts]);
// Data for line graph.
  const trend = useMemo(() => {
    return attempts.map((a: any) => ({
      date: new Date(a.completedAt).toLocaleDateString(),
      score: Math.round((a.score / a.totalQuestions) * 100),
    }));
  }, [attempts]);

  return (
    <div className="space-y-6">
      <Header title="Student Performance" description="Detailed analytics" />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.avg}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.best}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attempts.map((a: any) => (
            <div key={a.id} className="border p-3 rounded">
              <p className="font-medium">
                Score: {a.score}/{a.totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(a.completedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}