import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClassroomStore } from "@/stores/classroomStore";

export default function ClassroomsPage() {
  const {
    studentClassrooms,
    isLoading,
    error,
    fetchStudentClassrooms,
    joinClassroom,
  } = useClassroomStore();

  const [classCode, setClassCode] = useState("");
  const [formError, setFormError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    void fetchStudentClassrooms();
  }, [fetchStudentClassrooms]);

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!classCode.trim()) {
      setFormError("Please enter a classroom code.");
      return;
    }

    setIsJoining(true);
    const result = await joinClassroom(classCode.trim().toUpperCase());
    setIsJoining(false);

    if (!result.success) {
      setFormError(result.error || "Failed to join classroom.");
      return;
    }

    setClassCode("");
    void fetchStudentClassrooms();
  };

  return (
    <div className="space-y-6">
      <Header
        title="My Classrooms"
        description="Join a classroom and open the ones you already joined."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Join Classroom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinClassroom} className="space-y-3">
              <Input
                placeholder="En ter classroom code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="font-mono tracking-wide"
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Classroom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Joined Classrooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isLoading ? (
              <p className="text-muted-foreground">Loading classrooms...</p>
            ) : studentClassrooms.length === 0 ? (
              <p className="text-muted-foreground">
                You have not joined any classroom yet.
              </p>
            ) : (
              studentClassrooms.map((classroom) => (
                <Link
                  key={classroom.id}
                  to={`/student/classrooms/${classroom.id}`}
                  className="block rounded-lg border border-border/60 p-4 bg-background hover:bg-accent/30 transition-colors"
                >
                  <p className="font-medium">{classroom.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Code: <span className="font-mono font-semibold">{classroom.code}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Teacher: {classroom.teacher.name}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}