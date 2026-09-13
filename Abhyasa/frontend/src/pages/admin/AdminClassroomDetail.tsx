import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  BookOpen,
  BookText,
  ClipboardCheck,
  Layers,
  Mic,
  Users,
} from "lucide-react";
import type { ContentLevel } from "@/types";

type AdminSection =
  | "overview"
  | "students"
  | "grammar"
  | "stories"
  | "vocab"
  | "pronunciation"
  | "quizzes";

type AdminClassroomContent = {
  classroom: {
    id: string;
    name: string;
    code: string;
    teacherId: string;
    createdAt: string;
    studentsCount: number;
    teacher: {
      id: string;
      name: string;
      email: string;
    };
    students: Array<{
      id: string;
      name: string;
      email: string;
      joinedAt: string;
      createdAt: string;
    }>;
  };
  grammarLessons: Array<{
    id: string;
    title: string;
    content: string;
    level: ContentLevel;
    tags: string[];
    teacherId: string;
    assignedAt?: string;
  }>;
  stories: Array<{
    id: string;
    title: string;
    summary: string;
    content: string;
    level: ContentLevel;
    tags: string[];
    teacherId: string;
    assignedAt?: string;
  }>;
  vocabLists: Array<{
    id: string;
    name: string;
    description: string;
    level: ContentLevel;
    teacherId: string;
    assignedAt?: string;
    items?: Array<{
      id: string;
      word: string;
      definition: string;
      example: string;
      phonetic: string;
      level: ContentLevel;
    }>;
  }>;
  pronunciationExercises: Array<{
    id: string;
    targetText: string;
    type: "word" | "phrase" | "sentence";
    level: ContentLevel;
    instructions: string;
    teacherId: string;
    assignedAt?: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    description: string;
    level: ContentLevel;
    teacherId: string;
    assignedAt?: string;
    questions: Array<{
      id: string;
      text: string;
      explanation: string;
      options: Array<{
        id: string;
        text: string;
      }>;
    }>;
  }>;
};

function LevelBadge({ level }: { level: ContentLevel }) {
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

export default function AdminClassroomDetail() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<AdminClassroomContent | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClassroom = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError("");

        const result = await apiFetch<AdminClassroomContent>(
          `/admin/classrooms/${id}/content`
        );

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load classroom.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadClassroom();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Classroom Detail" description="Loading classroom..." />
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Loading classroom content...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header title="Classroom Detail" />
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Header title="Classroom Detail" />
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Classroom not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { classroom } = data;

  const renderSectionHeader = (title: string, description: string) => (
    <Header
      title={title}
      description={description}
      actions={
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveSection("overview")}
          >
            Back to Blocks
          </Button>
        </div>
      }
    />
  );

  const sectionCards = [
    {
      key: "students" as const,
      title: "Students",
      description: "View enrolled students",
      count: classroom.students.length,
      icon: Users,
    },
    {
      key: "grammar" as const,
      title: "Grammar",
      description: "View assigned grammar lessons",
      count: data.grammarLessons.length,
      icon: BookOpen,
    },
    {
      key: "stories" as const,
      title: "Stories",
      description: "View assigned stories",
      count: data.stories.length,
      icon: BookText,
    },
    {
      key: "vocab" as const,
      title: "Vocabulary",
      description: "View assigned vocabulary lists",
      count: data.vocabLists.length,
      icon: Layers,
    },
    {
      key: "pronunciation" as const,
      title: "Pronunciation",
      description: "View assigned speaking exercises",
      count: data.pronunciationExercises.length,
      icon: Mic,
    },
    {
      key: "quizzes" as const,
      title: "Quizzes",
      description: "View assigned quizzes",
      count: data.quizzes.length,
      icon: ClipboardCheck,
    },
  ];

  if (activeSection === "overview") {
    return (
      <div className="space-y-6">
        <Header
          title={classroom.name}
          description="Admin view of classroom content and assigned learning data."
          actions={
            <Link to="/admin/classrooms">
              <Button type="button" variant="outline" size="sm">
                Back to Classrooms
              </Button>
            </Link>
          }
        />

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Classroom Overview</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Classroom Code</p>
              <p className="mt-1 font-mono text-lg font-semibold">{classroom.code}</p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Teacher</p>
              <p className="mt-1 font-medium">{classroom.teacher.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {classroom.teacher.email}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="mt-1 font-medium">{classroom.studentsCount}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sectionCards.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className="text-left"
              >
                <Card className="h-full shadow-sm border-border/60 bg-background hover:bg-accent/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-primary/10 p-3 text-primary">
                        <Icon className="size-6" />
                      </div>

                      <div>
                        <p className="font-display text-xl font-semibold">
                          {section.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {section.description}
                        </p>
                        <p className="mt-3 text-sm font-medium">
                          {section.count} total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeSection === "students") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Students", `Students enrolled in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Students</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {classroom.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No students have joined this classroom yet.
              </p>
            ) : (
              classroom.students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {student.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {new Date(student.joinedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "grammar") {
    return (
      <div className="space-y-6">
        {renderSectionHeader(
          "Grammar",
          `Grammar lessons assigned in ${classroom.name}.`
        )}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Assigned Grammar Lessons
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.grammarLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grammar lessons assigned.
              </p>
            ) : (
              data.grammarLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{lesson.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {lesson.content}
                      </p>

                      {lesson.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lesson.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {lesson.assignedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Assigned{" "}
                          {new Date(lesson.assignedAt).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>

                    <LevelBadge level={lesson.level} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "stories") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Stories", `Stories assigned in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Assigned Stories</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.stories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stories assigned.
              </p>
            ) : (
              data.stories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{story.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {story.summary}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {story.content}
                      </p>

                      {story.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {story.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {story.assignedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Assigned{" "}
                          {new Date(story.assignedAt).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>

                    <LevelBadge level={story.level} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "vocab") {
    return (
      <div className="space-y-6">
        {renderSectionHeader(
          "Vocabulary",
          `Vocabulary lists assigned in ${classroom.name}.`
        )}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Assigned Vocabulary Lists
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.vocabLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No vocabulary lists assigned.
              </p>
            ) : (
              data.vocabLists.map((list) => (
                <div
                  key={list.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{list.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {list.description}
                      </p>

                      {list.items && list.items.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {list.items.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border border-border/60 p-3"
                            >
                              <p className="text-sm font-medium">{item.word}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.definition}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.example}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {list.assignedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Assigned{" "}
                          {new Date(list.assignedAt).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>

                    <LevelBadge level={list.level} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "pronunciation") {
    return (
      <div className="space-y-6">
        {renderSectionHeader(
          "Pronunciation",
          `Pronunciation exercises assigned in ${classroom.name}.`
        )}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Assigned Pronunciation Exercises
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.pronunciationExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pronunciation exercises assigned.
              </p>
            ) : (
              data.pronunciationExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {exercise.targetText}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {exercise.instructions}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Type: {exercise.type}
                      </p>

                      {exercise.assignedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Assigned{" "}
                          {new Date(exercise.assignedAt).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>

                    <LevelBadge level={exercise.level} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSectionHeader("Quizzes", `Quizzes assigned in ${classroom.name}.`)}

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Assigned Quizzes</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {data.quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes assigned.</p>
          ) : (
            data.quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-lg border border-border/60 p-4 bg-background"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{quiz.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quiz.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Questions: {quiz.questions.length}
                    </p>

                    {quiz.assignedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assigned{" "}
                        {new Date(quiz.assignedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>

                  <LevelBadge level={quiz.level} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}