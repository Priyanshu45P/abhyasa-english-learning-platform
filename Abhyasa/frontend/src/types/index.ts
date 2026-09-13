export type UserRole = "admin" | "teacher" | "student";
export type ContentLevel = "beginner" | "intermediate" | "advanced";
export type ContentType =
  | "grammar"
  | "story"
  | "vocab"
  | "pronunciation"
  | "quiz";

export type ClassroomContentType =
  | "grammar"
  | "story"
  | "vocab"
  | "pronunciation"
  | "quiz";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface TeacherInfo {
  id: string;
  name: string;
  email: string;
}

export interface ClassroomStudent {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  joinedAt: string;
}

export interface TeacherClassroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  createdAt: string;
  studentsCount: number;
  students: ClassroomStudent[];
}

export interface JoinedClassroom {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  joinedAt: string;
  teacher: TeacherInfo;
}

export interface ClassroomDetail {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  teacher: TeacherInfo;
  studentsCount: number;
  students: ClassroomStudent[];
}

export interface GrammarLesson {
  id: string;
  title: string;
  content: string;
  level: ContentLevel;
  tags: string[];
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
}

export interface StoryVocabRef {
  vocabItemId: string;
  highlightText: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  summary: string;
  level: ContentLevel;
  tags: string[];
  teacherId: string;
  grammarRefs: string[];
  vocabRefs: StoryVocabRef[];
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
}

export interface VocabList {
  id: string;
  name: string;
  description: string;
  level: ContentLevel;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  listId: string;
  level: ContentLevel;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PronunciationExercise {
  id: string;
  targetText: string;
  type: "word" | "phrase" | "sentence";
  level: ContentLevel;
  instructions: string;
  vocabLinks: string[];
  storyLinks: string[];
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  explanation: string;
  correctOptionId: string | null;
  options: QuizOption[];
}

export interface QuizContentLink {
  linkedType: "grammar" | "story" | "vocab" | "pronunciation";
  linkedId: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  level: ContentLevel;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  contentLinks: QuizContentLink[];
  questions: QuizQuestion[];
  assignedAt?: string;
}

export interface ClassroomContentClassroom {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  teacherId: string;
  teacher: TeacherInfo;
  studentsCount: number;
  students: ClassroomStudent[];
}

export interface ClassroomContentPayload {
  classroom: ClassroomContentClassroom;
  grammarLessons: GrammarLesson[];
  stories: Story[];
  vocabLists: VocabList[];
  pronunciationExercises: PronunciationExercise[];
  quizzes: Quiz[];
}