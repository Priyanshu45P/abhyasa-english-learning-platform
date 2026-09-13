import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  UserRound,
  BookOpen,
  BookText,
  Languages,
  Mic,
  ClipboardCheck,
  BarChart3,
  School,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

type AdminStats = {
  usersCount?: number;
  teachersCount?: number;
  studentsCount?: number;
  classroomsCount?: number;
  grammarCount?: number;
  storiesCount?: number;
  vocabListsCount?: number;
  vocabItemsCount?: number;
  pronunciationCount?: number;
  quizzesCount?: number;
  quizAttemptsCount?: number;
  pronunciationAttemptsCount?: number;
  progressCount?: number;

  totalUsers?: number;
  totalTeachers?: number;
  totalStudents?: number;
  totalClassrooms?: number;
  totalGrammar?: number;
  totalStories?: number;
  totalVocabLists?: number;
  totalVocabItems?: number;
  totalPronunciation?: number;
  totalQuizzes?: number;
  totalQuizAttempts?: number;
  totalPronunciationAttempts?: number;
};

type AdminUser = Omit<User, "password">;

type RoleFilter = "all" | "admin" | "teacher" | "student";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userActionLoadingId, setUserActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, usersData] = await Promise.all([
        apiFetch<AdminStats>("/admin/dashboard"),
        apiFetch<AdminUser[]>("/admin/users"),
      ]);

      setStats(dashboardData);
      setUsers(usersData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const roleMatches = roleFilter === "all" || user.role === roleFilter;
      const searchMatches =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      return roleMatches && searchMatches;
    });
  }, [users, roleFilter, searchTerm]);

  const handleRoleChange = async (
    userId: string,
    nextRole: "admin" | "teacher" | "student"
  ) => {
    try {
      setUserActionLoadingId(userId);
      setError("");

      const updated = await apiFetch<AdminUser>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user))
      );

      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user role.");
    } finally {
      setUserActionLoadingId("");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      setUserActionLoadingId(userId);
      setError("");

      await apiFetch(`/admin/users/${userId}`, {
        method: "DELETE",
      });

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setUserActionLoadingId("");
    }
  };

  const cards = [
    {
      title: "Total Users",
      value: stats?.usersCount ?? stats?.totalUsers ?? 0,
      icon: Users,
    },
    {
      title: "Teachers",
      value: stats?.teachersCount ?? stats?.totalTeachers ?? 0,
      icon: GraduationCap,
    },
    {
      title: "Students",
      value: stats?.studentsCount ?? stats?.totalStudents ?? 0,
      icon: UserRound,
    },
    {
      title: "Classrooms",
      value: stats?.classroomsCount ?? stats?.totalClassrooms ?? 0,
      icon: School,
    },
    {
      title: "Grammar",
      value: stats?.grammarCount ?? stats?.totalGrammar ?? 0,
      icon: BookOpen,
    },
    {
      title: "Stories",
      value: stats?.storiesCount ?? stats?.totalStories ?? 0,
      icon: BookText,
    },
    {
      title: "Vocab Lists",
      value: stats?.vocabListsCount ?? stats?.totalVocabLists ?? 0,
      icon: Languages,
    },
    {
      title: "Vocab Items",
      value: stats?.vocabItemsCount ?? stats?.totalVocabItems ?? 0,
      icon: Languages,
    },
    {
      title: "Pronunciation",
      value: stats?.pronunciationCount ?? stats?.totalPronunciation ?? 0,
      icon: Mic,
    },
    {
      title: "Quizzes",
      value: stats?.quizzesCount ?? stats?.totalQuizzes ?? 0,
      icon: ClipboardCheck,
    },
    {
      title: "Quiz Attempts",
      value: stats?.quizAttemptsCount ?? stats?.totalQuizAttempts ?? 0,
      icon: ClipboardCheck,
    },
    {
      title: "Pronunciation Attempts",
      value:
        stats?.pronunciationAttemptsCount ??
        stats?.totalPronunciationAttempts ??
        0,
      icon: Mic,
    },
    {
      title: "Progress Records",
      value: stats?.progressCount ?? 0,
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/20 to-background border border-border/60 p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/15 p-3">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Monitor teachers, students, and platform-wide learning activity from one place.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.title} className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="font-display text-xl">Users</CardTitle>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or email"
                  className="pl-9 sm:w-64"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Created</th>
                  <th className="py-3 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={user.role}
                        disabled={userActionLoadingId === user.id}
                        onChange={(e) =>
                          void handleRoleChange(
                            user.id,
                            e.target.value as "admin" | "teacher" | "student"
                          )
                        }
                        className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm capitalize"
                      >
                        <option value="admin">admin</option>
                        <option value="teacher">teacher</option>
                        <option value="student">student</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={userActionLoadingId === user.id}
                        onClick={() => void handleDeleteUser(user.id)}
                      >
                        {userActionLoadingId === user.id ? "Saving..." : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <p className="text-muted-foreground py-4">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}