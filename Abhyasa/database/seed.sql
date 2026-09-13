BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- USERS
-- =========================
-- Demo accounts for testing the app.
-- These users are useful when checking admin, teacher, and student flows.
INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES
  (
    'a1',
    'Admin One',
    'admin@example.com',
    '$2a$10$QZ.HqbvE1LRaLirecsLMKOdjOnvTJ8ypAddIjBe1luPFXLlwPVLMG',
    'admin',
    NOW()
  ),
  (
    't1',
    'Teacher One',
    'teacher@example.com',
    '$2a$10$9dp5hz00aKnI12EUzk9Sq.QLiIIDONS4IdSMrFqG1a88E5zEQMMq6',
    'teacher',
    NOW()
  ),
  (
    's1',
    'Student One',
    'student1@example.com',
    '$2a$10$YMCLx7V.dOXFMwell4uI5eF91gGoVyi7iIAIbSbNdi72eaeo4TJa2',
    'student',
    NOW()
  ),
  (
    's2',
    'Student Two',
    'student2@example.com',
    '$2a$10$YMCLx7V.dOXFMwell4uI5eF91gGoVyi7iIAIbSbNdi72eaeo4TJa2',
    'student',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =========================
-- TAGS
-- =========================
-- Tags help group and filter learning content.
INSERT INTO tags (name)
VALUES
  ('tenses'),
  ('daily routine'),
  ('reading'),
  ('vocabulary'),
  ('speaking')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- GRAMMAR LESSONS
-- =========================
-- Basic grammar lessons created by the demo teacher.
INSERT INTO grammar_lessons (id, title, content, level, teacher_id, created_at, updated_at)
VALUES
  (
    'g1',
    'Simple Present Tense',
    'The simple present tense is used for habits, routines, and facts. Example: I go to school every day.',
    'beginner',
    't1',
    NOW(),
    NOW()
  ),
  (
    'g2',
    'Present Continuous Tense',
    'The present continuous tense is used for actions happening now. Example: She is reading a book.',
    'beginner',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Tags for the first grammar lesson.
INSERT INTO grammar_lesson_tags (grammar_id, tag_id)
SELECT 'g1', id
FROM tags
WHERE name IN ('tenses', 'daily routine')
ON CONFLICT DO NOTHING;

-- Tags for the second grammar lesson.
INSERT INTO grammar_lesson_tags (grammar_id, tag_id)
SELECT 'g2', id
FROM tags
WHERE name IN ('tenses')
ON CONFLICT DO NOTHING;

-- =========================
-- VOCAB LISTS
-- =========================
-- One simple vocabulary list for beginner daily routine words.
INSERT INTO vocab_lists (id, name, description, level, teacher_id, created_at, updated_at)
VALUES
  (
    'vl1',
    'Daily Actions',
    'Basic vocabulary for everyday routines and actions.',
    'beginner',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =========================
-- VOCAB ITEMS
-- =========================
-- Words inside the Daily Actions vocabulary list.
INSERT INTO vocab_items (
  id,
  word,
  definition,
  example,
  phonetic,
  list_id,
  level,
  teacher_id,
  created_at,
  updated_at
)
VALUES
  (
    'v1',
    'wake up',
    'to stop sleeping',
    'I wake up at 6 AM every day.',
    '/weɪk ʌp/',
    'vl1',
    'beginner',
    't1',
    NOW(),
    NOW()
  ),
  (
    'v2',
    'brush',
    'to clean with a brush',
    'He brushes his teeth every morning.',
    '/brʌʃ/',
    'vl1',
    'beginner',
    't1',
    NOW(),
    NOW()
  ),
  (
    'v3',
    'breakfast',
    'the morning meal',
    'They eat breakfast at 8 AM.',
    '/ˈbrekfəst/',
    'vl1',
    'beginner',
    't1',
    NOW(),
    NOW()
  ),
  (
    'v4',
    'walk',
    'to move on foot',
    'She walks to school every day.',
    '/wɔːk/',
    'vl1',
    'beginner',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =========================
-- STORIES
-- =========================
-- Short beginner stories for reading practice.
INSERT INTO stories (id, title, content, summary, level, teacher_id, created_at, updated_at)
VALUES
  (
    'st1',
    'Ravi''s Morning Routine',
    'Ravi wakes up early every day. He brushes his teeth, eats breakfast, and walks to school. He likes his morning routine because it makes him feel active.',
    'A short story about daily habits using the simple present tense.',
    'beginner',
    't1',
    NOW(),
    NOW()
  ),
  (
    'st2',
    'What Anaya Is Doing Now',
    'Anaya is sitting near the window. She is reading a storybook and drinking tea. Her brother is drawing a picture beside her.',
    'A short story using present continuous actions.',
    'beginner',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Tags for Ravi's story.
INSERT INTO story_tags (story_id, tag_id)
SELECT 'st1', id
FROM tags
WHERE name IN ('reading', 'daily routine', 'vocabulary')
ON CONFLICT DO NOTHING;

-- Tags for Anaya's story.
INSERT INTO story_tags (story_id, tag_id)
SELECT 'st2', id
FROM tags
WHERE name IN ('reading')
ON CONFLICT DO NOTHING;

-- =========================
-- STORY TO GRAMMAR LINKS
-- =========================
-- These links show which grammar lesson belongs with each story.
INSERT INTO story_grammar_refs (story_id, grammar_id)
VALUES
  ('st1', 'g1'),
  ('st2', 'g2')
ON CONFLICT DO NOTHING;

-- =========================
-- STORY TO VOCAB LINKS
-- =========================
-- These words can be highlighted when the story is shown.
INSERT INTO story_vocab_refs (story_id, vocab_item_id, highlight_text)
VALUES
  ('st1', 'v1', 'wakes up'),
  ('st1', 'v2', 'brushes'),
  ('st1', 'v3', 'breakfast'),
  ('st1', 'v4', 'walks')
ON CONFLICT DO NOTHING;

-- =========================
-- PRONUNCIATION EXERCISES
-- =========================
-- Simple speaking exercises for students.
INSERT INTO pronunciation_exercises (
  id,
  target_text,
  type,
  level,
  instructions,
  teacher_id,
  created_at,
  updated_at
)
VALUES
  (
    'p1',
    'I wake up early.',
    'sentence',
    'beginner',
    'Speak clearly and repeat the sentence exactly.',
    't1',
    NOW(),
    NOW()
  ),
  (
    'p2',
    'She is reading a book.',
    'sentence',
    'beginner',
    'Focus on pronunciation and rhythm.',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- This pronunciation exercise is linked to a vocabulary word.
INSERT INTO pronunciation_vocab_links (exercise_id, vocab_item_id)
VALUES
  ('p1', 'v1')
ON CONFLICT DO NOTHING;

-- These pronunciation exercises are linked to stories.
INSERT INTO pronunciation_story_links (exercise_id, story_id)
VALUES
  ('p1', 'st1'),
  ('p2', 'st2')
ON CONFLICT DO NOTHING;

-- =========================
-- QUIZZES
-- =========================
-- One beginner quiz connected to grammar and story content.
INSERT INTO quizzes (id, title, description, level, teacher_id, created_at, updated_at)
VALUES
  (
    'q1',
    'Beginner Tenses Quiz',
    'A short quiz on simple present and present continuous.',
    'beginner',
    't1',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- The quiz is linked to lessons and a story.
INSERT INTO quiz_content_links (quiz_id, linked_type, linked_id)
VALUES
  ('q1', 'grammar', 'g1'),
  ('q1', 'grammar', 'g2'),
  ('q1', 'story', 'st1')
ON CONFLICT DO NOTHING;

-- =========================
-- QUIZ QUESTIONS
-- =========================
-- Questions are inserted first, then correct answers are updated after options exist.
INSERT INTO quiz_questions (id, quiz_id, text, explanation, correct_option_id)
VALUES
  (
    'qq1',
    'q1',
    'Which sentence is in the simple present tense?',
    'Simple present is used for habits and routines.',
    NULL
  ),
  (
    'qq2',
    'q1',
    'Which sentence is in the present continuous tense?',
    'Present continuous is used for actions happening now.',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Options for the quiz questions.
INSERT INTO quiz_options (id, question_id, text)
VALUES
  ('qo1', 'qq1', 'She walks to school every day.'),
  ('qo2', 'qq1', 'She is walking to school now.'),
  ('qo3', 'qq1', 'She walked to school yesterday.'),
  ('qo4', 'qq2', 'He eats breakfast every morning.'),
  ('qo5', 'qq2', 'He is eating breakfast now.'),
  ('qo6', 'qq2', 'He ate breakfast at 8 AM.')
ON CONFLICT (id) DO NOTHING;

-- Correct answer for question 1.
UPDATE quiz_questions
SET correct_option_id = 'qo1'
WHERE id = 'qq1';

-- Correct answer for question 2.
UPDATE quiz_questions
SET correct_option_id = 'qo5'
WHERE id = 'qq2';

-- =========================
-- SAMPLE QUIZ ATTEMPT
-- =========================
-- This gives the student dashboard some demo quiz data.
INSERT INTO quiz_attempts (
  id,
  quiz_id,
  user_id,
  user_name_snapshot,
  score,
  total_questions,
  completed_at
)
VALUES
  ('qa1', 'q1', 's1', 'Student One', 2, 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- Saved answers for the sample quiz attempt.
INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct)
VALUES
  ('qa1', 'qq1', 'qo1', TRUE),
  ('qa1', 'qq2', 'qo5', TRUE)
ON CONFLICT DO NOTHING;

-- =========================
-- SAMPLE PROGRESS
-- =========================
-- This shows some completed work for Student One.
INSERT INTO progress_completions (id, user_id, content_type, content_id, completed_at)
VALUES
  ('pc1', 's1', 'grammar', 'g1', NOW()),
  ('pc2', 's1', 'story', 'st1', NOW()),
  ('pc3', 's1', 'quiz', 'q1', NOW()),
  ('pc4', 's1', 'pronunciation', 'p1', NOW())
ON CONFLICT (user_id, content_type, content_id) DO NOTHING;

-- =========================
-- SAMPLE PRONUNCIATION ATTEMPT
-- =========================
-- This gives the pronunciation progress section some demo data.
INSERT INTO pronunciation_attempts (
  id,
  exercise_id,
  user_id,
  expected,
  transcript,
  score,
  match_percent,
  feedback
)
VALUES
  (
    'pa1',
    'p1',
    's1',
    'I wake up early.',
    'I wake up early',
    'close',
    96.50,
    'Very good. Speak a little more clearly at the end.'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================
-- SAMPLE CLASSROOMS
-- =========================
-- A demo classroom created by Teacher One.
INSERT INTO classrooms (id, name, code, teacher_id, created_at)
VALUES
  ('c1', 'English Beginner', 'ABC123', 't1', NOW())
ON CONFLICT (id) DO NOTHING;

-- Two demo students are added to the classroom.
INSERT INTO classroom_students (classroom_id, student_id, joined_at)
VALUES
  ('c1', 's1', NOW()),
  ('c1', 's2', NOW())
ON CONFLICT DO NOTHING;

-- =========================
-- CLASSROOM CONTENT ASSIGNMENTS
-- =========================
-- These rows decide what students can see inside the classroom.

-- Grammar lessons assigned to the demo classroom.
INSERT INTO classroom_grammar (classroom_id, grammar_id, assigned_at)
VALUES
  ('c1', 'g1', NOW()),
  ('c1', 'g2', NOW())
ON CONFLICT DO NOTHING;

-- Stories assigned to the demo classroom.
INSERT INTO classroom_story (classroom_id, story_id, assigned_at)
VALUES
  ('c1', 'st1', NOW()),
  ('c1', 'st2', NOW())
ON CONFLICT DO NOTHING;

-- Vocabulary list assigned to the demo classroom.
INSERT INTO classroom_vocab_list (classroom_id, vocab_list_id, assigned_at)
VALUES
  ('c1', 'vl1', NOW())
ON CONFLICT DO NOTHING;

-- Pronunciation exercises assigned to the demo classroom.
INSERT INTO classroom_pronunciation (classroom_id, exercise_id, assigned_at)
VALUES
  ('c1', 'p1', NOW()),
  ('c1', 'p2', NOW())
ON CONFLICT DO NOTHING;

-- Quiz assigned to the demo classroom.
INSERT INTO classroom_quiz (classroom_id, quiz_id, assigned_at)
VALUES
  ('c1', 'q1', NOW())
ON CONFLICT DO NOTHING;

COMMIT;