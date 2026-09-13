import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { useClassroomStore } from "@/stores/classroomStore";
import { useContentStore } from "@/stores/contentStore";
import {
  BookOpen,
  BookText,
  ClipboardCheck,
  Layers,
  Mic,
  Users,
} from "lucide-react";
import type {
  ClassroomContentType,
  ContentLevel,
  PronunciationExercise,
  Quiz,
  QuizContentLink,
  StoryVocabRef,
  VocabItem,
  VocabList,
} from "@/types";

type PronunciationType = "word" | "phrase" | "sentence";

type TeacherSection =
  | "overview"
  | "students"
  | "grammar"
  | "stories"
  | "vocab"
  | "pronunciation"
  | "quizzes";

type EditableQuizQuestion = {
  text: string;
  explanation: string;
  options: string[];
  correctOptionIndex: number;
};

function createEmptyQuizQuestion(): EditableQuizQuestion {
  return {
    text: "",
    explanation: "",
    options: ["", ""],
    correctOptionIndex: 0,
  };
}

function toggleId(list: string[], id: string) {
  return list.includes(id)
    ? list.filter((item) => item !== id)
    : [...list, id];
}

function buildStoryVocabRefs(
  selectedIds: string[],
  vocabItems: VocabItem[]
): StoryVocabRef[] {
  return selectedIds
    .map((vocabItemId) => {
      const vocabItem = vocabItems.find((item) => item.id === vocabItemId);

      if (!vocabItem) return null;

      return {
        vocabItemId,
        highlightText: vocabItem.word,
      };
    })
    .filter((item): item is StoryVocabRef => Boolean(item));
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

function matchesContentSearch(
  query: string,
  fields: Array<string | string[] | null | undefined>
) {
  if (!query) return true;

  const haystack = fields
    .flatMap((field) => (Array.isArray(field) ? field : [field]))
    .map(normalizeSearchText)
    .join(" ");

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

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

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const contentSearchQuery = useMemo(
    () => getContentSearchQuery(searchParams),
    [searchParams]
  );

  const currentUser = useAuthStore((s) => s.currentUser);

  const {
    selectedClassroomContent,
    isDetailLoading,
    detailError,
    fetchClassroomContent,
    assignContentToClassroom,
    removeContentFromClassroom,
    clearSelectedClassroomContent,
  } = useClassroomStore();

  const {
    grammarLessons,
    stories,
    vocabLists,
    vocabItems,
    pronunciationExercises,
    quizzes,
    initialized,
    initializeContent,
    createGrammarLesson,
    updateGrammarLesson,
    deleteGrammarLesson,
    createStory,
    updateStory,
    deleteStory,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    createPronunciationExercise,
    updatePronunciationExercise,
    deletePronunciationExercise,
    createVocabList,
    updateVocabList,
    deleteVocabList,
    createVocabItem,
    updateVocabItem,
    deleteVocabItem,
  } = useContentStore();

  const [activeSection, setActiveSection] = useState<TeacherSection>("overview");

  const [selectedGrammarId, setSelectedGrammarId] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [selectedVocabListId, setSelectedVocabListId] = useState("");
  const [selectedPronunciationId, setSelectedPronunciationId] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [grammarTitle, setGrammarTitle] = useState("");
  const [grammarContent, setGrammarContent] = useState("");
  const [grammarLevel, setGrammarLevel] = useState<ContentLevel>("beginner");
  const [grammarTags, setGrammarTags] = useState("");
  const [grammarFormError, setGrammarFormError] = useState("");
  const [isCreatingGrammar, setIsCreatingGrammar] = useState(false);
  const [editingGrammarId, setEditingGrammarId] = useState<string | null>(null);
  const [isUpdatingGrammar, setIsUpdatingGrammar] = useState(false);

  const [storyTitle, setStoryTitle] = useState("");
  const [storySummary, setStorySummary] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyLevel, setStoryLevel] = useState<ContentLevel>("beginner");
  const [storyTags, setStoryTags] = useState("");
  const [storyGrammarRefs, setStoryGrammarRefs] = useState<string[]>([]);
  const [storyVocabItemRefs, setStoryVocabItemRefs] = useState<string[]>([]);
  const [storyFormError, setStoryFormError] = useState("");
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [isUpdatingStory, setIsUpdatingStory] = useState(false);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizLevel, setQuizLevel] = useState<ContentLevel>("beginner");
  const [quizQuestions, setQuizQuestions] = useState<EditableQuizQuestion[]>([
    createEmptyQuizQuestion(),
  ]);
  const [quizFormError, setQuizFormError] = useState("");
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);
  const [quizGrammarLinks, setQuizGrammarLinks] = useState<string[]>([]);
  const [quizStoryLinks, setQuizStoryLinks] = useState<string[]>([]);
  const [quizVocabLinks, setQuizVocabLinks] = useState<string[]>([]);
  const [quizPronunciationLinks, setQuizPronunciationLinks] = useState<string[]>([]);

  const [pronunciationTargetText, setPronunciationTargetText] = useState("");
  const [pronunciationType, setPronunciationType] =
    useState<PronunciationType>("sentence");
  const [pronunciationLevel, setPronunciationLevel] =
    useState<ContentLevel>("beginner");
  const [pronunciationInstructions, setPronunciationInstructions] = useState("");
  const [pronunciationVocabLinks, setPronunciationVocabLinks] = useState<string[]>(
    []
  );
  const [pronunciationStoryLinks, setPronunciationStoryLinks] = useState<string[]>(
    []
  );
  const [pronunciationFormError, setPronunciationFormError] = useState("");
  const [isCreatingPronunciation, setIsCreatingPronunciation] = useState(false);
  const [editingPronunciationId, setEditingPronunciationId] = useState<string | null>(
    null
  );
  const [isUpdatingPronunciation, setIsUpdatingPronunciation] = useState(false);

  const [vocabListName, setVocabListName] = useState("");
  const [vocabListDescription, setVocabListDescription] = useState("");
  const [vocabListLevel, setVocabListLevel] = useState<ContentLevel>("beginner");
  const [vocabWord, setVocabWord] = useState("");
  const [vocabDefinition, setVocabDefinition] = useState("");
  const [vocabExample, setVocabExample] = useState("");
  const [vocabPhonetic, setVocabPhonetic] = useState("");
  const [vocabFormError, setVocabFormError] = useState("");
  const [isCreatingVocab, setIsCreatingVocab] = useState(false);
  const [editingVocabListId, setEditingVocabListId] = useState<string | null>(null);
  const [editingVocabItemId, setEditingVocabItemId] = useState<string | null>(null);
  const [isUpdatingVocab, setIsUpdatingVocab] = useState(false);

  useEffect(() => {
    if (!initialized) {
      void initializeContent();
    }
  }, [initialized, initializeContent]);

  useEffect(() => {
    if (id) {
      void fetchClassroomContent(id);
    }

    return () => {
      clearSelectedClassroomContent();
    };
  }, [id, fetchClassroomContent, clearSelectedClassroomContent]);

  const classroom = selectedClassroomContent?.classroom;

  const teacherGrammarLessons = useMemo(
    () => grammarLessons.filter((item) => item.teacherId === currentUser?.id),
    [grammarLessons, currentUser?.id]
  );

  const teacherStories = useMemo(
    () => stories.filter((item) => item.teacherId === currentUser?.id),
    [stories, currentUser?.id]
  );

  const teacherVocabLists = useMemo(
    () => vocabLists.filter((item) => item.teacherId === currentUser?.id),
    [vocabLists, currentUser?.id]
  );

  const teacherVocabItems = useMemo(() => {
    const teacherVocabListIds = new Set(teacherVocabLists.map((list) => list.id));

    return vocabItems.filter((item) => teacherVocabListIds.has(item.listId));
  }, [vocabItems, teacherVocabLists]);

  const teacherPronunciationExercises = useMemo(
    () => pronunciationExercises.filter((item) => item.teacherId === currentUser?.id),
    [pronunciationExercises, currentUser?.id]
  );

  const assignedGrammarIds = useMemo(
    () => new Set(selectedClassroomContent?.grammarLessons.map((item) => item.id) ?? []),
    [selectedClassroomContent]
  );

  const assignedStoryIds = useMemo(
    () => new Set(selectedClassroomContent?.stories.map((item) => item.id) ?? []),
    [selectedClassroomContent]
  );

  const assignedVocabListIds = useMemo(
    () => new Set(selectedClassroomContent?.vocabLists.map((item) => item.id) ?? []),
    [selectedClassroomContent]
  );

  const assignedPronunciationIds = useMemo(
    () =>
      new Set(
        selectedClassroomContent?.pronunciationExercises.map((item) => item.id) ?? []
      ),
    [selectedClassroomContent]
  );

  const assignedQuizIds = useMemo(
    () => new Set(selectedClassroomContent?.quizzes.map((item) => item.id) ?? []),
    [selectedClassroomContent]
  );

  const availableGrammar = teacherGrammarLessons
    .filter((item) => !assignedGrammarIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.title }));

  const availableStories = teacherStories
    .filter((item) => !assignedStoryIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.title }));

  const availableVocabLists = teacherVocabLists
    .filter((item) => !assignedVocabListIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.name }));

  const availablePronunciation = teacherPronunciationExercises
    .filter((item) => !assignedPronunciationIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.targetText }));

  const availableQuizzes = quizzes
    .filter((item) => item.teacherId === currentUser?.id)
    .filter((item) => !assignedQuizIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.title }));

  const getFirstVocabItem = (listId: string) =>
    vocabItems.find((item) => item.listId === listId);

  const filteredAssignedGrammar = useMemo(() => {
    const items = selectedClassroomContent?.grammarLessons ?? [];

    return items.filter((lesson) =>
      matchesContentSearch(contentSearchQuery, [
        lesson.title,
        lesson.content,
        lesson.level,
        lesson.tags,
      ])
    );
  }, [selectedClassroomContent, contentSearchQuery]);

  const filteredAssignedStories = useMemo(() => {
    const items = selectedClassroomContent?.stories ?? [];

    return items.filter((story) =>
      matchesContentSearch(contentSearchQuery, [
        story.title,
        story.summary,
        story.content,
        story.level,
        story.tags,
      ])
    );
  }, [selectedClassroomContent, contentSearchQuery]);

  const filteredAssignedVocabLists = useMemo(() => {
    const items = selectedClassroomContent?.vocabLists ?? [];

    return items.filter((list) => {
      const listItems = vocabItems.filter((item) => item.listId === list.id);

      return matchesContentSearch(contentSearchQuery, [
        list.name,
        list.description,
        list.level,
        listItems.flatMap((item) => [
          item.word,
          item.definition,
          item.example,
          item.phonetic,
          item.level,
        ]),
      ]);
    });
  }, [selectedClassroomContent, vocabItems, contentSearchQuery]);

  const handleAssign = async (
    contentType: ClassroomContentType,
    contentId: string
  ) => {
    if (!id || !contentId) return;

    setActionError("");
    setIsSubmitting(true);

    const result = await assignContentToClassroom(id, contentType, contentId);

    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error ?? "Failed to assign content.");
      return;
    }

    if (contentType === "grammar") setSelectedGrammarId("");
    if (contentType === "story") setSelectedStoryId("");
    if (contentType === "vocab") setSelectedVocabListId("");
    if (contentType === "pronunciation") setSelectedPronunciationId("");
    if (contentType === "quiz") setSelectedQuizId("");
  };

  const handleRemove = async (
    contentType: ClassroomContentType,
    contentId: string
  ) => {
    if (!id) return;

    setActionError("");
    setIsSubmitting(true);

    const result = await removeContentFromClassroom(id, contentType, contentId);

    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error ?? "Failed to remove content.");
    }
  };

  const handleDeleteContent = async (
    contentType: ClassroomContentType,
    contentId: string,
    label: string,
    linkedVocabItemId?: string
  ) => {
    if (!id) return;

    const confirmed = window.confirm(
      `Delete "${label}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setActionError("");
    setIsSubmitting(true);

    let result: { success: boolean; error?: string };

    if (contentType === "grammar") {
      result = await deleteGrammarLesson(contentId);
    } else if (contentType === "story") {
      result = await deleteStory(contentId);
    } else if (contentType === "quiz") {
      result = await deleteQuiz(contentId);
    } else if (contentType === "pronunciation") {
      result = await deletePronunciationExercise(contentId);
    } else {
      if (linkedVocabItemId) {
        const itemResult = await deleteVocabItem(linkedVocabItemId);

        if (!itemResult.success) {
          setIsSubmitting(false);
          setActionError(itemResult.error ?? "Failed to delete vocabulary item.");
          return;
        }
      }

      result = await deleteVocabList(contentId);
    }

    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error ?? "Failed to delete content.");
      return;
    }

    await initializeContent();
    await fetchClassroomContent(id);
  };

  const resetGrammarForm = () => {
    setEditingGrammarId(null);
    setGrammarTitle("");
    setGrammarContent("");
    setGrammarLevel("beginner");
    setGrammarTags("");
    setGrammarFormError("");
  };

  const startEditGrammar = (lesson: {
    id: string;
    title: string;
    content: string;
    level: ContentLevel;
    tags: string[];
  }) => {
    setActiveSection("grammar");
    setEditingGrammarId(lesson.id);
    setGrammarTitle(lesson.title);
    setGrammarContent(lesson.content);
    setGrammarLevel(lesson.level);
    setGrammarTags(lesson.tags.join(", "));
    setGrammarFormError("");
  };

  const handleSubmitGrammar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setGrammarFormError("");
    setActionError("");

    if (!grammarTitle.trim()) {
      setGrammarFormError("Grammar title is required.");
      return;
    }

    if (!grammarContent.trim()) {
      setGrammarFormError("Grammar content is required.");
      return;
    }

    const parsedTags = grammarTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingGrammarId) {
      setIsUpdatingGrammar(true);

      const updateResult = await updateGrammarLesson({
        id: editingGrammarId,
        title: grammarTitle.trim(),
        content: grammarContent.trim(),
        level: grammarLevel,
        tags: parsedTags,
      });

      setIsUpdatingGrammar(false);

      if (!updateResult.success) {
        setGrammarFormError(updateResult.error ?? "Failed to update grammar lesson.");
        return;
      }

      resetGrammarForm();
      await fetchClassroomContent(id);
      return;
    }

    setIsCreatingGrammar(true);

    const createResult = await createGrammarLesson({
      title: grammarTitle.trim(),
      content: grammarContent.trim(),
      level: grammarLevel,
      tags: parsedTags,
    });

    if (!createResult.success || !createResult.data) {
      setIsCreatingGrammar(false);
      setGrammarFormError(createResult.error ?? "Failed to create grammar lesson.");
      return;
    }

    const assignResult = await assignContentToClassroom(
      id,
      "grammar",
      createResult.data.id
    );

    setIsCreatingGrammar(false);

    if (!assignResult.success) {
      setGrammarFormError(assignResult.error ?? "Grammar created but assignment failed.");
      return;
    }

    resetGrammarForm();
    setSelectedGrammarId("");
    await fetchClassroomContent(id);
  };

  const resetStoryForm = () => {
    setEditingStoryId(null);
    setStoryTitle("");
    setStorySummary("");
    setStoryContent("");
    setStoryLevel("beginner");
    setStoryTags("");
    setStoryGrammarRefs([]);
    setStoryVocabItemRefs([]);
    setStoryFormError("");
  };

  const startEditStory = (story: {
    id: string;
    title: string;
    summary: string;
    content: string;
    level: ContentLevel;
    tags: string[];
    grammarRefs?: string[];
    vocabRefs?: StoryVocabRef[];
  }) => {
    setActiveSection("stories");
    setEditingStoryId(story.id);
    setStoryTitle(story.title);
    setStorySummary(story.summary);
    setStoryContent(story.content);
    setStoryLevel(story.level);
    setStoryTags(story.tags.join(", "));
    setStoryGrammarRefs(story.grammarRefs ?? []);
    setStoryVocabItemRefs((story.vocabRefs ?? []).map((ref) => ref.vocabItemId));
    setStoryFormError("");
  };

  const handleSubmitStory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setStoryFormError("");
    setActionError("");

    if (!storyTitle.trim()) {
      setStoryFormError("Story title is required.");
      return;
    }

    if (!storySummary.trim()) {
      setStoryFormError("Story summary is required.");
      return;
    }

    if (!storyContent.trim()) {
      setStoryFormError("Story content is required.");
      return;
    }

    const parsedTags = storyTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const parsedVocabRefs = buildStoryVocabRefs(
      storyVocabItemRefs,
      teacherVocabItems
    );

    if (parsedVocabRefs.length !== storyVocabItemRefs.length) {
      setStoryFormError("One or more selected vocabulary items could not be found.");
      return;
    }

    if (editingStoryId) {
      setIsUpdatingStory(true);

      const updateResult = await updateStory({
        id: editingStoryId,
        title: storyTitle.trim(),
        summary: storySummary.trim(),
        content: storyContent.trim(),
        level: storyLevel,
        tags: parsedTags,
        grammarRefs: storyGrammarRefs,
        vocabRefs: parsedVocabRefs,
      });

      setIsUpdatingStory(false);

      if (!updateResult.success) {
        setStoryFormError(updateResult.error ?? "Failed to update story.");
        return;
      }

      resetStoryForm();
      await fetchClassroomContent(id);
      return;
    }

    setIsCreatingStory(true);

    const createResult = await createStory({
      title: storyTitle.trim(),
      summary: storySummary.trim(),
      content: storyContent.trim(),
      level: storyLevel,
      tags: parsedTags,
      grammarRefs: storyGrammarRefs,
      vocabRefs: parsedVocabRefs,
    });

    if (!createResult.success || !createResult.data) {
      setIsCreatingStory(false);
      setStoryFormError(createResult.error ?? "Failed to create story.");
      return;
    }

    const assignResult = await assignContentToClassroom(
      id,
      "story",
      createResult.data.id
    );

    setIsCreatingStory(false);

    if (!assignResult.success) {
      setStoryFormError(assignResult.error ?? "Story created but assignment failed.");
      return;
    }

    resetStoryForm();
    setSelectedStoryId("");
    await fetchClassroomContent(id);
  };

  const resetQuizForm = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizDescription("");
    setQuizLevel("beginner");
    setQuizQuestions([createEmptyQuizQuestion()]);
    setQuizGrammarLinks([]);
    setQuizStoryLinks([]);
    setQuizVocabLinks([]);
    setQuizPronunciationLinks([]);
    setQuizFormError("");
  };

  const startEditQuiz = (quiz: Quiz) => {
    setActiveSection("quizzes");
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description);
    setQuizLevel(quiz.level);
    setQuizQuestions(
      quiz.questions.map((question) => ({
        text: question.text,
        explanation: question.explanation,
        options: question.options.map((option) => option.text),
        correctOptionIndex: Math.max(
          0,
          question.options.findIndex((option) => option.id === question.correctOptionId)
        ),
      }))
    );
    setQuizGrammarLinks(
      (quiz.contentLinks ?? [])
        .filter((link) => link.linkedType === "grammar")
        .map((link) => link.linkedId)
    );
    setQuizStoryLinks(
      (quiz.contentLinks ?? [])
        .filter((link) => link.linkedType === "story")
        .map((link) => link.linkedId)
    );
    setQuizVocabLinks(
      (quiz.contentLinks ?? [])
        .filter((link) => link.linkedType === "vocab")
        .map((link) => link.linkedId)
    );
    setQuizPronunciationLinks(
      (quiz.contentLinks ?? [])
        .filter((link) => link.linkedType === "pronunciation")
        .map((link) => link.linkedId)
    );
    setQuizFormError("");
  };

  const updateQuizQuestion = (
    questionIndex: number,
    updater: (question: EditableQuizQuestion) => EditableQuizQuestion
  ) => {
    setQuizQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex ? updater(question) : question
      )
    );
  };

  const handleSubmitQuiz = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setQuizFormError("");
    setActionError("");

    if (!quizTitle.trim()) {
      setQuizFormError("Quiz title is required.");
      return;
    }

    if (!quizDescription.trim()) {
      setQuizFormError("Quiz description is required.");
      return;
    }

    if (quizQuestions.length === 0) {
      setQuizFormError("At least one question is required.");
      return;
    }

    for (const question of quizQuestions) {
      if (!question.text.trim()) {
        setQuizFormError("Each question must have text.");
        return;
      }

      const cleanedOptions = question.options.map((option) => option.trim());
      if (cleanedOptions.length < 2 || cleanedOptions.some((option) => !option)) {
        setQuizFormError("Each question must have at least two filled options.");
        return;
      }

      if (
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= cleanedOptions.length
      ) {
        setQuizFormError("Each question must have a valid correct option.");
        return;
      }
    }

    const contentLinks: QuizContentLink[] = [
      ...quizGrammarLinks.map((linkedId) => ({
        linkedType: "grammar" as const,
        linkedId,
      })),
      ...quizStoryLinks.map((linkedId) => ({
        linkedType: "story" as const,
        linkedId,
      })),
      ...quizVocabLinks.map((linkedId) => ({
        linkedType: "vocab" as const,
        linkedId,
      })),
      ...quizPronunciationLinks.map((linkedId) => ({
        linkedType: "pronunciation" as const,
        linkedId,
      })),
    ];

    if (contentLinks.length === 0) {
      setQuizFormError("Link this quiz to at least one learning item.");
      return;
    }

    const payload = {
      title: quizTitle.trim(),
      description: quizDescription.trim(),
      level: quizLevel,
      questions: quizQuestions.map((question) => ({
        text: question.text.trim(),
        explanation: question.explanation.trim(),
        options: question.options.map((option) => option.trim()),
        correctOptionIndex: question.correctOptionIndex,
      })),
      contentLinks,
    };

    if (editingQuizId) {
      setIsUpdatingQuiz(true);

      const updateResult = await updateQuiz({
        id: editingQuizId,
        ...payload,
      });

      setIsUpdatingQuiz(false);

      if (!updateResult.success) {
        setQuizFormError(updateResult.error ?? "Failed to update quiz.");
        return;
      }

      resetQuizForm();
      await fetchClassroomContent(id);
      return;
    }

    setIsCreatingQuiz(true);

    const createResult = await createQuiz(payload);

    if (!createResult.success || !createResult.data) {
      setIsCreatingQuiz(false);
      setQuizFormError(createResult.error ?? "Failed to create quiz.");
      return;
    }

    const assignResult = await assignContentToClassroom(
      id,
      "quiz",
      createResult.data.id
    );

    setIsCreatingQuiz(false);

    if (!assignResult.success) {
      setQuizFormError(assignResult.error ?? "Quiz created but assignment failed.");
      return;
    }

    resetQuizForm();
    setSelectedQuizId("");
    await fetchClassroomContent(id);
  };

  const resetPronunciationForm = () => {
    setEditingPronunciationId(null);
    setPronunciationTargetText("");
    setPronunciationType("sentence");
    setPronunciationLevel("beginner");
    setPronunciationInstructions("");
    setPronunciationVocabLinks([]);
    setPronunciationStoryLinks([]);
    setPronunciationFormError("");
  };

  const startEditPronunciation = (exercise: {
  id: string;
  targetText: string;
  type: PronunciationType;
  level: ContentLevel;
  instructions: string;
  vocabLinks?: string[];
  storyLinks?: string[];
  }) => {
  setActiveSection("pronunciation");
  setEditingPronunciationId(exercise.id);
  setPronunciationTargetText(exercise.targetText);
  setPronunciationType(exercise.type);
  setPronunciationLevel(exercise.level);
  setPronunciationInstructions(exercise.instructions);
  setPronunciationVocabLinks(exercise.vocabLinks ?? []);
  setPronunciationStoryLinks(exercise.storyLinks ?? []);
  setPronunciationFormError("");
  };

  const handleSubmitPronunciation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setPronunciationFormError("");
    setActionError("");

    if (!pronunciationTargetText.trim()) {
      setPronunciationFormError("Target text is required.");
      return;
    }

    if (!pronunciationInstructions.trim()) {
      setPronunciationFormError("Instructions are required.");
      return;
    }

    if (editingPronunciationId) {
      setIsUpdatingPronunciation(true);

      const updateResult = await updatePronunciationExercise({
        id: editingPronunciationId,
        targetText: pronunciationTargetText.trim(),
        type: pronunciationType,
        level: pronunciationLevel,
        instructions: pronunciationInstructions.trim(),
        vocabLinks: pronunciationVocabLinks,
        storyLinks: pronunciationStoryLinks,
      });

      setIsUpdatingPronunciation(false);

      if (!updateResult.success) {
        setPronunciationFormError(
          updateResult.error ?? "Failed to update pronunciation exercise."
        );
        return;
      }

      resetPronunciationForm();
      await fetchClassroomContent(id);
      return;
    }

    setIsCreatingPronunciation(true);

    const createResult = await createPronunciationExercise({
      targetText: pronunciationTargetText.trim(),
      type: pronunciationType,
      level: pronunciationLevel,
      instructions: pronunciationInstructions.trim(),
      vocabLinks: pronunciationVocabLinks,
      storyLinks: pronunciationStoryLinks,
    });

    if (!createResult.success || !createResult.data) {
      setIsCreatingPronunciation(false);
      setPronunciationFormError(
        createResult.error ?? "Failed to create pronunciation exercise."
      );
      return;
    }

    const assignResult = await assignContentToClassroom(
      id,
      "pronunciation",
      createResult.data.id
    );

    setIsCreatingPronunciation(false);

    if (!assignResult.success) {
      setPronunciationFormError(
        assignResult.error ?? "Pronunciation exercise created but assignment failed."
      );
      return;
    }

    resetPronunciationForm();
    setSelectedPronunciationId("");
    await fetchClassroomContent(id);
  };

  const resetVocabForm = () => {
    setEditingVocabListId(null);
    setEditingVocabItemId(null);
    setVocabListName("");
    setVocabListDescription("");
    setVocabListLevel("beginner");
    setVocabWord("");
    setVocabDefinition("");
    setVocabExample("");
    setVocabPhonetic("");
    setVocabFormError("");
  };

  const startEditVocab = (list: VocabList, firstItem?: VocabItem) => {
    setActiveSection("vocab");
    setEditingVocabListId(list.id);
    setEditingVocabItemId(firstItem?.id ?? null);
    setVocabListName(list.name);
    setVocabListDescription(list.description);
    setVocabListLevel(list.level);
    setVocabWord(firstItem?.word ?? "");
    setVocabDefinition(firstItem?.definition ?? "");
    setVocabExample(firstItem?.example ?? "");
    setVocabPhonetic(firstItem?.phonetic ?? "");
    setVocabFormError("");
  };

  const handleSubmitVocab = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setVocabFormError("");
    setActionError("");

    if (!vocabListName.trim()) {
      setVocabFormError("Vocabulary list name is required.");
      return;
    }

    if (!vocabListDescription.trim()) {
      setVocabFormError("Vocabulary list description is required.");
      return;
    }

    if (!vocabWord.trim()) {
      setVocabFormError("Word is required.");
      return;
    }

    if (!vocabDefinition.trim()) {
      setVocabFormError("Definition is required.");
      return;
    }

    if (!vocabExample.trim()) {
      setVocabFormError("Example is required.");
      return;
    }

    if (!vocabPhonetic.trim()) {
      setVocabFormError("Phonetic is required.");
      return;
    }

    if (editingVocabListId && editingVocabItemId) {
      setIsUpdatingVocab(true);

      const listResult = await updateVocabList({
        id: editingVocabListId,
        name: vocabListName.trim(),
        description: vocabListDescription.trim(),
        level: vocabListLevel,
      });

      if (!listResult.success) {
        setIsUpdatingVocab(false);
        setVocabFormError(listResult.error ?? "Failed to update vocabulary list.");
        return;
      }

      const itemResult = await updateVocabItem({
        id: editingVocabItemId,
        word: vocabWord.trim(),
        definition: vocabDefinition.trim(),
        example: vocabExample.trim(),
        phonetic: vocabPhonetic.trim(),
        level: vocabListLevel,
      });

      setIsUpdatingVocab(false);

      if (!itemResult.success) {
        setVocabFormError(itemResult.error ?? "Failed to update vocabulary item.");
        return;
      }

      resetVocabForm();
      await initializeContent();
      await fetchClassroomContent(id);
      return;
    }

    setIsCreatingVocab(true);

    const listResult = await createVocabList({
      name: vocabListName.trim(),
      description: vocabListDescription.trim(),
      level: vocabListLevel,
    });

    if (!listResult.success || !listResult.data) {
      setIsCreatingVocab(false);
      setVocabFormError(listResult.error ?? "Failed to create vocabulary list.");
      return;
    }

    const itemResult = await createVocabItem({
      listId: listResult.data.id,
      word: vocabWord.trim(),
      definition: vocabDefinition.trim(),
      example: vocabExample.trim(),
      phonetic: vocabPhonetic.trim(),
      level: vocabListLevel,
    });

    if (!itemResult.success) {
      setIsCreatingVocab(false);
      setVocabFormError(itemResult.error ?? "Failed to create vocabulary item.");
      return;
    }

    const assignResult = await assignContentToClassroom(id, "vocab", listResult.data.id);

    setIsCreatingVocab(false);

    if (!assignResult.success) {
      setVocabFormError(assignResult.error ?? "Vocabulary list created but assignment failed.");
      return;
    }

    resetVocabForm();
    setSelectedVocabListId("");
    await initializeContent();
    await fetchClassroomContent(id);
  };

  if (isDetailLoading) {
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

  if (detailError) {
    return (
      <div className="space-y-6">
        <Header title="Classroom Detail" />
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-destructive">{detailError}</CardContent>
        </Card>
      </div>
    );
  }

  if (!classroom || !selectedClassroomContent) {
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
      description: "Create and assign lessons",
      count: selectedClassroomContent.grammarLessons.length,
      icon: BookOpen,
    },
    {
      key: "stories" as const,
      title: "Stories",
      description: "Create and assign stories",
      count: selectedClassroomContent.stories.length,
      icon: BookText,
    },
    {
      key: "vocab" as const,
      title: "Vocabulary",
      description: "Create and assign vocabulary",
      count: selectedClassroomContent.vocabLists.length,
      icon: Layers,
    },
    {
      key: "pronunciation" as const,
      title: "Pronunciation",
      description: "Create speaking exercises",
      count: selectedClassroomContent.pronunciationExercises.length,
      icon: Mic,
    },
    {
      key: "quizzes" as const,
      title: "Quizzes",
      description: "Create and assign quizzes",
      count: selectedClassroomContent.quizzes.length,
      icon: ClipboardCheck,
    },
  ];

  const actionErrorCard = actionError ? (
    <Card className="shadow-sm border-border/60">
      <CardContent className="pt-6 text-sm text-destructive">
        {actionError}
      </CardContent>
    </Card>
  ) : null;

  if (activeSection === "overview") {
    return (
      <div className="space-y-6">
        <Header
          title={classroom.name}
          description="Manage classroom content and enrolled students."
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {new Date(student.joinedAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    <Link to={`/teacher/students/${student.id}`}>
                      <Button type="button" variant="outline" size="sm">
                        View Analytics
                      </Button>
                    </Link>
                  </div>
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
        {renderSectionHeader("Grammar", `Create, update, assign, and remove grammar lessons in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {editingGrammarId ? "Update Grammar Lesson" : "Create Grammar Lesson"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitGrammar} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={grammarTitle}
                    onChange={(e) => setGrammarTitle(e.target.value)}
                    placeholder="Example: Simple Present Tense"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <select
                    value={grammarLevel}
                    onChange={(e) => setGrammarLevel(e.target.value as ContentLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={grammarTags}
                  onChange={(e) => setGrammarTags(e.target.value)}
                  placeholder="tenses, verbs, basics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  rows={10}
                  value={grammarContent}
                  onChange={(e) => setGrammarContent(e.target.value)}
                  placeholder="Write the grammar lesson here..."
                  className="flex min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {grammarFormError && (
                <p className="text-sm text-destructive">{grammarFormError}</p>
              )}

              <div className="flex justify-end gap-2">
                {editingGrammarId && (
                  <Button type="button" variant="outline" onClick={resetGrammarForm}>
                    Cancel
                  </Button>
                )}

                <Button type="submit" disabled={isCreatingGrammar || isUpdatingGrammar}>
                  {editingGrammarId
                    ? isUpdatingGrammar
                      ? "Updating..."
                      : "Update Grammar"
                    : isCreatingGrammar
                    ? "Creating..."
                    : "Create and Assign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {actionErrorCard}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Assigned Grammar Lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <select
                value={selectedGrammarId}
                onChange={(e) => setSelectedGrammarId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select grammar lessons</option>
                {availableGrammar.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                disabled={!selectedGrammarId || isSubmitting}
                onClick={() => void handleAssign("grammar", selectedGrammarId)}
              >
                {isSubmitting ? "Saving..." : "Assign"}
              </Button>
            </div>

            {selectedClassroomContent.grammarLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grammar lessons assigned to this classroom yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredAssignedGrammar.map((lesson) => (
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

                        {lesson.tags.length > 0 && (
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
                            Assigned {new Date(lesson.assignedAt).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <LevelBadge level={lesson.level} />

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              startEditGrammar({
                                id: lesson.id,
                                title: lesson.title,
                                content: lesson.content,
                                level: lesson.level,
                                tags: lesson.tags,
                              })
                            }
                          >
                            Update
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleRemove("grammar", lesson.id)}
                            disabled={isSubmitting}
                          >
                            Remove
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              void handleDeleteContent("grammar", lesson.id, lesson.title)
                            }
                            disabled={isSubmitting}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "stories") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Stories", `Create, update, assign, and remove stories in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {editingStoryId ? "Update Story" : "Create Story"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStory} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Example: A Day at the Park"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <select
                    value={storyLevel}
                    onChange={(e) => setStoryLevel(e.target.value as ContentLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Summary</label>
                <Input
                  value={storySummary}
                  onChange={(e) => setStorySummary(e.target.value)}
                  placeholder="Short summary of the story"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={storyTags}
                  onChange={(e) => setStoryTags(e.target.value)}
                  placeholder="reading, routine, daily life"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Grammar Lessons</label>

                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                    {teacherGrammarLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No grammar lessons available yet.
                      </p>
                    ) : (
                      teacherGrammarLessons.map((lesson) => (
                        <label
                          key={lesson.id}
                          className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                        >
                          <input
                            type="checkbox"
                            checked={storyGrammarRefs.includes(lesson.id)}
                            onChange={() =>
                              setStoryGrammarRefs((prev) => toggleId(prev, lesson.id))
                            }
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium">{lesson.title}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {lesson.level}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Highlight Vocabulary</label>

                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                    {teacherVocabItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No vocabulary items available yet.
                      </p>
                    ) : (
                      teacherVocabItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                        >
                          <input
                            type="checkbox"
                            checked={storyVocabItemRefs.includes(item.id)}
                            onChange={() =>
                              setStoryVocabItemRefs((prev) => toggleId(prev, item.id))
                            }
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium">{item.word}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.definition}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    The vocabulary word will be used as the story highlight text.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  rows={10}
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  placeholder="Write the story here..."
                  className="flex min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {storyFormError && (
                <p className="text-sm text-destructive">{storyFormError}</p>
              )}

              <div className="flex justify-end gap-2">
                {editingStoryId && (
                  <Button type="button" variant="outline" onClick={resetStoryForm}>
                    Cancel
                  </Button>
                )}

                <Button type="submit" disabled={isCreatingStory || isUpdatingStory}>
                  {editingStoryId
                    ? isUpdatingStory
                      ? "Updating..."
                      : "Update Story"
                    : isCreatingStory
                    ? "Creating..."
                    : "Create and Assign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {actionErrorCard}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Assigned Stories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <select
                value={selectedStoryId}
                onChange={(e) => setSelectedStoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select stories</option>
                {availableStories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                disabled={!selectedStoryId || isSubmitting}
                onClick={() => void handleAssign("story", selectedStoryId)}
              >
                {isSubmitting ? "Saving..." : "Assign"}
              </Button>
            </div>

            {selectedClassroomContent.stories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stories assigned to this classroom yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredAssignedStories.map((story) => {
                  const storyWithLinks = story as typeof story & {
                    grammarRefs?: string[];
                    vocabRefs?: StoryVocabRef[];
                  };

                  return (
                    <div
                      key={story.id}
                      className="rounded-lg border border-border/60 p-4 bg-background"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium break-words">{story.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{story.summary}</p>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                            {story.content}
                          </p>

                          {story.tags.length > 0 && (
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
                              Assigned {new Date(story.assignedAt).toLocaleDateString("en-GB")}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <LevelBadge level={story.level} />

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                startEditStory({
                                  id: story.id,
                                  title: story.title,
                                  summary: story.summary,
                                  content: story.content,
                                  level: story.level,
                                  tags: story.tags,
                                  grammarRefs: storyWithLinks.grammarRefs ?? [],
                                  vocabRefs: storyWithLinks.vocabRefs ?? [],
                                })
                              }
                            >
                              Update
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleRemove("story", story.id)}
                              disabled={isSubmitting}
                            >
                              Remove
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                void handleDeleteContent("story", story.id, story.title)
                              }
                              disabled={isSubmitting}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "quizzes") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Quizzes", `Create, update, assign, and remove quizzes in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {editingQuizId ? "Update Quiz" : "Create Quiz"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitQuiz} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Example: Present Tense Quiz"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <select
                    value={quizLevel}
                    onChange={(e) => setQuizLevel(e.target.value as ContentLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Short description of the quiz"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Link Quiz to Learning Content</label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select the grammar, story, vocabulary, or pronunciation content this quiz assesses.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grammar Lessons</label>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                      {teacherGrammarLessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No grammar lessons available.
                        </p>
                      ) : (
                        teacherGrammarLessons.map((lesson) => (
                          <label
                            key={lesson.id}
                            className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                          >
                            <input
                              type="checkbox"
                              checked={quizGrammarLinks.includes(lesson.id)}
                              onChange={() =>
                                setQuizGrammarLinks((prev) => toggleId(prev, lesson.id))
                              }
                              className="mt-1"
                            />
                            <span>
                              <span className="font-medium">{lesson.title}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {lesson.level}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stories</label>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                      {teacherStories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No stories available.</p>
                      ) : (
                        teacherStories.map((story) => (
                          <label
                            key={story.id}
                            className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                          >
                            <input
                              type="checkbox"
                              checked={quizStoryLinks.includes(story.id)}
                              onChange={() =>
                                setQuizStoryLinks((prev) => toggleId(prev, story.id))
                              }
                              className="mt-1"
                            />
                            <span>
                              <span className="font-medium">{story.title}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {story.level}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vocabulary Items</label>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                      {teacherVocabItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No vocabulary items available.
                        </p>
                      ) : (
                        teacherVocabItems.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                          >
                            <input
                              type="checkbox"
                              checked={quizVocabLinks.includes(item.id)}
                              onChange={() =>
                                setQuizVocabLinks((prev) => toggleId(prev, item.id))
                              }
                              className="mt-1"
                            />
                            <span>
                              <span className="font-medium">{item.word}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {item.definition}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pronunciation Exercises</label>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                      {teacherPronunciationExercises.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No pronunciation exercises available.
                        </p>
                      ) : (
                        teacherPronunciationExercises.map((exercise) => (
                          <label
                            key={exercise.id}
                            className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                          >
                            <input
                              type="checkbox"
                              checked={quizPronunciationLinks.includes(exercise.id)}
                              onChange={() =>
                                setQuizPronunciationLinks((prev) =>
                                  toggleId(prev, exercise.id)
                                )
                              }
                              className="mt-1"
                            />
                            <span>
                              <span className="font-medium">{exercise.targetText}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {exercise.level}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {quizQuestions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="rounded-lg border border-border/60 p-4 bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">Question {questionIndex + 1}</p>
                      {quizQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuizQuestions((prev) =>
                              prev.filter((_, index) => index !== questionIndex)
                            )
                          }
                        >
                          Remove Question
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Text</label>
                      <Input
                        value={question.text}
                        onChange={(e) =>
                          updateQuizQuestion(questionIndex, (current) => ({
                            ...current,
                            text: e.target.value,
                          }))
                        }
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Explanation</label>
                      <Input
                        value={question.explanation}
                        onChange={(e) =>
                          updateQuizQuestion(questionIndex, (current) => ({
                            ...current,
                            explanation: e.target.value,
                          }))
                        }
                        placeholder="Explanation shown after submit"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Options</label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateQuizQuestion(questionIndex, (current) => ({
                                ...current,
                                options: current.options.map((item, idx) =>
                                  idx === optionIndex ? e.target.value : item
                                ),
                              }))
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateQuizQuestion(questionIndex, (current) => {
                                  const nextOptions = current.options.filter(
                                    (_, idx) => idx !== optionIndex
                                  );
                                  const nextCorrect =
                                    current.correctOptionIndex >= nextOptions.length
                                      ? nextOptions.length - 1
                                      : current.correctOptionIndex;

                                  return {
                                    ...current,
                                    options: nextOptions,
                                    correctOptionIndex: Math.max(0, nextCorrect),
                                  };
                                })
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuizQuestion(questionIndex, (current) => ({
                            ...current,
                            options: [...current.options, ""],
                          }))
                        }
                      >
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Correct Option</label>
                      <select
                        value={question.correctOptionIndex}
                        onChange={(e) =>
                          updateQuizQuestion(questionIndex, (current) => ({
                            ...current,
                            correctOptionIndex: Number(e.target.value),
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {question.options.map((_, optionIndex) => (
                          <option key={optionIndex} value={optionIndex}>
                            Option {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setQuizQuestions((prev) => [...prev, createEmptyQuizQuestion()])
                  }
                >
                  Add Question
                </Button>
              </div>

              {quizFormError && (
                <p className="text-sm text-destructive">{quizFormError}</p>
              )}

              <div className="flex justify-end gap-2">
                {editingQuizId && (
                  <Button type="button" variant="outline" onClick={resetQuizForm}>
                    Cancel
                  </Button>
                )}

                <Button type="submit" disabled={isCreatingQuiz || isUpdatingQuiz}>
                  {editingQuizId
                    ? isUpdatingQuiz
                      ? "Updating..."
                      : "Update Quiz"
                    : isCreatingQuiz
                    ? "Creating..."
                    : "Create and Assign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {actionErrorCard}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Assigned Quizzes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select quizzes</option>
                {availableQuizzes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                disabled={!selectedQuizId || isSubmitting}
                onClick={() => void handleAssign("quiz", selectedQuizId)}
              >
                {isSubmitting ? "Saving..." : "Assign"}
              </Button>
            </div>

            {selectedClassroomContent.quizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No quizzes assigned to this classroom yet.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedClassroomContent.quizzes.map((quiz) => (
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          Linked learning items: {quiz.contentLinks?.length ?? 0}
                        </p>

                        {quiz.assignedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Assigned {new Date(quiz.assignedAt).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <LevelBadge level={quiz.level} />

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditQuiz(quiz)}
                          >
                            Update
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleRemove("quiz", quiz.id)}
                            disabled={isSubmitting}
                          >
                            Remove
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              void handleDeleteContent("quiz", quiz.id, quiz.title)
                            }
                            disabled={isSubmitting}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "vocab") {
    return (
      <div className="space-y-6">
        {renderSectionHeader("Vocabulary", `Create, update, assign, and remove vocabulary lists in ${classroom.name}.`)}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {editingVocabListId ? "Update Vocabulary List" : "Create Vocabulary List"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVocab} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">List Name</label>
                  <Input
                    value={vocabListName}
                    onChange={(e) => setVocabListName(e.target.value)}
                    placeholder="Example: Daily Life Vocabulary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <select
                    value={vocabListLevel}
                    onChange={(e) => setVocabListLevel(e.target.value as ContentLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={vocabListDescription}
                  onChange={(e) => setVocabListDescription(e.target.value)}
                  placeholder="Short description of the vocabulary list"
                />
              </div>

              <div className="rounded-lg border border-border/60 p-4 space-y-4">
                <p className="font-medium">
                  {editingVocabListId ? "Edit First Vocabulary Item" : "First Vocabulary Item"}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Word</label>
                    <Input
                      value={vocabWord}
                      onChange={(e) => setVocabWord(e.target.value)}
                      placeholder="Example: routine"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phonetic</label>
                    <Input
                      value={vocabPhonetic}
                      onChange={(e) => setVocabPhonetic(e.target.value)}
                      placeholder="Example: /ruːˈtiːn/"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Definition</label>
                  <Input
                    value={vocabDefinition}
                    onChange={(e) => setVocabDefinition(e.target.value)}
                    placeholder="Meaning of the word"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Example</label>
                  <Input
                    value={vocabExample}
                    onChange={(e) => setVocabExample(e.target.value)}
                    placeholder="Example sentence"
                  />
                </div>
              </div>

              {vocabFormError && (
                <p className="text-sm text-destructive">{vocabFormError}</p>
              )}

              <div className="flex justify-end gap-2">
                {editingVocabListId && (
                  <Button type="button" variant="outline" onClick={resetVocabForm}>
                    Cancel
                  </Button>
                )}

                <Button type="submit" disabled={isCreatingVocab || isUpdatingVocab}>
                  {editingVocabListId
                    ? isUpdatingVocab
                      ? "Updating..."
                      : "Update Vocabulary"
                    : isCreatingVocab
                    ? "Creating..."
                    : "Create and Assign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {actionErrorCard}

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Assigned Vocabulary Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <select
                value={selectedVocabListId}
                onChange={(e) => setSelectedVocabListId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select vocabulary lists</option>
                {availableVocabLists.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                disabled={!selectedVocabListId || isSubmitting}
                onClick={() => void handleAssign("vocab", selectedVocabListId)}
              >
                {isSubmitting ? "Saving..." : "Assign"}
              </Button>
            </div>

            {selectedClassroomContent.vocabLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No vocabulary lists assigned to this classroom yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredAssignedVocabLists.map((list) => {
                  const firstItem = getFirstVocabItem(list.id);

                  return (
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

                          {firstItem && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium text-foreground">Word:</span>{" "}
                                {firstItem.word}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Meaning:</span>{" "}
                                {firstItem.definition}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Example:</span>{" "}
                                {firstItem.example}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Phonetic:</span>{" "}
                                {firstItem.phonetic}
                              </p>
                            </div>
                          )}

                          {list.assignedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Assigned {new Date(list.assignedAt).toLocaleDateString("en-GB")}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <LevelBadge level={list.level} />

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startEditVocab(list, firstItem)}
                            >
                              Update
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleRemove("vocab", list.id)}
                              disabled={isSubmitting}
                            >
                              Remove
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                void handleDeleteContent(
                                  "vocab",
                                  list.id,
                                  list.name,
                                  firstItem?.id
                                )
                              }
                              disabled={isSubmitting}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSectionHeader("Pronunciation", `Create, update, assign, and remove pronunciation exercises in ${classroom.name}.`)}

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {editingPronunciationId
              ? "Update Pronunciation Exercise"
              : "Create Pronunciation Exercise"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPronunciation} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Target Text</label>
                <Input
                  value={pronunciationTargetText}
                  onChange={(e) => setPronunciationTargetText(e.target.value)}
                  placeholder="Example: I read English every day."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={pronunciationType}
                  onChange={(e) =>
                    setPronunciationType(e.target.value as PronunciationType)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="word">word</option>
                  <option value="phrase">phrase</option>
                  <option value="sentence">sentence</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <select
                  value={pronunciationLevel}
                  onChange={(e) =>
                    setPronunciationLevel(e.target.value as ContentLevel)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructions</label>
              <textarea
                rows={5}
                value={pronunciationInstructions}
                onChange={(e) => setPronunciationInstructions(e.target.value)}
                placeholder="Read the sentence clearly and focus on pronunciation."
                className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Vocabulary</label>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                  {teacherVocabItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No vocabulary items available yet.
                    </p>
                  ) : (
                    teacherVocabItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                      >
                        <input
                          type="checkbox"
                          checked={pronunciationVocabLinks.includes(item.id)}
                          onChange={() =>
                            setPronunciationVocabLinks((prev) => toggleId(prev, item.id))
                          }
                          className="mt-1"
                        />
                        <span>
                          <span className="font-medium">{item.word}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.phonetic}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link Stories</label>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
                  {teacherStories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No stories available yet.
                    </p>
                  ) : (
                    teacherStories.map((story) => (
                      <label
                        key={story.id}
                        className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/40"
                      >
                        <input
                          type="checkbox"
                          checked={pronunciationStoryLinks.includes(story.id)}
                          onChange={() =>
                            setPronunciationStoryLinks((prev) =>
                              toggleId(prev, story.id)
                            )
                          }
                          className="mt-1"
                        />
                        <span>
                          <span className="font-medium">{story.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {story.level}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {pronunciationFormError && (
              <p className="text-sm text-destructive">{pronunciationFormError}</p>
            )}

            <div className="flex justify-end gap-2">
              {editingPronunciationId && (
                <Button type="button" variant="outline" onClick={resetPronunciationForm}>
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={isCreatingPronunciation || isUpdatingPronunciation}
              >
                {editingPronunciationId
                  ? isUpdatingPronunciation
                    ? "Updating..."
                    : "Update Pronunciation"
                  : isCreatingPronunciation
                  ? "Creating..."
                  : "Create and Assign"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {actionErrorCard}

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Assigned Pronunciation Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <select
              value={selectedPronunciationId}
              onChange={(e) => setSelectedPronunciationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select pronunciation exercises</option>
              {availablePronunciation.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              disabled={!selectedPronunciationId || isSubmitting}
              onClick={() => void handleAssign("pronunciation", selectedPronunciationId)}
            >
              {isSubmitting ? "Saving..." : "Assign"}
            </Button>
          </div>

          {selectedClassroomContent.pronunciationExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pronunciation exercises assigned to this classroom yet.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedClassroomContent.pronunciationExercises.map(
               (exercise: PronunciationExercise & { assignedAt?: string }) => {
                const exerciseWithLinks = exercise as typeof exercise & {
                 vocabLinks?: string[];
                  storyLinks?: string[];
              };

        return (
         <div
        key={exercise.id}
        className="rounded-lg border border-border/60 p-4 bg-background"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium break-words">{exercise.targetText}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {exercise.instructions}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Type: {exercise.type}
            </p>

            {exercise.assignedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned {new Date(exercise.assignedAt).toLocaleDateString("en-GB")}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <LevelBadge level={exercise.level} />

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  startEditPronunciation({
                    id: exercise.id,
                    targetText: exercise.targetText,
                    type: exercise.type as PronunciationType,
                    level: exercise.level,
                    instructions: exercise.instructions,
                    vocabLinks: exerciseWithLinks.vocabLinks ?? [],
                    storyLinks: exerciseWithLinks.storyLinks ?? [],
                  })
                }
              >
                Update
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRemove("pronunciation", exercise.id)}
                disabled={isSubmitting}
              >
                Remove
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() =>
                  void handleDeleteContent(
                    "pronunciation",
                    exercise.id,
                    exercise.targetText
                  )
                }
                disabled={isSubmitting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}