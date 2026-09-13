import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentUser.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
}