import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export type ProgressContentType =
  | "grammar"
  | "story"
  | "vocab"
  | "pronunciation"
  | "quiz";

export type ProgressItem = {
  id: string;
  userId: string;
  contentType: ProgressContentType;
  contentId: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  userNameSnapshot: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
};

export type PronunciationAttempt = {
  id: string;
  exerciseId: string;
  userId: string;
  expected: string;
  transcript: string;
  score: "exact" | "close" | "mismatch";
  matchPercent: number;
  feedback: string;
  timestamp: string;
};

export type StudentAnalytics = {
  completions: ProgressItem[];
  quizAttempts: QuizAttempt[];
  pronunciationAttempts: PronunciationAttempt[];
};

export type TeacherQuizAttempt = {
  id: string;
  quizId: string;
  quizTitle: string;
  quizLevel: "beginner" | "intermediate" | "advanced";
  userId: string;
  userNameSnapshot: string;
  userEmail: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  classrooms: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

export type TeacherPronunciationAttempt = {
  id: string;
  exerciseId: string;
  exerciseTargetText: string;
  exerciseLevel: "beginner" | "intermediate" | "advanced";
  userId: string;
  userNameSnapshot: string;
  userEmail: string;
  expected: string;
  transcript: string;
  score: "exact" | "close" | "mismatch";
  matchPercent: number;
  feedback: string;
  timestamp: string;
};

export type TeacherCompletion = {
  id: string;
  userId: string;
  userNameSnapshot: string;
  userEmail: string;
  contentType: ProgressContentType;
  contentId: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAnalytics = {
  classrooms: Array<{
    id: string;
    name: string;
    code: string;
    createdAt: string;
    studentsCount: number;
    students: Array<{
      id: string;
      name: string;
      email: string;
      joinedAt: string;
    }>;
  }>;
  quizAttempts: TeacherQuizAttempt[];
  pronunciationAttempts: TeacherPronunciationAttempt[];
  completions: TeacherCompletion[];
};

export type SelectedStudentAnalytics = {
  quizAttempts: QuizAttempt[];
  pronunciationAttempts: PronunciationAttempt[];
};

interface ProgressState {
  progressItems: ProgressItem[];
  studentAnalytics: StudentAnalytics | null;
  teacherAnalytics: TeacherAnalytics | null;
  selectedStudentAnalytics: SelectedStudentAnalytics | null;
  isLoading: boolean;
  error: string | null;

  fetchMyProgress: () => Promise<void>;
  markComplete: (
    contentType: ProgressContentType,
    contentId: string
  ) => Promise<{ success: boolean; error?: string }>;
  fetchStudentAnalytics: () => Promise<void>;
  fetchTeacherAnalytics: () => Promise<void>;
  fetchStudentDetails: (studentId: string) => Promise<void>;
  isCompleted: (contentType: ProgressContentType, contentId: string) => boolean;
  getCompletedCountByType: (contentType: ProgressContentType) => number;
  getTotalCompletedCount: () => number;
  clearProgress: () => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressItems: [],
  studentAnalytics: null,
  teacherAnalytics: null,
  selectedStudentAnalytics: null,
  isLoading: false,
  error: null,

  fetchMyProgress: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<ProgressItem[]>("/progress");

      set({
        progressItems: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  markComplete: async (contentType, contentId) => {
    try {     // Send completed content to backend.
      const data = await apiFetch<ProgressItem>("/progress/complete", {
        method: "POST",
        body: JSON.stringify({
          contentType,
          contentId,
        }),
      });

      set((state) => {
        const remainingItems = state.progressItems.filter(
          (item) =>
            !(
              item.contentType === contentType &&
              item.contentId === contentId
            )
        );

        return {
          progressItems: [data, ...remainingItems],
          studentAnalytics: state.studentAnalytics
            ? {
                ...state.studentAnalytics,
                completions: [
                  data,
                  ...state.studentAnalytics.completions.filter(
                    (item) =>
                      !(
                        item.contentType === contentType &&
                        item.contentId === contentId
                      )
                  ),
                ],
              }
            : state.studentAnalytics,
          error: null,
        };
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  },

  fetchStudentAnalytics: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<StudentAnalytics>("/progress/student");

      set({
        studentAnalytics: data,
        progressItems: data.completions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  fetchTeacherAnalytics: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<TeacherAnalytics>("/progress/teacher");

      set({
        teacherAnalytics: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  fetchStudentDetails: async (studentId) => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<SelectedStudentAnalytics>(
        `/progress/teacher/student/${studentId}`
      );

      set({
        selectedStudentAnalytics: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  isCompleted: (contentType, contentId) => {
    return get().progressItems.some(
      (item) =>
        item.contentType === contentType &&
        item.contentId === contentId &&
        item.completed
    );
  },

  getCompletedCountByType: (contentType) => {
    return get().progressItems.filter(
      (item) => item.contentType === contentType && item.completed
    ).length;
  },

  getTotalCompletedCount: () => {
    return get().progressItems.filter((item) => item.completed).length;
  },

  clearProgress: () => {
    set({
      progressItems: [],
      studentAnalytics: null,
      teacherAnalytics: null,
      selectedStudentAnalytics: null,
      isLoading: false,
      error: null,
    });
  },
}));