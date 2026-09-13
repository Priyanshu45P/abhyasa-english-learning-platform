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
  GraduationCap,
  Languages,
  Mic,
  School,
  Search,
  Users,
} from "lucide-react";

type TeacherAnalyticsItem = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  classroomsCount: number;
  studentsCount: number;
  grammarCount: number;
  storiesCount: number;
  vocabListsCount: number;
  pronunciationCount: number;
  quizzesCount: number;
  quizAttemptsCount: number;
  averageQuizScore: number;
  classrooms: Array<{
    id: string;
    name: string;
    code: string;
    createdAt: string;
    studentsCount: number;
    assignedContentCount: number;
  }>;
};

export default function AdminTeacherAnalytics() {
  const [teachers, setTeachers] = useState<TeacherAnalyticsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await apiFetch<TeacherAnalyticsItem[]>(
          "/admin/teacher-analytics"
        );

        setTeachers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load teacher analytics."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return teachers;

    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query)
    );
  }, [teachers, searchTerm]);

  const totals = useMemo(
    () => ({
      teachers: teachers.length,
      classrooms: teachers.reduce((sum, item) => sum + item.classroomsCount, 0),
      students: teachers.reduce((sum, item) => sum + item.studentsCount, 0),
      quizzes: teachers.reduce((sum, item) => sum + item.quizzesCount, 0),
      attempts: teachers.reduce((sum, item) => sum + item.quizAttemptsCount, 0),
    }),
    [teachers]
  );

  return (
    <div className="space-y-6">
      <Header
        title="Teacher Analytics"
        description="Analyze teacher classrooms, assigned content, students, and quiz performance."
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
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totals.teachers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
            <School className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totals.classrooms}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totals.students}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <ClipboardCheck className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totals.quizzes}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <BarChart3 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totals.attempts}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="font-display text-xl">Teachers</CardTitle>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teacher name or email"
                className="pl-9 sm:w-72"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading teacher analytics...
            </p>
          ) : filteredTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers found.</p>
          ) : (
            filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-lg border border-border/60 p-4 bg-background"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{teacher.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {teacher.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joined {new Date(teacher.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[720px]">
                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Classrooms</p>
                      <p className="mt-1 font-semibold">{teacher.classroomsCount}</p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="mt-1 font-semibold">{teacher.studentsCount}</p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Quiz Attempts</p>
                      <p className="mt-1 font-semibold">
                        {teacher.quizAttemptsCount}
                      </p>
                    </div>

                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                      <p className="mt-1 font-semibold">
                        {teacher.averageQuizScore}%
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
                    <p className="mt-1 font-semibold">{teacher.grammarCount}</p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookText className="size-4 text-primary" />
                      Stories
                    </div>
                    <p className="mt-1 font-semibold">{teacher.storiesCount}</p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Languages className="size-4 text-primary" />
                      Vocab
                    </div>
                    <p className="mt-1 font-semibold">{teacher.vocabListsCount}</p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className="size-4 text-primary" />
                      Pronunciation
                    </div>
                    <p className="mt-1 font-semibold">
                      {teacher.pronunciationCount}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ClipboardCheck className="size-4 text-primary" />
                      Quizzes
                    </div>
                    <p className="mt-1 font-semibold">{teacher.quizzesCount}</p>
                  </div>
                </div>

                {teacher.classrooms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Classrooms</p>

                    {teacher.classrooms.map((classroom) => (
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
                            Students: {classroom.studentsCount} · Assigned Content:{" "}
                            {classroom.assignedContentCount}
                          </div>
                        </div>
                      </Link>
                    ))}
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