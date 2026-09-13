import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClassroomStore } from "@/stores/classroomStore";

export default function ClassroomsPage() {
  const {
    teacherClassrooms,
    isLoading,
    error,
    fetchTeacherClassrooms,
    createClassroom,
    deleteClassroom,
  } = useClassroomStore();

  const [classroomName, setClassroomName] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void fetchTeacherClassrooms();
  }, [fetchTeacherClassrooms]);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!classroomName.trim()) {
      setFormError("Classroom name is required.");
      return;
    }

    setIsCreating(true);
    const result = await createClassroom(classroomName.trim());
    setIsCreating(false);

    if (!result.success) {
      setFormError(result.error || "Failed to create classroom.");
      return;
    }

    setClassroomName("");
    void fetchTeacherClassrooms();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this classroom?");
    if (!ok) return;

    const result = await deleteClassroom(id);
    if (!result.success) {
      alert(result.error || "Failed to delete classroom.");
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Classrooms"
        description="Create classrooms and manage the ones you already created."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Create Classroom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClassroom} className="space-y-3">
              <Input
                placeholder="Enter classroom name"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
              />
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Classroom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              My Classrooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isLoading ? (
              <p className="text-muted-foreground">
                Loading classrooms...
              </p>
            ) : teacherClassrooms.length === 0 ? (
              <p className="text-muted-foreground">
                No classrooms created yet.
              </p>
            ) : (
              teacherClassrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="rounded-lg border border-border/60 p-4 bg-background"
                >
                  <Link
                    to={`/teacher/classrooms/${classroom.id}`}
                    className="block hover:underline"
                  >
                    <p className="font-medium">{classroom.name}</p>
                  </Link>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Code:{" "}
                    <span className="font-mono font-semibold">
                      {classroom.code}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Students: {classroom.studentsCount}
                  </p>

                  <div className="mt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(classroom.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}