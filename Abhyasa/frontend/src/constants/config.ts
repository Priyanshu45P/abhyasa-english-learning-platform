export const APP_NAME = "Abhyasa";
export const APP_TAGLINE = "Learn English with Confidence";

export const LEVELS = [
  { value: "beginner" as const, label: "Beginner", color: "bg-emerald-100 text-emerald-800" },
  { value: "intermediate" as const, label: "Intermediate", color: "bg-amber-100 text-amber-800" },
  { value: "advanced" as const, label: "Advanced", color: "bg-rose-100 text-rose-800" },
];

export const CONTENT_TYPES = [
  { value: "grammar" as const, label: "Grammar", icon: "BookOpen" },
  { value: "story" as const, label: "Stories", icon: "BookText" },
  { value: "vocab" as const, label: "Vocabulary", icon: "Languages" },
  { value: "pronunciation" as const, label: "Pronunciation", icon: "Mic" },
  { value: "quiz" as const, label: "Quizzes", icon: "ClipboardCheck" },
];

export const DEMO_ACCOUNTS = {
  teacher: { email: "teacher@example.com", password: "teacher123" },
  student: { email: "student1@example.com", password: "student123" },
};