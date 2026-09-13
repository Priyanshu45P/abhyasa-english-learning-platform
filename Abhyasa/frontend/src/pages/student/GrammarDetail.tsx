import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/stores/authStore";
import { useContentStore } from "@/stores/contentStore";
import { useProgressStore } from "@/stores/progressStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookText, CheckCircle2 } from "lucide-react";

export default function GrammarDetail() {
  const { id, classroomId } = useParams<{
    id: string;
    classroomId?: string;
  }>();

  const currentUser = useAuthStore((s) => s.currentUser);
  const { grammarLessons, stories } = useContentStore();
  const { fetchMyProgress, markComplete, isCompleted } = useProgressStore();

  useEffect(() => {
    void fetchMyProgress();
  }, [fetchMyProgress]);

  const lesson = grammarLessons.find((item) => item.id === id);

  if (!lesson) {
    return <div className="p-8 text-muted-foreground">Grammar lesson not found.</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-muted-foreground">Please log in again.</div>;
  }

  const finished = isCompleted("grammar", lesson.id);

  const linkedStories = stories.filter((story) => story.grammarRefs.includes(lesson.id));

  const backTo = classroomId
    ? `/student/classrooms/${classroomId}`
    : "/student/dashboard";

  const storyLinkFor = (storyId: string) =>
    classroomId
      ? `/student/classrooms/${classroomId}/stories/${storyId}`
      : `/student/stories/${storyId}`;

  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br />");
  };

  const handleFinish = async () => {
    await markComplete("grammar", lesson.id);
  };

  return (
    <div>
      <Header
        title={lesson.title}
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
                <span className="px-2.5 py-1 text-xs rounded-full bg-secondary text-secondary-foreground capitalize">
                  {lesson.level}
                </span>

                {lesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs rounded-full bg-muted text-muted-foreground"
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
                className="prose prose-sm max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(lesson.content) }}
              />

              <div className="mt-6">
                {!finished ? (
                  <Button onClick={handleFinish}>
                    <CheckCircle2 className="size-4 mr-2" />
                    Finish Lesson
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Lesson completed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          {linkedStories.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BookText className="size-4 text-blue-600" />
                  Related Stories
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {linkedStories.map((story) => (
                  <Link
                    key={story.id}
                    to={storyLinkFor(story.id)}
                    className="block rounded-lg border p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{story.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {story.summary}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}