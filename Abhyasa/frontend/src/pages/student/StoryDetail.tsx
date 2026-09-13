import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/stores/authStore";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle2, Languages } from "lucide-react";

export default function StoryDetail() {
  const { id, classroomId } = useParams<{
    id: string;
    classroomId?: string;
  }>();

  const currentUser = useAuthStore((s) => s.currentUser);
  const { stories, grammarLessons, vocabItems } = useContentStore();
  const { fetchMyProgress, markComplete, isCompleted } = useProgressStore();

  const [selectedVocab, setSelectedVocab] = useState<string | null>(null);

  useEffect(() => {
    void fetchMyProgress();
  }, [fetchMyProgress]);

  const story = stories.find((item) => item.id === id);

  if (!story) {
    return <div className="p-8 text-muted-foreground">Story not found.</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-muted-foreground">Please log in again.</div>;
  }

  const finished = isCompleted("story", story.id);

  const linkedGrammar = grammarLessons.filter((item) =>
    story.grammarRefs.includes(item.id)
  );

  const linkedVocab = story.vocabRefs
    .map((ref) => {
      const item = vocabItems.find((vocab) => vocab.id === ref.vocabItemId);
      return item ? { ...ref, item } : null;
    })
    .filter(Boolean) as Array<{
    vocabItemId: string;
    highlightText: string;
    item: {
      id: string;
      word: string;
      definition: string;
      example: string;
      phonetic: string;
      listId: string;
      level: "beginner" | "intermediate" | "advanced";
      teacherId: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;

  const highlightedContent = useMemo(() => {
    let text = story.content;

    story.vocabRefs
      .filter((ref) => ref.highlightText)
      .forEach((ref) => {
        const escaped = ref.highlightText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
        text = text.replace(
          regex,
          `<mark data-vocab="${ref.vocabItemId}" class="bg-amber-100 text-amber-900 px-0.5 rounded cursor-pointer hover:bg-amber-200 transition-colors">$1</mark>`
        );
      });

    return text.replace(/\n/g, "<br />");
  }, [story]);

  const selectedItem = selectedVocab
    ? vocabItems.find((item) => item.id === selectedVocab)
    : null;

  const backTo = classroomId
    ? `/student/classrooms/${classroomId}`
    : "/student/dashboard";

  const grammarLinkFor = (grammarId: string) =>
    classroomId
      ? `/student/classrooms/${classroomId}/grammar/${grammarId}`
      : `/student/grammar/${grammarId}`;

  const handleStoryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "MARK") {
      const vocabId = target.getAttribute("data-vocab");
      if (vocabId) {
        setSelectedVocab((prev) => (prev === vocabId ? null : vocabId));
      }
    }
  };

  const handleFinish = async () => {
    await markComplete("story", story.id);
  };

  return (
    <div>
      <Header
        title={story.title}
        description={story.summary}
        actions={
          <Link to={backTo}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
               

                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[11px] rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}

                {finished && (
                  <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Completed
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div
                className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-line"
                onClick={handleStoryClick}
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />

              {selectedItem && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Languages className="size-4 text-amber-600" />
                    <span className="font-display font-semibold">{selectedItem.word}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {selectedItem.phonetic}
                    </span>
                  </div>
                  <p className="text-sm">{selectedItem.definition}</p>
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    "{selectedItem.example}"
                  </p>
                </div>
              )}

              <div className="mt-6">
                {!finished ? (
                  <Button onClick={handleFinish}>
                    <CheckCircle2 className="size-4 mr-2" />
                    Finish Story
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Story completed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          {linkedGrammar.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <BookOpen className="size-4 text-emerald-600" />
                  Linked Grammar
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {linkedGrammar.map((grammar) => (
                  <Link
                    key={grammar.id}
                    to={grammarLinkFor(grammar.id)}
                    className="block rounded-lg border p-2.5 hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{grammar.title}</p>
                  
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {linkedVocab.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Languages className="size-4 text-violet-600" />
                  Vocabulary in this Story
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                {linkedVocab.map((vocab) => (
                  <button
                    key={vocab.vocabItemId}
                    onClick={() =>
                      setSelectedVocab((prev) =>
                        prev === vocab.vocabItemId ? null : vocab.vocabItemId
                      )
                    }
                    className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                      selectedVocab === vocab.vocabItemId
                        ? "bg-amber-100 text-amber-900"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{vocab.item.word}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {vocab.item.phonetic}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <p className="px-1 text-xs text-muted-foreground">
            Tap highlighted words in the story to see their meanings.
          </p>
        </div>
      </div>
    </div>
  );
}