import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClassroomStore } from "@/stores/classroomStore";
import { useProgressStore } from "@/stores/progressStore";
import {
  BookOpen,
  BookText,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  Mic,
} from "lucide-react";
import type { ContentLevel } from "@/types";

type ClassroomSection =
  | "overview"
  | "grammar"
  | "stories"
  | "vocab"
  | "pronunciation"
  | "quizzes";

type OptionalVocabListSearchShape = {
  items?: Array<{
    word?: string;
    definition?: string;
    example?: string;
    phonetic?: string;
    level?: string;
    tags?: string[];
  }>;
  vocabItems?: Array<{
    word?: string;
    definition?: string;
    example?: string;
    phonetic?: string;
    level?: string;
    tags?: string[];
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

function CompletedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="size-3.5" />
      Completed
    </span>
  );
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getContentSearchQuery(searchParams: URLSearchParams) {
  return normalizeSearchText(
    searchParams.get("q") ?? searchParams.get("search") ?? ""
  );
}

function flattenSearchFields(fields: unknown[]): string[] {
  return fields.flatMap((field) => {
    if (field === null || field === undefined) return [];

    if (Array.isArray(field)) {
      return flattenSearchFields(field);
    }

    return [normalizeSearchText(field)];
  });
}

function matchesContentSearch(query: string, fields: unknown[]) {
  if (!query) return true;

  const haystack = flattenSearchFields(fields).join(" ");

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function getOptionalVocabListSearchFields(list: unknown): string[] {
  const candidate = list as OptionalVocabListSearchShape;
  const items = candidate.items ?? candidate.vocabItems ?? [];

  return flattenSearchFields(
    items.flatMap((item) => [
      item.word,
      item.definition,
      item.example,
      item.phonetic,
      item.level,
      item.tags,
    ])
  );
}

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const contentSearchQuery = useMemo(
    () => getContentSearchQuery(searchParams),
    [searchParams]
  );

  const [activeSection, setActiveSection] = useState<ClassroomSection>("overview");
  const [grammarLevelFilter, setGrammarLevelFilter] = useState<"all" | ContentLevel>(
    "all"
  );
  const [storyLevelFilter, setStoryLevelFilter] = useState<"all" | ContentLevel>(
    "all"
  );
  const [vocabLevelFilter, setVocabLevelFilter] = useState<"all" | ContentLevel>(
    "all"
  );
  const [quizLevelFilter, setQuizLevelFilter] = useState<"all" | ContentLevel>(
    "all"
  );
  const [pronunciationLevelFilter, setPronunciationLevelFilter] = useState<
    "all" | ContentLevel
  >("all");

  const {
    selectedClassroomContent,
    isDetailLoading,
    detailError,
    fetchClassroomContent,
    clearSelectedClassroomContent,
  } = useClassroomStore();

  const { fetchMyProgress, isCompleted } = useProgressStore();

  useEffect(() => {
    if (id) {
      void fetchClassroomContent(id);
      void fetchMyProgress();
    }

    return () => {
      clearSelectedClassroomContent();
    };
  }, [id, fetchClassroomContent, clearSelectedClassroomContent, fetchMyProgress]);

  const classroom = selectedClassroomContent?.classroom;

  const levelOrder: Record<ContentLevel, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  const filteredGrammar = useMemo(() => {
    const items = selectedClassroomContent?.grammarLessons ?? [];

    const filtered = items.filter((item) => {
      const matchesLevel =
        grammarLevelFilter === "all" || item.level === grammarLevelFilter;

      const matchesSearch = matchesContentSearch(contentSearchQuery, [
        item.title,
        item.content,
        item.level,
        item.tags,
      ]);

      return matchesLevel && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];
      if (levelCompare !== 0) return levelCompare;
      return a.title.localeCompare(b.title);
    });
  }, [selectedClassroomContent, grammarLevelFilter, contentSearchQuery]);

  const filteredStories = useMemo(() => {
    const items = selectedClassroomContent?.stories ?? [];

    const filtered = items.filter((item) => {
      const matchesLevel =
        storyLevelFilter === "all" || item.level === storyLevelFilter;

      const matchesSearch = matchesContentSearch(contentSearchQuery, [
        item.title,
        item.summary,
        item.content,
        item.level,
        item.tags,
      ]);

      return matchesLevel && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];
      if (levelCompare !== 0) return levelCompare;
      return a.title.localeCompare(b.title);
    });
  }, [selectedClassroomContent, storyLevelFilter, contentSearchQuery]);

  const filteredVocabLists = useMemo(() => {
    const items = selectedClassroomContent?.vocabLists ?? [];

    const filtered = items.filter((item) => {
      const matchesLevel =
        vocabLevelFilter === "all" || item.level === vocabLevelFilter;

      const matchesSearch = matchesContentSearch(contentSearchQuery, [
        item.name,
        item.description,
        item.level,
        getOptionalVocabListSearchFields(item),
      ]);

      return matchesLevel && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];
      if (levelCompare !== 0) return levelCompare;
      return a.name.localeCompare(b.name);
    });
  }, [selectedClassroomContent, vocabLevelFilter, contentSearchQuery]);

  const filteredPronunciation = useMemo(() => {
    const items = selectedClassroomContent?.pronunciationExercises ?? [];
    const filtered =
      pronunciationLevelFilter === "all"
        ? items
        : items.filter((item) => item.level === pronunciationLevelFilter);

    return [...filtered].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];
      if (levelCompare !== 0) return levelCompare;
      return a.targetText.localeCompare(b.targetText);
    });
  }, [selectedClassroomContent, pronunciationLevelFilter]);

  const filteredQuizzes = useMemo(() => {
    const items = selectedClassroomContent?.quizzes ?? [];
    const filtered =
      quizLevelFilter === "all"
        ? items
        : items.filter((item) => item.level === quizLevelFilter);

    return [...filtered].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];
      if (levelCompare !== 0) return levelCompare;
      return a.title.localeCompare(b.title);
    });
  }, [selectedClassroomContent, quizLevelFilter]);

  if (isDetailLoading) {
    return (
      <div className="space-y-6">
        <Header title="Classroom" description="Loading classroom..." />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Loading classroom content...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="space-y-6">
        <Header title="Classroom" />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-destructive">{detailError}</CardContent>
        </Card>
      </div>
    );
  }

  if (!classroom || !id || !selectedClassroomContent) {
    return (
      <div className="space-y-6">
        <Header title="Classroom" />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Classroom not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionCards = [
    {
      key: "grammar" as const,
      title: "Grammar",
      description: "Open grammar lessons",
      count: selectedClassroomContent.grammarLessons.length,
      icon: BookOpen,
    },
    {
      key: "stories" as const,
      title: "Stories",
      description: "Read assigned stories",
      count: selectedClassroomContent.stories.length,
      icon: BookText,
    },
    {
      key: "vocab" as const,
      title: "Vocabulary",
      description: "Practice vocabulary lists",
      count: selectedClassroomContent.vocabLists.length,
      icon: Layers,
    },
    {
      key: "pronunciation" as const,
      title: "Pronunciation",
      description: "Practice speaking tasks",
      count: selectedClassroomContent.pronunciationExercises.length,
      icon: Mic,
    },
    {
      key: "quizzes" as const,
      title: "Quizzes",
      description: "Attempt quizzes and check marks",
      count: selectedClassroomContent.quizzes.length,
      icon: ClipboardCheck,
    },
  ];

  const renderSectionHeader = (title: string) => (
    <Header
      title={title}
      description={`Content assigned in ${classroom.name}.`}
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

  if (activeSection === "overview") {
    return (
      <div className="space-y-6">
        <Header
          title={classroom.name}
          description="Choose a learning block to open assigned classroom content."
        />

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Classroom Overview</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Classroom Code</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {classroom.code}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 bg-background">
              <p className="text-sm text-muted-foreground">Teacher</p>
              <p className="mt-1 font-medium">{classroom.teacher.name}</p>
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
                    <div className="flex items-start justify-between gap-4">
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
                            {section.count} assigned
                          </p>
                        </div>
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

  if (activeSection === "grammar") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Grammar Lessons")}

        <Card className="shadow-sm border-border/60">
          <CardContent className="space-y-3 pt-6">
            {selectedClassroomContent.grammarLessons.length > 0 && (
              <div className="flex justify-end">
                <select
                  value={grammarLevelFilter}
                  onChange={(e) =>
                    setGrammarLevelFilter(e.target.value as "all" | ContentLevel)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All levels</option>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            )}

            {selectedClassroomContent.grammarLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grammar lessons assigned yet.
              </p>
            ) : filteredGrammar.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grammar lessons found for this level.
              </p>
            ) : (
              filteredGrammar.map((lesson) => {
                const completed = isCompleted("grammar", lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    to={`/student/classrooms/${id}/grammar/${lesson.id}`}
                    className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{lesson.title}</p>

                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                          {lesson.content}
                        </p>

                        {completed && (
                          <div className="mt-3">
                            <CompletedBadge />
                          </div>
                        )}
                      </div>

                      <LevelBadge level={lesson.level} />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "stories") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Stories")}

        <Card className="shadow-sm border-border/60">
          <CardContent className="space-y-3 pt-6">
            {selectedClassroomContent.stories.length > 0 && (
              <div className="flex justify-end">
                <select
                  value={storyLevelFilter}
                  onChange={(e) =>
                    setStoryLevelFilter(e.target.value as "all" | ContentLevel)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All levels</option>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            )}

            {selectedClassroomContent.stories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stories assigned yet.</p>
            ) : filteredStories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stories found for this level.
              </p>
            ) : (
              filteredStories.map((story) => {
                const completed = isCompleted("story", story.id);

                return (
                  <Link
                    key={story.id}
                    to={`/student/classrooms/${id}/stories/${story.id}`}
                    className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{story.title}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {story.summary}
                        </p>

                        {completed && (
                          <div className="mt-3">
                            <CompletedBadge />
                          </div>
                        )}
                      </div>

                      <LevelBadge level={story.level} />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "vocab") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Vocabulary Lists")}

        <Card className="shadow-sm border-border/60">
          <CardContent className="space-y-3 pt-6">
            {selectedClassroomContent.vocabLists.length > 0 && (
              <div className="flex justify-end">
                <select
                  value={vocabLevelFilter}
                  onChange={(e) =>
                    setVocabLevelFilter(e.target.value as "all" | ContentLevel)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All levels</option>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            )}

            {selectedClassroomContent.vocabLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No vocabulary lists assigned yet.
              </p>
            ) : filteredVocabLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No vocabulary lists found for this level.
              </p>
            ) : (
              filteredVocabLists.map((list) => {
                const completed = isCompleted("vocab", list.id);

                return (
                  <Link
                    key={list.id}
                    to={`/student/classrooms/${id}/vocab/${list.id}`}
                    className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{list.name}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {list.description}
                        </p>

                        {completed && (
                          <div className="mt-3">
                            <CompletedBadge />
                          </div>
                        )}
                      </div>

                      <LevelBadge level={list.level} />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "pronunciation") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Pronunciation Exercises")}

        <Card className="shadow-sm border-border/60">
          <CardContent className="space-y-3 pt-6">
            {selectedClassroomContent.pronunciationExercises.length > 0 && (
              <div className="flex justify-end">
                <select
                  value={pronunciationLevelFilter}
                  onChange={(e) =>
                    setPronunciationLevelFilter(
                      e.target.value as "all" | ContentLevel
                    )
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All levels</option>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            )}

            {selectedClassroomContent.pronunciationExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pronunciation exercises assigned yet.
              </p>
            ) : filteredPronunciation.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pronunciation exercises found for this level.
              </p>
            ) : (
              filteredPronunciation.map((exercise) => {
                const completed = isCompleted("pronunciation", exercise.id);

                return (
                  <Link
                    key={exercise.id}
                    to={`/student/classrooms/${id}/pronunciation/${exercise.id}`}
                    className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {exercise.targetText}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {exercise.instructions}
                        </p>

                        {completed && (
                          <div className="mt-3">
                            <CompletedBadge />
                          </div>
                        )}
                      </div>

                      <LevelBadge level={exercise.level} />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSectionHeader("Quizzes")}

      <Card className="shadow-sm border-border/60">
        <CardContent className="space-y-3 pt-6">
          {selectedClassroomContent.quizzes.length > 0 && (
            <div className="flex justify-end">
              <select
                value={quizLevelFilter}
                onChange={(e) =>
                  setQuizLevelFilter(e.target.value as "all" | ContentLevel)
                }
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All levels</option>
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
          )}

          {selectedClassroomContent.quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes assigned yet.</p>
          ) : filteredQuizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quizzes found for this level.
            </p>
          ) : (
            filteredQuizzes.map((quiz) => {
              const completed = isCompleted("quiz", quiz.id);

              return (
                <Link
                  key={quiz.id}
                  to={`/student/classrooms/${id}/quizzes/${quiz.id}`}
                  className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{quiz.title}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {quiz.description}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Questions: {quiz.questions.length}
                      </p>

                      {completed && (
                        <div className="mt-3">
                          <CompletedBadge />
                        </div>
                      )}
                    </div>

                    <LevelBadge level={quiz.level} />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}