import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import type {
  ClassroomContentPayload,
  ClassroomContentType,
  JoinedClassroom,
  TeacherClassroom,
} from "@/types";

interface ClassroomState {
  teacherClassrooms: TeacherClassroom[];
  studentClassrooms: JoinedClassroom[];
  selectedClassroomContent: ClassroomContentPayload | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  detailError: string | null;
  fetchTeacherClassrooms: () => Promise<void>;
  fetchStudentClassrooms: () => Promise<void>;
  fetchClassroomContent: (classroomId: string) => Promise<void>;
  createClassroom: (name: string) => Promise<{ success: boolean; error?: string }>;
  joinClassroom: (code: string) => Promise<{ success: boolean; error?: string }>;
  deleteClassroom: (classroomId: string) => Promise<{ success: boolean; error?: string }>;
  assignContentToClassroom: (
    classroomId: string,
    contentType: ClassroomContentType,
    contentId: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeContentFromClassroom: (
    classroomId: string,
    contentType: ClassroomContentType,
    contentId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearSelectedClassroomContent: () => void;
  clearClassrooms: () => void;
}

type AssignOrRemoveContentResponse = {
  message: string;
  contentType: ClassroomContentType;
  contentId: string;
  classroomContent?: ClassroomContentPayload | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  teacherClassrooms: [],
  studentClassrooms: [],
  selectedClassroomContent: null,
  isLoading: false,
  isDetailLoading: false,
  error: null,
  detailError: null,

  fetchTeacherClassrooms: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<TeacherClassroom[]>("/classrooms/teacher");

      set({
        teacherClassrooms: data,
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

  fetchStudentClassrooms: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await apiFetch<JoinedClassroom[]>("/classrooms/student");

      set({
        studentClassrooms: data,
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

  fetchClassroomContent: async (classroomId) => {
    try {
      set({
        isDetailLoading: true,
        detailError: null,
      });

      const data = await apiFetch<ClassroomContentPayload>(
        `/classrooms/${classroomId}/content`
      );

      set({
        selectedClassroomContent: data,
        isDetailLoading: false,
        detailError: null,
      });
    } catch (error) {
      set({
        selectedClassroomContent: null,
        isDetailLoading: false,
        detailError: getErrorMessage(error),
      });
    }
  },

  createClassroom: async (name) => {
    try {
      await apiFetch<{
        id: string;
        name: string;
        code: string;
        teacherId: string;
        createdAt: string;
      }>("/classrooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      await get().fetchTeacherClassrooms();

      set({ error: null });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      return { success: false, error: message };
    }
  },

  joinClassroom: async (code) => {
    try {
      await apiFetch<{
        message: string;
        classroom: {
          id: string;
          name: string;
          code: string;
          teacher: {
            id: string;
            name: string;
            email: string;
          };
        };
        joinedAt: string;
      }>("/classrooms/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      await get().fetchStudentClassrooms();

      set({ error: null });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      return { success: false, error: message };
    }
  },

  deleteClassroom: async (classroomId) => {
    try {
      await apiFetch(`/classrooms/${classroomId}`, {
        method: "DELETE",
      });

      set((state) => ({
        teacherClassrooms: state.teacherClassrooms.filter(
          (classroom) => classroom.id !== classroomId
        ),
        error: null,
      }));

      if (get().selectedClassroomContent?.classroom.id === classroomId) {
        set({
          selectedClassroomContent: null,
          detailError: null,
        });
      }

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      return { success: false, error: message };
    }
  },

  assignContentToClassroom: async (classroomId, contentType, contentId) => {
    try {
      const result = await apiFetch<AssignOrRemoveContentResponse>(
        `/classrooms/${classroomId}/content`,
        {
          method: "POST",
          body: JSON.stringify({ contentType, contentId }),
        }
      );

      if (result.classroomContent) {
        set({
          selectedClassroomContent: result.classroomContent,
          detailError: null,
        });
      } else {
        await get().fetchClassroomContent(classroomId);
      }

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ detailError: message });
      return { success: false, error: message };
    }
  },

  removeContentFromClassroom: async (classroomId, contentType, contentId) => {
    try {
      const result = await apiFetch<AssignOrRemoveContentResponse>(
        `/classrooms/${classroomId}/content`,
        {
          method: "DELETE",
          body: JSON.stringify({ contentType, contentId }),
        }
      );

      if (result.classroomContent) {
        set({
          selectedClassroomContent: result.classroomContent,
          detailError: null,
        });
      } else {
        await get().fetchClassroomContent(classroomId);
      }

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ detailError: message });
      return { success: false, error: message };
    }
  },

  clearSelectedClassroomContent: () => {
    set({
      selectedClassroomContent: null,
      isDetailLoading: false,
      detailError: null,
    });
  },

  clearClassrooms: () => {
    set({
      teacherClassrooms: [],
      studentClassrooms: [],
      selectedClassroomContent: null,
      isLoading: false,
      isDetailLoading: false,
      error: null,
      detailError: null,
    });
  },
}));