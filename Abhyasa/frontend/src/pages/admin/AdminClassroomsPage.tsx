import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { ArrowRight } from "lucide-react";

type AdminClassroom = {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  createdAt: string;
  studentsCount: number;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
};

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<AdminClassroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await apiFetch<AdminClassroom[]>("/admin/classrooms");
        setClassrooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load classrooms.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadClassrooms();
  }, []);

  const handleDeleteClassroom = async (classroomId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this classroom? This will remove classroom enrollments and assigned content links."
    );

    if (!confirmed) return;

    try {
      setDeletingId(classroomId);
      setError("");

      await apiFetch(`/admin/classrooms/${classroomId}`, {
        method: "DELETE",
      });

      setClassrooms((prev) =>
        prev.filter((classroom) => classroom.id !== classroomId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete classroom.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Classrooms"
        description="View all teacher classrooms and assigned learning content."
      />

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">All Classrooms</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading classrooms...</p>
          ) : classrooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classrooms found.</p>
          ) : (
            classrooms.map((classroom) => (
              <Link
                key={classroom.id}
                to={`/admin/classrooms/${classroom.id}`}
                className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{classroom.name}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Code:{" "}
                      <span className="font-mono font-semibold">
                        {classroom.code}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Teacher: {classroom.teacher.name} ({classroom.teacher.email})
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Students: {classroom.studentsCount}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {new Date(classroom.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={deletingId === classroom.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleDeleteClassroom(classroom.id);
                      }}
                      className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === classroom.id ? "Deleting..." : "Delete"}
                    </button>

                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}