BEGIN;

-- This extension is useful if we ever want PostgreSQL to generate random IDs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ENUMS
-- =========================
-- These enums keep fixed values safe and consistent.

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('grammar', 'story', 'vocab', 'pronunciation', 'quiz');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pronunciation_score AS ENUM ('exact', 'close', 'mismatch');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pronunciation_target_type AS ENUM ('word', 'phrase', 'sentence');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- USERS
-- =========================
-- Every account in the system is stored here.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- CLASSROOMS
-- =========================
-- A teacher can create classrooms, and students can join them.
CREATE TABLE IF NOT EXISTS classrooms (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- This table connects students to classrooms.
CREATE TABLE IF NOT EXISTS classroom_students (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, student_id)
);

-- =========================
-- GRAMMAR
-- =========================
-- Grammar lessons created by teachers.
CREATE TABLE IF NOT EXISTS grammar_lessons (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  level       content_level NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- VOCAB
-- =========================
-- A vocabulary list groups related words together.
CREATE TABLE IF NOT EXISTS vocab_lists (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  level       content_level NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual vocabulary words belong to a vocabulary list.
CREATE TABLE IF NOT EXISTS vocab_items (
  id          TEXT PRIMARY KEY,
  word        TEXT NOT NULL,
  definition  TEXT NOT NULL,
  example     TEXT NOT NULL,
  phonetic    TEXT NOT NULL,
  list_id     TEXT NOT NULL REFERENCES vocab_lists(id) ON DELETE CASCADE,
  level       content_level NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- STORIES
-- =========================
-- Stories are reading content for students.
CREATE TABLE IF NOT EXISTS stories (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  summary     TEXT NOT NULL,
  level       content_level NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- TAGS
-- =========================
-- Tags help with searching and filtering content.
CREATE TABLE IF NOT EXISTS tags (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Tags attached to grammar lessons.
CREATE TABLE IF NOT EXISTS grammar_lesson_tags (
  grammar_id TEXT NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
  tag_id     BIGINT NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (grammar_id, tag_id)
);

-- Tags attached to stories.
CREATE TABLE IF NOT EXISTS story_tags (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  tag_id   BIGINT NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (story_id, tag_id)
);

-- This connects a story to grammar lessons used inside that story.
CREATE TABLE IF NOT EXISTS story_grammar_refs (
  story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  grammar_id TEXT NOT NULL REFERENCES grammar_lessons(id) ON DELETE RESTRICT,
  PRIMARY KEY (story_id, grammar_id)
);

-- This connects a story to vocabulary words that should be highlighted.
CREATE TABLE IF NOT EXISTS story_vocab_refs (
  story_id       TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  vocab_item_id  TEXT NOT NULL REFERENCES vocab_items(id) ON DELETE RESTRICT,
  highlight_text TEXT NOT NULL,
  PRIMARY KEY (story_id, vocab_item_id, highlight_text)
);

-- =========================
-- PRONUNCIATION
-- =========================
-- Pronunciation exercises store the word, phrase, or sentence students practise.
CREATE TABLE IF NOT EXISTS pronunciation_exercises (
  id           TEXT PRIMARY KEY,
  target_text  TEXT NOT NULL,
  type         pronunciation_target_type NOT NULL,
  level        content_level NOT NULL,
  instructions TEXT NOT NULL,
  teacher_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- This connects pronunciation exercises to vocabulary words.
CREATE TABLE IF NOT EXISTS pronunciation_vocab_links (
  exercise_id   TEXT NOT NULL REFERENCES pronunciation_exercises(id) ON DELETE CASCADE,
  vocab_item_id TEXT NOT NULL REFERENCES vocab_items(id) ON DELETE RESTRICT,
  PRIMARY KEY (exercise_id, vocab_item_id)
);

-- This connects pronunciation exercises to stories.
CREATE TABLE IF NOT EXISTS pronunciation_story_links (
  exercise_id TEXT NOT NULL REFERENCES pronunciation_exercises(id) ON DELETE CASCADE,
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE RESTRICT,
  PRIMARY KEY (exercise_id, story_id)
);

-- Every time a student practises pronunciation, the attempt is saved here.
CREATE TABLE IF NOT EXISTS pronunciation_attempts (
  id            TEXT PRIMARY KEY,
  exercise_id   TEXT NOT NULL REFERENCES pronunciation_exercises(id) ON DELETE RESTRICT,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expected      TEXT NOT NULL,
  transcript    TEXT NOT NULL,
  score         pronunciation_score NOT NULL,
  match_percent NUMERIC(5,2) NOT NULL CHECK (match_percent >= 0 AND match_percent <= 100),
  feedback      TEXT NOT NULL,
  "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- QUIZZES
-- =========================
-- Quizzes are created by teachers and attempted by students.
CREATE TABLE IF NOT EXISTS quizzes (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  level       content_level NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- This table links a quiz to grammar, stories, vocab, pronunciation, or other quiz content.
CREATE TABLE IF NOT EXISTS quiz_content_links (
  quiz_id     TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  linked_type content_type NOT NULL,
  linked_id   TEXT NOT NULL,
  PRIMARY KEY (quiz_id, linked_type, linked_id)
);

-- Questions inside a quiz.
CREATE TABLE IF NOT EXISTS quiz_questions (
  id                TEXT PRIMARY KEY,
  quiz_id           TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text              TEXT NOT NULL,
  explanation       TEXT NOT NULL,
  correct_option_id TEXT NULL
);

-- Answer options for quiz questions.
CREATE TABLE IF NOT EXISTS quiz_options (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL
);

-- A saved quiz attempt from a student.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                 TEXT PRIMARY KEY,
  quiz_id            TEXT NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name_snapshot TEXT NOT NULL,
  score              INT NOT NULL CHECK (score >= 0),
  total_questions    INT NOT NULL CHECK (total_questions > 0),
  completed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The answers selected during a quiz attempt.
CREATE TABLE IF NOT EXISTS quiz_answers (
  attempt_id         TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id        TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE RESTRICT,
  selected_option_id TEXT NOT NULL REFERENCES quiz_options(id) ON DELETE RESTRICT,
  is_correct         BOOLEAN NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

-- =========================
-- PROGRESS
-- =========================
-- This stores which content a student has completed.
CREATE TABLE IF NOT EXISTS progress_completions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id   TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT progress_unique UNIQUE (user_id, content_type, content_id)
);

-- =========================
-- CLASSROOM CONTENT ASSIGNMENTS
-- =========================
-- These tables decide which content appears inside each classroom.

-- Grammar lessons assigned to a classroom.
CREATE TABLE IF NOT EXISTS classroom_grammar (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  grammar_id   TEXT NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, grammar_id)
);

-- Stories assigned to a classroom.
CREATE TABLE IF NOT EXISTS classroom_story (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  story_id     TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, story_id)
);

-- Vocabulary lists assigned to a classroom.
CREATE TABLE IF NOT EXISTS classroom_vocab_list (
  classroom_id  TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  vocab_list_id TEXT NOT NULL REFERENCES vocab_lists(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, vocab_list_id)
);

-- Pronunciation exercises assigned to a classroom.
CREATE TABLE IF NOT EXISTS classroom_pronunciation (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL REFERENCES pronunciation_exercises(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, exercise_id)
);

-- Quizzes assigned to a classroom.
CREATE TABLE IF NOT EXISTS classroom_quiz (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  quiz_id      TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, quiz_id)
);

-- =========================
-- INDEXES
-- =========================
-- Indexes make common lookups faster.

-- Classroom lookups.
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id
ON classrooms(teacher_id);

CREATE INDEX IF NOT EXISTS idx_classroom_students_student_id
ON classroom_students(student_id);

-- Content filtering.
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_level
ON grammar_lessons(level);

CREATE INDEX IF NOT EXISTS idx_vocab_lists_level
ON vocab_lists(level);

CREATE INDEX IF NOT EXISTS idx_vocab_items_list_id
ON vocab_items(list_id);

CREATE INDEX IF NOT EXISTS idx_vocab_items_level
ON vocab_items(level);

CREATE INDEX IF NOT EXISTS idx_stories_level
ON stories(level);

CREATE INDEX IF NOT EXISTS idx_pronunciation_exercises_level
ON pronunciation_exercises(level);

CREATE INDEX IF NOT EXISTS idx_quizzes_level
ON quizzes(level);

-- Story link lookups.
CREATE INDEX IF NOT EXISTS idx_story_grammar_refs_grammar_id
ON story_grammar_refs(grammar_id);

CREATE INDEX IF NOT EXISTS idx_story_vocab_refs_vocab_item_id
ON story_vocab_refs(vocab_item_id);

-- Pronunciation link lookups.
CREATE INDEX IF NOT EXISTS idx_pronunciation_vocab_links_vocab_item_id
ON pronunciation_vocab_links(vocab_item_id);

CREATE INDEX IF NOT EXISTS idx_pronunciation_story_links_story_id
ON pronunciation_story_links(story_id);

CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_user_id
ON pronunciation_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_exercise_id
ON pronunciation_attempts(exercise_id);

-- Quiz and progress lookups.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id
ON quiz_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id
ON quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_progress_completions_user_id
ON progress_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_progress_completions_content
ON progress_completions(content_type, content_id);

-- Classroom assignment reverse lookups.
-- These help when we need to find where one content item is assigned.
CREATE INDEX IF NOT EXISTS idx_classroom_grammar_grammar_id
ON classroom_grammar(grammar_id);

CREATE INDEX IF NOT EXISTS idx_classroom_story_story_id
ON classroom_story(story_id);

CREATE INDEX IF NOT EXISTS idx_classroom_vocab_list_vocab_list_id
ON classroom_vocab_list(vocab_list_id);

CREATE INDEX IF NOT EXISTS idx_classroom_pronunciation_exercise_id
ON classroom_pronunciation(exercise_id);

CREATE INDEX IF NOT EXISTS idx_classroom_quiz_quiz_id
ON classroom_quiz(quiz_id);

COMMIT;