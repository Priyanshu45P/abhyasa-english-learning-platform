import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, AlertCircle } from "lucide-react";
import type { UserRole } from "@/types";
import heroImg from "@/assets/hero-illustration.jpg";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "teacher" | "student">>("student");
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const result = await register(name, email, password, role);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="hidden lg:flex flex-col items-center justify-center px-16 py-12 bg-card border-r border-border/50">
        <div className="max-w-xl text-center">
          <img
            src={heroImg}
            alt="English learning illustration"
            className="w-full max-w-md mx-auto rounded-2xl shadow-xl mb-8 object-cover"
          />

          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="size-9 text-primary" />
            <span className="text-3xl font-display font-bold tracking-tight">Abhyasa</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight mb-6">
            Start Your English
            <br />
            Learning Journey
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Build grammar, vocabulary, stories, quizzes, and pronunciation skills
            with one modern learning platform.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="size-8 text-primary" />
            <span className="text-2xl font-display font-bold">Abhyasa</span>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">Create your account</CardTitle>
              <CardDescription>Join Abhyasa and start your English learning journey</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["student", "teacher"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors capitalize ${
                          role === r
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}