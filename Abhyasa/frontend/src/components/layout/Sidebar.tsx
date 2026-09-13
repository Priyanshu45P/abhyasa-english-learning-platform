import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  LogOut,
  ShieldCheck,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: ShieldCheck },
];

const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classrooms", label: "Classrooms", icon: School },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/classrooms", label: "My Classrooms", icon: School },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  const links =
    currentUser?.role === "admin"
      ? adminLinks
      : currentUser?.role === "student"
      ? studentLinks
      : teacherLinks;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <GraduationCap className="size-7 text-sidebar-primary" />
        <span className="font-display text-xl font-bold tracking-tight text-sidebar-foreground">
          Abhyasa
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {links.map((link) => {
          const isActive = pathname === link.to || pathname.startsWith(link.to + "/");

          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <link.icon className="size-[18px] shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 mb-3">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {currentUser?.name}
          </p>
          <p className="text-xs text-sidebar-foreground/50 capitalize">
            {currentUser?.role}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}