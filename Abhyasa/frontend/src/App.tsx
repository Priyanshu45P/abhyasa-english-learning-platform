import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminClassroomsPage from "@/pages/admin/AdminClassroomsPage";
import AdminClassroomDetail from "@/pages/admin/AdminClassroomDetail";
import AdminTeacherAnalytics from "@/pages/admin/AdminTeacherAnalytics";
import AdminStudentAnalytics from "@/pages/admin/AdminStudentAnalytics";

import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherClassroomsPage from "@/pages/teacher/ClassroomsPage";
import TeacherClassroomDetail from "@/pages/teacher/ClassroomDetail";
import QuizResultsPage from "@/pages/teacher/QuizResultsPage";
import StudentAnalytics from "@/pages/teacher/StudentAnalytics";

import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentClassroomsPage from "@/pages/student/ClassroomsPage";
import StudentClassroomDetail from "@/pages/student/ClassroomDetail";
import GrammarDetail from "@/pages/student/GrammarDetail";
import StoryDetail from "@/pages/student/StoryDetail";
import QuizAttempt from "@/pages/student/QuizAttempt";
import PronunciationPractice from "@/pages/student/PronunciationPractice";
import VocabDetail from "@/pages/student/VocabDetail";
import MyProgress from "@/pages/student/MyProgress";
import QuizHistory from "@/pages/student/QuizHistory";

function RootRedirect() {
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (currentUser.role === "teacher") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/classrooms" element={<AdminClassroomsPage />} />
            <Route path="/admin/classrooms/:id" element={<AdminClassroomDetail />} />
            <Route path="/admin/teacher-analytics" element={<AdminTeacherAnalytics />} />
            <Route path="/admin/student-analytics" element={<AdminStudentAnalytics />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route element={<AppShell />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/classrooms" element={<TeacherClassroomsPage />} />
            <Route path="/teacher/classrooms/:id" element={<TeacherClassroomDetail />} />
            <Route path="/teacher/quiz-results" element={<QuizResultsPage />} />
            <Route path="/teacher/students/:studentId" element={<StudentAnalytics />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<AppShell />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/classrooms" element={<StudentClassroomsPage />} />
            <Route path="/student/classrooms/:id" element={<StudentClassroomDetail />} />
            <Route path="/student/progress" element={<MyProgress />} />
            <Route path="/student/quiz-history" element={<QuizHistory />} />

            <Route path="/student/grammar/:id" element={<GrammarDetail />} />
            <Route path="/student/stories/:id" element={<StoryDetail />} />
            <Route path="/student/quizzes/:id" element={<QuizAttempt />} />
            <Route path="/student/pronunciation/:id" element={<PronunciationPractice />} />
            <Route path="/student/vocab/:id" element={<VocabDetail />} />

            <Route
              path="/student/classrooms/:classroomId/grammar/:id"
              element={<GrammarDetail />}
            />
            <Route
              path="/student/classrooms/:classroomId/stories/:id"
              element={<StoryDetail />}
            />
            <Route
              path="/student/classrooms/:classroomId/quizzes/:id"
              element={<QuizAttempt />}
            />
            <Route
              path="/student/classrooms/:classroomId/pronunciation"
              element={<PronunciationPractice />}
            />
            <Route
              path="/student/classrooms/:classroomId/pronunciation/:id"
              element={<PronunciationPractice />}
            />
            <Route
              path="/student/classrooms/:classroomId/vocab/:id"
              element={<VocabDetail />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}