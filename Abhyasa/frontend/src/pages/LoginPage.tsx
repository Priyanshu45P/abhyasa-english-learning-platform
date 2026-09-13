import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { DEMO_ACCOUNTS } from "@/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, AlertCircle } from "lucide-react";
import heroImg from "@/assets/hero-illustration.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const fillDemo = (role: "teacher" | "student") => {
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Login failed.");
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
            Master English with
            <br />
            Confidence &amp; Practice
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Grammar lessons, rich stories, vocabulary building, interactive quizzes,
            and speech-powered pronunciation practice — all in one place.
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
              <CardTitle className="font-display text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to continue your learning journey</CardDescription>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">Quick demo access:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemo("teacher")}
                    className="text-xs"
                    type="button"
                  >
                    Teacher demo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemo("student")}
                    className="text-xs"
                    type="button"
                  >
                    Student demo
                  </Button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}