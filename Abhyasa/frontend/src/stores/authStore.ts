import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";
import { apiFetch, getAuthToken, setAuthToken } from "@/lib/api";

type LoginResponse = {
  token: string;
  user: User;
};

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  initialized: boolean;

  initializeAuth: () => Promise<void>;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: Extract<UserRole, "teacher" | "student">
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

async function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    ),
  ]);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      isLoading: false,
      initialized: false,

      initializeAuth: async () => {
        if (get().initialized) return;

        const token = getAuthToken();

        if (!token) {
          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });
          return;
        }

        set({
          token,
          isLoading: true,
          initialized: false,
        });

        try {
          const user = await withTimeout(apiFetch<User>("/auth/me"), 5000);

          set({
            currentUser: user,
            token,
            isLoading: false,
            initialized: true,
          });
        } catch {
          setAuthToken(null);
          localStorage.removeItem("abhyasa-auth");

          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });
        }
      },

      fetchMe: async () => {
        try {
          const user = await apiFetch<User>("/auth/me");
          set({ currentUser: user });
        } catch {
          setAuthToken(null);
          localStorage.removeItem("abhyasa-auth");
          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
 // Send email and password to backend.
          const data = await apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });

          setAuthToken(data.token);

          set({
            currentUser: data.user,
            token: data.token,
            isLoading: false,
            initialized: true,
          });

          return { success: true };
        } catch (error) {
              // If login fails, clear user state.
          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });
          return { success: false, error: getErrorMessage(error) };
        }
      },

      register: async (name, email, password, role) => {
        try {
          set({ isLoading: true });

          await apiFetch<User>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password, role }),
          });

          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });

          return { success: true };
        } catch (error) {
          set({
            currentUser: null,
            token: null,
            isLoading: false,
            initialized: true,
          });
          return { success: false, error: getErrorMessage(error) };
        }
      },

      logout: () => {
        setAuthToken(null);
        localStorage.removeItem("abhyasa-auth");

        set({
          currentUser: null,
          token: null,
          isLoading: false,
          initialized: true,
        });
      },
    }),
    {
      name: "abhyasa-auth",
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
      }),
    }
  )
);  