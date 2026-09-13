import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  BarChart3,
  BookOpen,
  GraduationCap,
  LogOut,
  ClipboardList,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function AppSidebar() {
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
  };

  const adminLinks = [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Classrooms",
      to: "/admin/classrooms",
      icon: School,
    },
    {
      label: "Teacher Analytics",
      to: "/admin/teacher-analytics",
      icon: BarChart3,
    },
    {
     label: "Student Analytics",
     to: "/admin/student-analytics",
     icon: Users,
    },
  ];

  const teacherLinks = [
    {
      label: "Dashboard",
      to: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Classrooms",
      to: "/teacher/classrooms",
      icon: School,
    },
    {
      label: "Quiz Results",
      to: "/teacher/quiz-results",
      icon: ClipboardList,
    },
  ];

  const studentLinks = [
    {
      label: "Dashboard",
      to: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Classrooms",
      to: "/student/classrooms",
      icon: School,
    },
    {
      label: "My Progress",
      to: "/student/progress",
      icon: BarChart3,
    },
    {
      label: "Quiz History",
      to: "/student/quiz-history",
      icon: ClipboardList,
    },
  ];

  const navLinks =
    currentUser?.role === "admin"
      ? adminLinks
      : currentUser?.role === "teacher"
      ? teacherLinks
      : studentLinks;

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-[#0c4a43] text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#f4b93b] p-2 text-[#0c4a43]">
            <BookOpen className="size-6" />
          </div>

          <div>
            <p className="text-2xl font-bold leading-none text-white">Abhyasa</p>
            <p className="mt-1 text-sm text-white/70">Learning Platform</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="mb-6 rounded-2xl bg-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#f4b93b] p-2 text-[#0c4a43]">
              <GraduationCap className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {currentUser?.name ?? "User"}
              </p>
              <p className="text-sm capitalize text-white/70">
                {currentUser?.role ?? "student"}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors ${
                  isActive(item.to)
                    ? "bg-white/15 text-[#f4b93b]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 px-4 py-4">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-white/85 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}