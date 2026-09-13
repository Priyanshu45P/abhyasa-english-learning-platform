import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import type {
  GrammarLesson,
  Story,
  StoryVocabRef,
  VocabItem,
  VocabList,
  ContentLevel,
  PronunciationExercise,
  Quiz,
  QuizContentLink,
} from "@/types";

type CreateGrammarInput = {
  title: string;
  content: string;
  level: ContentLevel;
  tags?: string[];
};

type UpdateGrammarInput = {
  id: string;
  title: string;
  content: string;
  level: ContentLevel;
  tags?: string[];
};

type CreateStoryInput = {
  title: string;
  summary: string;
  content: string;
  level: ContentLevel;
  tags?: string[];
  grammarRefs?: string[];
  vocabRefs?: StoryVocabRef[];
};

type UpdateStoryInput = {
  id: string;
  title: string;
  summary: string;
  content: string;
  level: ContentLevel;
  tags?: string[];
  grammarRefs?: string[];
  vocabRefs?: StoryVocabRef[];
};

type CreateVocabListInput = {
  name: string;
  description: string;
  level: ContentLevel;
};

type UpdateVocabListInput = {
  id: string;
  name: string;
  description: string;
  level: ContentLevel;
};

type CreateVocabItemInput = {
  listId: string;
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  level: ContentLevel;
};

type UpdateVocabItemInput = {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  level: ContentLevel;
};

type EditableQuizQuestion = {
  text: string;
  explanation: string;
  options: string[];
  correctOptionIndex: number;
};

type CreateQuizInput = {
  title: string;
  description: string;
  level: ContentLevel;
  questions: EditableQuizQuestion[];
  contentLinks?: QuizContentLink[];
};

type UpdateQuizInput = {
  id: string;
  title: string;
  description: string;
  level: ContentLevel;
  questions: EditableQuizQuestion[];
  contentLinks?: QuizContentLink[];
};

type CreatePronunciationInput = {
  targetText: string;
  type: "word" | "phrase" | "sentence";
  level: ContentLevel;
  instructions: string;
  vocabLinks?: string[];
  storyLinks?: string[];
};

type UpdatePronunciationInput = {
  id: string;
  targetText: string;
  type: "word" | "phrase" | "sentence";
  level: ContentLevel;
  instructions: string;
  vocabLinks?: string[];
  storyLinks?: string[];
};

interface ContentState {
  grammarLessons: GrammarLesson[];
  stories: Story[];
  vocabLists: VocabList[];
  vocabItems: VocabItem[];
  pronunciationExercises: PronunciationExercise[];
  quizzes: Quiz[];
  initialized: boolean;
  isLoading: boolean;
  error: string | null;

  fetchGrammarLessons: () => Promise<void>;
  fetchStories: () => Promise<void>;
  fetchVocabLists: () => Promise<void>;
  fetchVocabItems: () => Promise<void>;
  fetchPronunciationExercises: () => Promise<void>;
  fetchQuizzes: () => Promise<void>;
  initializeContent: () => Promise<void>;
  refreshAll: () => Promise<void>;

  getGrammarLessonById: (id: string) => GrammarLesson | undefined;
  getStoryById: (id: string) => Story | undefined;
  getVocabListById: (id: string) => VocabList | undefined;
  getVocabItemsByListId: (listId: string) => VocabItem[];
  getQuizById: (id: string) => Quiz | undefined;

  createGrammarLesson: (
    input: CreateGrammarInput
  ) => Promise<{ success: boolean; data?: GrammarLesson; error?: string }>;
  updateGrammarLesson: (
    input: UpdateGrammarInput
  ) => Promise<{ success: boolean; data?: GrammarLesson; error?: string }>;
  deleteGrammarLesson: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;

  createStory: (
    input: CreateStoryInput
  ) => Promise<{ success: boolean; data?: Story; error?: string }>;
  updateStory: (
    input: UpdateStoryInput
  ) => Promise<{ success: boolean; data?: Story; error?: string }>;
  deleteStory: (id: string) => Promise<{ success: boolean; error?: string }>;
    
  createQuiz: (
    input: CreateQuizInput
  ) => Promise<{ success: boolean; data?: Quiz; error?: string }>;
  updateQuiz: (
    input: UpdateQuizInput
  ) => Promise<{ success: boolean; data?: Quiz; error?: string }>;
  deleteQuiz: (id: string) => Promise<{ success: boolean; error?: string }>;

  createPronunciationExercise: (
    input: CreatePronunciationInput
  ) => Promise<{ success: boolean; data?: PronunciationExercise; error?: string }>;
  updatePronunciationExercise: (
    input: UpdatePronunciationInput
  ) => Promise<{ success: boolean; data?: PronunciationExercise; error?: string }>;
  deletePronunciationExercise: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;

  createVocabList: (
    input: CreateVocabListInput
  ) => Promise<{ success: boolean; data?: VocabList; error?: string }>;
  updateVocabList: (
    input: UpdateVocabListInput
  ) => Promise<{ success: boolean; data?: VocabList; error?: string }>;
  deleteVocabList: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;

  createVocabItem: (
    input: CreateVocabItemInput
  ) => Promise<{ success: boolean; data?: VocabItem; error?: string }>;
  updateVocabItem: (
    input: UpdateVocabItemInput
  ) => Promise<{ success: boolean; data?: VocabItem; error?: string }>;
  deleteVocabItem: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export const useContentStore = create<ContentState>((set, get) => ({
  grammarLessons: [],
  stories: [],
  vocabLists: [],
  vocabItems: [],
  pronunciationExercises: [],
  quizzes: [],
  initialized: false,
  isLoading: false,
  error: null,

  fetchGrammarLessons: async () => {
    const data = await apiFetch<GrammarLesson[]>("/grammar");
    set({ grammarLessons: data, error: null });
  },

  fetchStories: async () => {
    const data = await apiFetch<Story[]>("/stories");
    set({ stories: data, error: null });
  },

  fetchVocabLists: async () => {
    const data = await apiFetch<VocabList[]>("/vocab/lists");
    set({ vocabLists: data, error: null });
  },

  fetchVocabItems: async () => {
    const data = await apiFetch<VocabItem[]>("/vocab/items");
    set({ vocabItems: data, error: null });
  },

  fetchPronunciationExercises: async () => {
    const data = await apiFetch<PronunciationExercise[]>("/pronunciation");
    set({ pronunciationExercises: data, error: null });
  },

  fetchQuizzes: async () => {
    const data = await apiFetch<Quiz[]>("/quizzes");
    set({ quizzes: data, error: null });
  },

  initializeContent: async () => {
    const { initialized, isLoading } = get();
    if (initialized || isLoading) return;

    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().fetchGrammarLessons(),
        get().fetchStories(),
        get().fetchVocabLists(),
        get().fetchVocabItems(),
        get().fetchPronunciationExercises(),
        get().fetchQuizzes(),
      ]);

      set({ initialized: true, isLoading: false, error: null });
    } catch (error) {
      set({
        initialized: true,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  refreshAll: async () => {
    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().fetchGrammarLessons(),
        get().fetchStories(),
        get().fetchVocabLists(),
        get().fetchVocabItems(),
        get().fetchPronunciationExercises(),
        get().fetchQuizzes(),
      ]);

      set({ initialized: true, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  getGrammarLessonById: (id) =>
    get().grammarLessons.find((item) => item.id === id),

  getStoryById: (id) => get().stories.find((item) => item.id === id),

  getVocabListById: (id) => get().vocabLists.find((item) => item.id === id),

  getVocabItemsByListId: (listId) =>
    get().vocabItems.filter((item) => item.listId === listId),

  getQuizById: (id) => get().quizzes.find((item) => item.id === id),

  createGrammarLesson: async (input) => {
    try {
      const created = await apiFetch<GrammarLesson>("/grammar", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          level: input.level,
          tags: input.tags ?? [],
        }),
      });

      await get().fetchGrammarLessons();
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updateGrammarLesson: async (input) => {
    try {
      const updated = await apiFetch<GrammarLesson>(`/grammar/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          level: input.level,
          tags: input.tags ?? [],
        }),
      });

      await get().fetchGrammarLessons();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deleteGrammarLesson: async (id) => {
    try {
      await apiFetch<void>(`/grammar/${id}`, {
        method: "DELETE",
      });

      set({
        grammarLessons: get().grammarLessons.filter((item) => item.id !== id),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  createStory: async (input) => {
    try {
      const created = await apiFetch<Story>("/stories", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          summary: input.summary,
          content: input.content,
          level: input.level,
          tags: input.tags ?? [],
          grammarRefs: input.grammarRefs ?? [],
          vocabRefs: input.vocabRefs ?? [],
        }),
      });

      await get().fetchStories();
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updateStory: async (input) => {
    try {
      const updated = await apiFetch<Story>(`/stories/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: input.title,
          summary: input.summary,
          content: input.content,
          level: input.level,
          tags: input.tags ?? [],
          grammarRefs: input.grammarRefs ?? [],
          vocabRefs: input.vocabRefs ?? [],
        }),
      });

      await get().fetchStories();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deleteStory: async (id) => {
    try {
      await apiFetch<void>(`/stories/${id}`, {
        method: "DELETE",
      });

      set({
        stories: get().stories.filter((item) => item.id !== id),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  createQuiz: async (input) => {
    try {
      const created = await apiFetch<Quiz>("/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          level: input.level,
          questions: input.questions.map((question) => ({
            text: question.text,
            explanation: question.explanation,
            options: question.options.map((text) => ({ text })),
            correctOptionIndex: question.correctOptionIndex,
          })),
          contentLinks: input.contentLinks ?? [],
        }),
      });

      await get().fetchQuizzes();
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updateQuiz: async (input) => {
    try {
      const updated = await apiFetch<Quiz>(`/quizzes/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          level: input.level,
          questions: input.questions.map((question) => ({
            text: question.text,
            explanation: question.explanation,
            options: question.options.map((text) => ({ text })),
            correctOptionIndex: question.correctOptionIndex,
          })),
          contentLinks: input.contentLinks ?? [],
        }),
      });

      await get().fetchQuizzes();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deleteQuiz: async (id) => {
    try {
      await apiFetch<void>(`/quizzes/${id}`, {
        method: "DELETE",
      });

      set({
        quizzes: get().quizzes.filter((item) => item.id !== id),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  createPronunciationExercise: async (input) => {
    try {
      const created = await apiFetch<PronunciationExercise>("/pronunciation", {
        method: "POST",
        body: JSON.stringify({
          targetText: input.targetText,
          type: input.type,
          level: input.level,
          instructions: input.instructions,
          vocabLinks: input.vocabLinks ?? [],
          storyLinks: input.storyLinks ?? [],
        }),
      });

      await get().fetchPronunciationExercises();
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updatePronunciationExercise: async (input) => {
    try {
      const updated = await apiFetch<PronunciationExercise>(
        `/pronunciation/${input.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            targetText: input.targetText,
            type: input.type,
            level: input.level,
            instructions: input.instructions,
            vocabLinks: input.vocabLinks ?? [],
            storyLinks: input.storyLinks ?? [],
          }),
        }
      );

      await get().fetchPronunciationExercises();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deletePronunciationExercise: async (id) => {
    try {
      await apiFetch<void>(`/pronunciation/${id}`, {
        method: "DELETE",
      });

      set({
        pronunciationExercises: get().pronunciationExercises.filter(
          (item) => item.id !== id
        ),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  createVocabList: async (input) => {
    try {
      const created = await apiFetch<VocabList>("/vocab/lists", {
        method: "POST",
        body: JSON.stringify(input),
      });

      await get().fetchVocabLists();
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updateVocabList: async (input) => {
    try {
      const updated = await apiFetch<VocabList>(`/vocab/lists/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          level: input.level,
        }),
      });

      await get().fetchVocabLists();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deleteVocabList: async (id) => {
    try {
      await apiFetch<void>(`/vocab/lists/${id}`, {
        method: "DELETE",
      });

      set({
        vocabLists: get().vocabLists.filter((item) => item.id !== id),
        vocabItems: get().vocabItems.filter((item) => item.listId !== id),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  createVocabItem: async (input) => {
    try {
      const created = await apiFetch<VocabItem>("/vocab/items", {
        method: "POST",
        body: JSON.stringify(input),
      });

      await Promise.all([get().fetchVocabItems(), get().fetchVocabLists()]);
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  updateVocabItem: async (input) => {
    try {
      const updated = await apiFetch<VocabItem>(`/vocab/items/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          word: input.word,
          definition: input.definition,
          example: input.example,
          phonetic: input.phonetic,
          level: input.level,
        }),
      });

      await get().fetchVocabItems();
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  deleteVocabItem: async (id) => {
    try {
      await apiFetch<void>(`/vocab/items/${id}`, {
        method: "DELETE",
      });

      set({
        vocabItems: get().vocabItems.filter((item) => item.id !== id),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
}));