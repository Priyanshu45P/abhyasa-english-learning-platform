import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { apiFetch } from "@/lib/api";
import { buildPronunciationResult } from "@/lib/pronunciation";
import { useClassroomStore } from "@/stores/classroomStore";
import { useProgressStore } from "@/stores/progressStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Volume2,
  ArrowLeft,
  Keyboard,
} from "lucide-react";
import type { ContentLevel, PronunciationExercise } from "@/types";

type PronunciationAttemptView = {
  expected: string;
  transcript: string;
  score: "exact" | "close" | "mismatch";
  matchPercent: number;
  feedback: string;
};

type SavedPronunciationAttempt = PronunciationAttemptView & {
  id: string;
  exerciseId: string;
  userId: string;
  timestamp: string;
};

type BrowserSpeechRecognitionErrorEvent = {
  error:
    | "no-speech"
    | "audio-capture"
    | "not-allowed"
    | "service-not-allowed"
    | "network"
    | "aborted"
    | "bad-grammar"
    | "language-not-supported"
    | string;
  message?: string;
};

type BrowserSpeechRecognitionResultEvent = {
  resultIndex?: number;
  results?: ArrayLike<
    ArrayLike<{
      transcript?: string;
      confidence?: number;
    }>
  >;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: BrowserSpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

// Gets the browser speech recognition tool if the browser supports it.
function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
// If there is no browser window, return null.
  const maybeWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
 // Some browsers use SpeechRecognition, Chrome may use webkitSpeechRecognition.
  return maybeWindow.SpeechRecognition ?? maybeWindow.webkitSpeechRecognition ?? null;
}

function LevelBadge({ level }: { level: ContentLevel }) {
  const className =
    level === "beginner"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : level === "intermediate"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${className}`}
    >
      {level}
    </span>
  );
}

function DiffDisplay({ expected, actual }: { expected: string; actual: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Expected</p>
          <p className="text-sm font-medium">{expected}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">You said</p>
          <p className="text-sm">{actual}</p>
        </div>
      </div>
    </div>
  );
}

function useSimpleSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [recognition, setRecognition] = useState<BrowserSpeechRecognition | null>(
    null
  );

  // This tells us whether the current browser can turn speech into text.
  const [isSupported] = useState(() => getSpeechRecognitionConstructor() !== null);

  const startListening = async () => {
    setError("");
    setTranscript("");
 // Get browser SpeechRecognition API.
    const SpeechRecognitionApi = getSpeechRecognitionConstructor();

    if (!SpeechRecognitionApi) {
      setIsListening(false);
      setError(
        "Speech recognition is not supported in this browser. Please use the fallback transcript box."
      );
      return;
    }

    try {
      // Ask the browser for microphone access before recording.
      if (
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function"
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setIsListening(false);
      setError(
        "Microphone permission is blocked. Please allow microphone access or use the fallback transcript box."
      );
      return;
    }
 // Create speech recognition instance.
    const instance = new SpeechRecognitionApi();
// Set recognition language and behaviour.
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.continuous = false;
    instance.maxAlternatives = 3;

    instance.onstart = () => {
      setIsListening(true);
      setError("");
    };

    instance.onresult = (event) => {
      const results = event.results;

      if (!results || results.length === 0) {
        setTranscript("");
        return;
      }

      const alternatives = results[0];
      let bestTranscript = "";

      // This is where speech is converted into text.
      // The browser may give a few possible texts, so we keep the clearest one.
      for (let i = 0; i < alternatives.length; i += 1) {
        const candidate = alternatives[i]?.transcript?.trim() ?? "";

        if (candidate.length > bestTranscript.length) {
          bestTranscript = candidate;
        }
      }

      // Save the final text so the student can submit it.
      setTranscript(bestTranscript);
    };

    instance.onerror = (event) => {
      setIsListening(false);

      // Show a simple message when recording fails.
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          setError(
            "Microphone permission was denied. Please allow microphone access or use the fallback transcript box."
          );
          break;

        case "audio-capture":
          setError(
            "No microphone was found. Please connect a microphone or use the fallback transcript box."
          );
          break;

        case "no-speech":
          setError(
            "No speech was detected. Speak a little louder or use the fallback transcript box."
          );
          break;

        case "network":
          setError(
            "Speech service network error. Please check your internet connection and try again."
          );
          break;

        case "aborted":
          setError("");
          break;

        default:
          setError(
            "Speech recognition failed. Please try again or use the fallback transcript box."
          );
          break;
      }
    };

    instance.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    setRecognition(instance);

    try {
      // Start listening to the student's voice.
      instance.start();
    } catch {
      setIsListening(false);
      setRecognition(null);
      setError("Could not start microphone recording. Please try again.");
    }
  };

  const stopListening = () => {
    recognition?.stop();
    setIsListening(false);
  };

  const resetTranscript = () => {
    recognition?.abort();
    setRecognition(null);
    setTranscript("");
    setError("");
    setIsListening(false);
  };

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
// Plays the target text aloud so the student can listen before practising pronunciation.
function speakTarget(text: string, type: "word" | "phrase" | "sentence") {
 // Check if browser supports speech synthesis.
  if (!("speechSynthesis" in window)) return;
 // Stop previous speech.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = type === "word" ? 0.75 : 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
 // Repeat single words once more.
  if (type === "word") {
    window.setTimeout(() => {
      const repeat = new SpeechSynthesisUtterance(text);
      repeat.lang = "en-US";
      repeat.rate = 0.75;
      repeat.pitch = 1;

      window.speechSynthesis.speak(repeat);
    }, 1000);
  }
}

export default function PronunciationPractice() {
  const { classroomId, id } = useParams<{ classroomId: string; id?: string }>();

  const {
    selectedClassroomContent,
    isDetailLoading,
    detailError,
    fetchClassroomContent,
    clearSelectedClassroomContent,
  } = useClassroomStore();

  const { fetchMyProgress, isCompleted, markComplete } = useProgressStore();

  const speech = useSimpleSpeechRecognition();

  const [selected, setSelected] = useState<PronunciationExercise | null>(null);
  const [lastResult, setLastResult] = useState<PronunciationAttemptView | null>(
    null
  );
  const [attemptHistory, setAttemptHistory] = useState<
    SavedPronunciationAttempt[]
  >([]);
  const [bestResult, setBestResult] = useState<PronunciationAttemptView | null>(
    null
  );
  const [filterLevel, setFilterLevel] = useState<"all" | ContentLevel>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);

  useEffect(() => {
    if (classroomId) {
      void fetchClassroomContent(classroomId);
    }

    void fetchMyProgress();

    return () => {
      clearSelectedClassroomContent();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    classroomId,
    fetchClassroomContent,
    clearSelectedClassroomContent,
    fetchMyProgress,
  ]);

  const exercises = selectedClassroomContent?.pronunciationExercises ?? [];

  useEffect(() => {
    if (!exercises.length) {
      setSelected(null);
      return;
    }

    if (id) {
      const matched = exercises.find((item) => item.id === id) ?? null;
      setSelected(matched);
      return;
    }

    setSelected((prev) => prev ?? exercises[0]);
  }, [exercises, id]);

  useEffect(() => {
    if (!speech.isSupported) {
      setIsManualMode(true);
    }
  }, [speech.isSupported]);

  useEffect(() => {
    const loadAttemptHistory = async () => {
      if (!selected) {
        setAttemptHistory([]);
        setBestResult(null);
        return;
      }

      setIsLoadingHistory(true);
      setSubmitError("");

      try {
        const history = await apiFetch<SavedPronunciationAttempt[]>(
          `/pronunciation/attempts?exerciseId=${selected.id}`
        );

        setAttemptHistory(history);

        if (history.length > 0) {
          const best = history.reduce((currentBest, item) =>
            item.matchPercent > currentBest.matchPercent ? item : currentBest
          );

          setBestResult({
            expected: best.expected,
            transcript: best.transcript,
            score: best.score,
            matchPercent: best.matchPercent,
            feedback: best.feedback,
          });
        } else {
          setBestResult(null);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to load pronunciation attempts."
        );
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadAttemptHistory();
  }, [selected]);

  const filtered = useMemo(() => {
    const base =
      filterLevel === "all"
        ? exercises
        : exercises.filter((exercise) => exercise.level === filterLevel);

    const levelOrder: Record<ContentLevel, number> = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
    };

    return [...base].sort((a, b) => {
      const levelCompare = levelOrder[a.level] - levelOrder[b.level];

      if (levelCompare !== 0) return levelCompare;

      return a.targetText.localeCompare(b.targetText);
    });
  }, [exercises, filterLevel]);

  const typeColors: Record<string, string> = {
    word: "bg-blue-100 text-blue-700",
    phrase: "bg-violet-100 text-violet-700",
    sentence: "bg-amber-100 text-amber-700",
  };

  const backTo = classroomId
    ? `/student/classrooms/${classroomId}`
    : "/student/dashboard";

  const completed = selected ? isCompleted("pronunciation", selected.id) : false;

  // Use the browser transcript first. If it is empty, use the typed fallback text.
  const activeTranscript = speech.transcript.trim() || manualTranscript.trim();
 // If speech recognition is not supported, allow manual typing fallback.
  const handleRecord = async () => {
    if (!speech.isSupported) {
      setIsManualMode(true);
      setSubmitError("");
      return;
    }
// If already listening, stop recording.
    if (speech.isListening) {
      speech.stopListening();
    } else { // Clear old result and start new recording.
      setLastResult(null);
      setSubmitError("");
      setManualTranscript("");
      await speech.startListening();
    }
  };
//This code creates the pronunciation result and sends the student’s attempt to the backend
  const handleSubmit = async () => {
    if (!selected || !activeTranscript) return;

    setSubmitError("");
 // Build score and feedback locally.
    const result = buildPronunciationResult(
      selected.targetText,
      activeTranscript,
      selected.type as "word" | "phrase" | "sentence"
    );

    setIsSubmitting(true);

    try { // Send attempt result to backend.
      const saved = await apiFetch<SavedPronunciationAttempt>(
        "/pronunciation/attempts",
        {
          method: "POST",
          body: JSON.stringify({
            exerciseId: selected.id,
            expected: result.expected,
            transcript: result.transcript,
            score: result.score,
            matchPercent: result.matchPercent,
            feedback: result.feedback,
          }),
        }
      );

      setAttemptHistory((prev) => [saved, ...prev]); // Add saved attempt to history.
      setLastResult(result);  // Show latest result on screen.

      setBestResult((prev) => {
        if (!prev || result.matchPercent > prev.matchPercent) {
          return result;
        }

        return prev;
      });
 // Mark pronunciation complete if score is good enough.
      if (result.matchPercent >= 70 && !completed) {
        await markComplete("pronunciation", selected.id);
        await fetchMyProgress();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save pronunciation attempt."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    speech.resetTranscript();
    setManualTranscript("");
    setIsManualMode(!speech.isSupported);
    setLastResult(null);
    setSubmitError("");
  };

  const handleSelectExercise = (exercise: PronunciationExercise) => {
    setSelected(exercise);
    setLastResult(null);
    setSubmitError("");
    setManualTranscript("");
    setIsManualMode(!speech.isSupported);
    speech.resetTranscript();
  };

  if (isDetailLoading) {
    return (
      <div className="space-y-6">
        <Header title="Pronunciation Practice" description="Loading exercises..." />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-muted-foreground">
            Loading pronunciation exercises...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="space-y-6">
        <Header title="Pronunciation Practice" />

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 text-destructive">{detailError}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Pronunciation Practice"
        description="Listen, speak, and compare your pronunciation."
        actions={
          <Link to={backTo}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card className="h-full shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Exercises</CardTitle>

              <select
                value={filterLevel}
                onChange={(event) =>
                  setFilterLevel(event.target.value as "all" | ContentLevel)
                }
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All levels</option>
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </CardHeader>

            <CardContent className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pronunciation exercises assigned yet.
                </p>
              ) : (
                filtered.map((exercise) => {
                  const exerciseCompleted = isCompleted(
                    "pronunciation",
                    exercise.id
                  );

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => handleSelectExercise(exercise)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selected?.id === exercise.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:bg-accent/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded font-medium capitalize ${
                            typeColors[exercise.type] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {exercise.type}
                        </span>

                        <LevelBadge level={exercise.level} />

                        {exerciseCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium truncate">
                        "{exercise.targetText}"
                      </p>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {!selected ? (
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-8 text-center">
                <h3 className="font-display text-lg font-semibold mb-2">
                  Select an Exercise
                </h3>

                <p className="text-sm text-muted-foreground">
                  Choose an exercise from the list to start practising.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs rounded font-medium capitalize ${
                          typeColors[selected.type] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {selected.type}
                      </span>

                      <LevelBadge level={selected.level} />

                      {completed && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                          <CheckCircle2 className="size-4" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    {selected.instructions}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-2xl font-display font-bold mb-6">
                      "{selected.targetText}"
                    </p>

                    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800">
                      <div className="flex gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                          Speech feedback is based on the transcript. Browser support,
                          microphone quality, background noise, and accent can affect the
                          result. Use the score as practice guidance, not as a final
                          judgement.
                        </p>
                      </div>
                    </div>

                    {!speech.isSupported && (
                      <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive">
                        <div className="flex gap-2">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <p>
                            Speech recognition is not supported in this browser. Use the
                            fallback transcript box below, or try Chrome or Edge on desktop.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 mb-6 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          speakTarget(
                            selected.targetText,
                            selected.type as "word" | "phrase" | "sentence"
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <Volume2 className="size-4 mr-2" />
                        Listen
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsManualMode((prev) => !prev)}
                        disabled={isSubmitting}
                      >
                        <Keyboard className="size-4 mr-2" />
                        {isManualMode ? "Hide Fallback" : "Type Transcript"}
                      </Button>

                      <button // mic button 
                        type="button"
                        onClick={() => void handleRecord()}
                        disabled={isSubmitting || !speech.isSupported}
                        className={`size-24 rounded-full flex items-center justify-center transition-all ${
                          speech.isListening
                            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                            : isSubmitting || !speech.isSupported
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        }`}
                      >
                        {speech.isListening ? (
                          <MicOff className="size-10" />
                        ) : (
                          <Mic className="size-10" />
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-muted-foreground mt-3">
                      {speech.isListening
                        ? "Listening... Click to stop"
                        : speech.isSupported
                        ? "Click the microphone to start recording"
                        : "Speech input is unavailable. Use the fallback transcript box."}
                    </p>

                    {speech.transcript && (
                      <div className="mt-4 p-4 rounded-lg bg-muted text-left">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Volume2 className="size-3" /> Your speech:
                        </p>

                        <p className="text-base">{speech.transcript}</p>
                      </div>
                    )}

                    {isManualMode && (
                      <div className="mt-4 text-left">
                        <label className="text-sm font-medium">
                          Fallback transcript
                        </label>

                        <textarea
                          rows={3}
                          value={manualTranscript}
                          onChange={(event) => {
                            setManualTranscript(event.target.value);
                            setLastResult(null);
                            setSubmitError("");
                          }}
                          placeholder="Type what you said, or what the browser should have detected."
                          className="mt-2 flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          disabled={isSubmitting}
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                          Use this when microphone access is blocked, speech recognition is
                          unsupported, or the browser transcript is clearly wrong.
                        </p>
                      </div>
                    )}

                    {speech.error && (
                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0" />
                        {speech.error}
                      </div>
                    )}

                    {submitError && (
                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {submitError}
                      </div>
                    )}
                  </div>

                  {activeTranscript && !speech.isListening && (
                    <div className="flex justify-center gap-3 mt-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTryAgain}
                        className="gap-2"
                      >
                        <RotateCcw className="size-4" />
                        Re-record
                      </Button>

                      <Button
                        type="button"
                        onClick={() => void handleSubmit()}
                        className="gap-2"
                        disabled={isSubmitting}
                      >
                        <CheckCircle2 className="size-4" />
                        {isSubmitting ? "Submitting..." : "Submit Attempt"}
                      </Button>
                    </div>
                  )}

                  {bestResult && (
                    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left">
                      <p className="text-sm font-medium text-emerald-700">
                        Best attempt so far
                      </p>

                      <p className="mt-1 text-2xl font-bold text-emerald-700">
                        {bestResult.matchPercent}%
                      </p>

                      <p className="mt-1 text-sm text-emerald-700">
                        {bestResult.feedback}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {lastResult && (
                <Card className="shadow-sm border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display">
                      Latest Result
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div
                      className={`p-4 rounded-lg mb-4 ${
                        lastResult.score === "exact"
                          ? "bg-emerald-50 border border-emerald-200"
                          : lastResult.score === "close"
                          ? "bg-amber-50 border border-amber-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-2xl font-bold tabular-nums ${
                            lastResult.score === "exact"
                              ? "text-emerald-700"
                              : lastResult.score === "close"
                              ? "text-amber-700"
                              : "text-red-700"
                          }`}
                        >
                          {lastResult.matchPercent}%
                        </span>

                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                            lastResult.score === "exact"
                              ? "bg-emerald-200 text-emerald-800"
                              : lastResult.score === "close"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {lastResult.score === "exact"
                            ? "Perfect"
                            : lastResult.score === "close"
                            ? "Close"
                            : "Try Again"}
                        </span>
                      </div>

                      <p className="text-sm">{lastResult.feedback}</p>
                    </div>

                    <DiffDisplay
                      expected={lastResult.expected}
                      actual={lastResult.transcript}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTryAgain}
                      className="mt-4 gap-2"
                    >
                      <RotateCcw className="size-4" />
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display">
                    Attempt History
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {isLoadingHistory ? (
                    <p className="text-sm text-muted-foreground">
                      Loading attempt history...
                    </p>
                  ) : attemptHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No saved attempts for this exercise yet.
                    </p>
                  ) : (
                    attemptHistory.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="rounded-lg border border-border/60 p-3 bg-background"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              Attempt {attemptHistory.length - index}
                            </p>

                            <p className="text-xs text-muted-foreground break-words">
                              {attempt.transcript}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(attempt.timestamp).toLocaleString("en-GB")}
                            </p>
                          </div>

                          <span className="text-sm font-semibold">
                            {attempt.matchPercent}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}