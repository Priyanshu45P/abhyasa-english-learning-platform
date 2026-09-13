import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useClassroomStore } from "@/stores/classroomStore";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle2, Volume2 } from "lucide-react";
import type { ContentLevel } from "@/types";

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

// This function reads the vocabulary word and example sentence aloud.
function speakWord(word: string, example: string) {
  // Check if this browser can convert text into speech.
  if (!("speechSynthesis" in window)) {
    alert("Speech is not supported in this browser.");
    return;
  }

  // Stop any old speech before starting a new one.
  window.speechSynthesis.cancel();

  // Convert the vocabulary word into speech.
  const wordUtterance = new SpeechSynthesisUtterance(word);
  wordUtterance.lang = "en-US";
  wordUtterance.rate = 0.85;
  wordUtterance.pitch = 1;

  // Convert the example sentence into speech.
  const exampleUtterance = new SpeechSynthesisUtterance(example);
  exampleUtterance.lang = "en-US";
  exampleUtterance.rate = 0.9;
  exampleUtterance.pitch = 1;

  // After the word finishes, read the example sentence.
  wordUtterance.onend = () => {
    setTimeout(() => {
      window.speechSynthesis.speak(exampleUtterance);
    }, 400);
  };

  // Start by speaking the word.
  window.speechSynthesis.speak(wordUtterance);
}

export default function VocabDetail() {
  const { classroomId, id } = useParams<{ classroomId: string; id: string }>();

  const {
    selectedClassroomContent,
    isDetailLoading,
    detailError,
    fetchClassroomContent,
    clearSelectedClassroomContent,
  } = useClassroomStore();

  const { vocabItems, initialized, initializeContent, fetchVocabItems } =
    useContentStore();

  const { fetchMyProgress, markComplete, isCompleted } = useProgressStore();

  useEffect(() => {
    if (classroomId) {
      void fetchClassroomContent(classroomId);
    }

    void fetchMyProgress();

    return () => {
      clearSelectedClassroomContent();

      // Stop speech when the user leaves this page.
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    classroomId,
    fetchClassroomContent,
    clearSelectedClassroomContent,
    fetchMyProgress,
  ]);

  useEffect(() => {
    if (!initialized) {
      void initializeContent();
    } else {
      void fetchVocabItems();
    }
  }, [initialized, initializeContent, fetchVocabItems]);

  const vocabList = selectedClassroomContent?.vocabLists.find(
    (list) => list.id === id
  );

  const items = vocabItems.filter((item) => item.listId === id);
  const finished = id ? isCompleted("vocab", id) : false;

  const backTo = classroomId
    ? `/student/classrooms/${classroomId}`
    : "/student/dashboard";

  const handleFinish = async () => {
    if (!id) return;

    await markComplete("vocab", id);
  };

  if (isDetailLoading) {
    return (
      <div className="space-y-6">
        <Header title="Vocabulary" description="Loading vocabulary..." />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Loading vocabulary...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="space-y-6">
        <Header title="Vocabulary" />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-destructive">{detailError}</CardContent>
        </Card>
      </div>
    );
  }

  if (!vocabList || !classroomId || !id) {
    return (
      <div className="space-y-6">
        <Header title="Vocabulary" />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Vocabulary list not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title={vocabList.name}
        description={vocabList.description}
        actions={
          <Link to={backTo}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-xl">Vocabulary List</CardTitle>

            <div className="flex items-center gap-2">
              <LevelBadge level={vocabList.level} />

              {finished && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="size-4" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{vocabList.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">Words: {items.length}</p>

          <div className="mt-4">
            {!finished ? (
              <Button onClick={handleFinish}>
                <CheckCircle2 className="size-4 mr-2" />
                Finish Vocabulary
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Vocabulary completed
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            No vocabulary items found in this list.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="shadow-sm border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      <h3 className="text-lg font-semibold">{item.word}</h3>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Volume2 className="size-4" />
                      <span className="font-mono">{item.phonetic}</span>
                    </div>

                    <p className="mt-3 text-sm">
                      <span className="font-medium">Meaning:</span>{" "}
                      {item.definition}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground italic">
                      Example: {item.example}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <LevelBadge level={item.level} />

                    <Button // Speaker button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => speakWord(item.word, item.example)}
                    >
                      <Volume2 className="size-4 mr-2" />
                      Speak
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}