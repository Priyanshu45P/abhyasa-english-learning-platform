import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import type { Quiz } from "@/types";

interface QuizState {
  quizzes: Quiz[];
  initialized: boolean;
  isLoading: boolean;
  error: string | null;
  fetchQuizzes: () => Promise<void>;
  initializeQuizzes: () => Promise<void>;
  getQuizById: (id: string) => Quiz | undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  initialized: false,
  isLoading: false,
  error: null,

  fetchQuizzes: async () => {
    const data = await apiFetch<Quiz[]>("/quizzes");
    set({ quizzes: data, error: null });
  },

  initializeQuizzes: async () => {
    if (get().initialized || get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      await get().fetchQuizzes();
      set({ initialized: true, isLoading: false, error: null });
    } catch (error) {
      set({
        initialized: true,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  getQuizById: (id) => get().quizzes.find((item) => item.id === id),
}));