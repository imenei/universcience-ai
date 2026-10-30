"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Flag,
  Info,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { courseCards } from "@/lib/data";
import type { Navigate } from "@/components/views";

type QuizCourse = {
  id: string;
  title: string;
  subtitle: string;
  documentCount: number;
  indexedDocumentCount: number;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  concept: string;
  options: Array<{ label: string; detail: string }>;
  citations: Array<{ documentId: string; documentTitle: string; pageNumber: number }>;
};

type ProgressResult = { score: number; total: number; percentage: number };
type QuizCorrection = { correctOption: number; explanation: string; citations: Array<{ documentId: string; documentTitle: string; pageNumber: number }> };

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-header-action">{action}</div>}</div>;
}

function Button({ children, className = "", variant = "primary", onClick, disabled = false }: { children: ReactNode; className?: string; variant?: "primary" | "secondary"; onClick?: () => void; disabled?: boolean }) {
  return <button type="button" className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function QuizView({ onNavigate }: { onNavigate: Navigate }) {
  const [courses, setCourses] = useState<QuizCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [courseId, setCourseId] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ProgressResult | null>(null);
  const [corrections, setCorrections] = useState<Record<string, QuizCorrection>>({});
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId) ?? null, [courses, courseId]);
  const active = questions[current];
  const allAnswered = questions.length > 0 && questions.every((question) => answers[question.id] !== undefined);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError("");
      try {
        const response = await fetch("/api/courses", { credentials: "include", cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) throw new Error(data.error || "La liste des cours n’est pas disponible.");
        const returned = Array.isArray(data.courses) ? data.courses : [];
        const indexed = returned.filter((course: { indexedDocumentCount?: number }) => Number(course.indexedDocumentCount) > 0);
        const mapped: QuizCourse[] = indexed.map((course: { courseId: string; documentCount: number; indexedDocumentCount: number; firstDocumentTitle?: string }) => {
          const known = courseCards.find((item) => item.id === course.courseId);
          return {
            id: course.courseId,
            title: known?.title ?? course.firstDocumentTitle ?? course.courseId,
            subtitle: known?.subtitle ?? `${course.indexedDocumentCount} document(s) indexé(s)`,
            documentCount: Number(course.documentCount) || 0,
            indexedDocumentCount: Number(course.indexedDocumentCount) || 0,
          };
        });
        if (!cancelled) setCourses(mapped);
      } catch (loadError) {
        if (!cancelled) setCoursesError(loadError instanceof Error ? loadError.message : "La liste des cours n’est pas disponible.");
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }
    void loadCourses();
    return () => { cancelled = true; };
  }, []);

  function resetAttempt() {
    setQuestions([]);
    setQuizId(null);
    setCurrent(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setCorrections({});
    setError("");
    setCanRetry(false);
  }

  async function generate() {
    if (!selectedCourse) {
      setError("Choisissez un cours contenant au moins un document indexé.");
      return;
    }
    setLoading(true);
    setError("");
    setCanRetry(false);
    resetAttempt();
    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: selectedCourse.id, topic: topic.trim() || undefined, count: Number(count), difficulty, language: "fr" }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error || "retry");
      if (!Array.isArray(data.questions) || data.questions.length === 0 || typeof data.quizId !== "string") {
        throw new Error("Le backend n’a pas renvoyé de QCM exploitable.");
      }
      setQuizId(data.quizId);
      setQuestions(data.questions);
    } catch {
      setError("La génération n’a pas abouti. Réessayez.");
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    if (!quizId || !allAnswered || submitted) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: questions.map((question) => ({ questionId: question.id, selectedOption: answers[question.id] })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error || "La tentative n’a pas pu être enregistrée.");
      setResult(data);
      setCorrections(Object.fromEntries((Array.isArray(data.corrections) ? data.corrections : []).map((item: QuizCorrection & { questionId: string }) => [item.questionId, item])));
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "La tentative n’a pas pu être enregistrée.");
    } finally {
      setLoading(false);
    }
  }

  if (!questions.length) {
    return <div className="page page-quiz">
      <PageHeader eyebrow="Entraînement · QCM" title="Générer un QCM depuis votre cours" description="Sélectionnez un cours autorisé avec des documents indexés. Les questions et les corrections seront traitées par le backend à partir de ses sources." />
      <section className="panel quiz-generator-card">
        <div className="generator-icon"><Sparkles size={22} /></div>
        <div><span className="section-kicker">NOUVELLE SESSION</span><h2>{selectedCourse ? `Réviser ${selectedCourse.title}` : "Choisissez d’abord un cours"}</h2><p>Le QCM et le résultat seront enregistrés dans votre session après correction côté serveur.</p></div>
        <label>Cours à réviser
          <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setError(""); }} disabled={coursesLoading || courses.length === 0} aria-label="Choisir le cours à réviser" required>
            <option value="">{coursesLoading ? "Chargement des cours autorisés…" : "Sélectionner un cours"}</option>
            {courses.map((course) => <option value={course.id} key={course.id}>{course.title} · {course.subtitle} · {course.indexedDocumentCount} document(s) indexé(s)</option>)}
          </select>
        </label>
        {coursesLoading && <p className="quiz-course-status"><LoaderCircle size={15} className="spin" /> Chargement de vos cours depuis le backend…</p>}
        {coursesError && <div className="quiz-error" role="alert">{coursesError}<p>Vérifiez la connexion à la base PostgreSQL/pgvector et réessayez.</p></div>}
        {!coursesLoading && !coursesError && courses.length === 0 && <div className="quiz-course-empty"><strong>Aucun cours prêt pour un QCM.</strong><p>Ajoutez un PDF de cours dans la bibliothèque et attendez son indexation. Les cours d’exemple ne sont pas proposés comme s’ils étaient connectés.</p><Button variant="secondary" onClick={() => onNavigate("/library")}>Ouvrir la bibliothèque <ChevronRight size={15} /></Button></div>}
        {selectedCourse && <div className="quiz-selected-course"><CheckCircle2 size={16} /><span>Cours sélectionné : <strong>{selectedCourse.title}</strong> · {selectedCourse.indexedDocumentCount} document(s) indexé(s)</span></div>}
        <label>Sujet ou chapitre<input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex. mécanismes de transport" /></label>
        <div className="generator-fields"><label>Questions<select value={count} onChange={(event) => setCount(event.target.value)}><option value="3">3 questions</option><option value="5">5 questions</option><option value="10">10 questions</option></select></label><label>Difficulté<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Facile</option><option value="medium">Intermédiaire</option><option value="hard">Difficile</option></select></label></div>
        {error && <div className="quiz-error" role="alert"><span>{error}</span>{canRetry && <Button variant="secondary" onClick={() => void generate()} disabled={loading}><RefreshCw size={14} /> Réessayer</Button>}</div>}
        <Button onClick={() => void generate()} disabled={loading || coursesLoading || !selectedCourse || selectedCourse.indexedDocumentCount < 1}>{loading ? <><LoaderCircle size={16} className="spin" /> Génération en cours…</> : <>Générer le QCM <Sparkles size={16} /></>}</Button>
        <p className="quiz-generator-note"><LockKeyhole size={14} /> Seuls les passages autorisés et indexés du cours choisi sont utilisés.</p>
      </section>
    </div>;
  }

  if (!active) return null;
  return <div className="page page-quiz">
    <PageHeader eyebrow="Entraînement · QCM généré" title="Vérifier votre compréhension" description={`Cours sélectionné : ${selectedCourse?.title ?? "Cours"}. Questions générées et tentative corrigée par le backend.`} action={<div className="quiz-session-controls"><span className="timer-badge"><Clock3 size={15} /> {current + 1} / {questions.length}</span><button className="icon-button" aria-label="Recommencer avec un autre cours" onClick={resetAttempt}><RefreshCw size={16} /></button></div>} />
    <div className="quiz-layout">
      <aside className="quiz-sidebar panel"><div className="quiz-sidebar-top"><span className="section-kicker">{selectedCourse?.title ?? "Cours"}</span><span className="quiz-counter">{Object.keys(answers).length} / {questions.length}</span></div><div className="quiz-progress-dots">{questions.map((question, index) => <button type="button" key={question.id} aria-label={`Afficher la question ${index + 1}`} className={`quiz-dot ${answers[question.id] !== undefined ? "quiz-dot-done" : ""} ${index === current ? "quiz-dot-active" : ""}`} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><div className="quiz-sidebar-divider" /><div className="quiz-status-item"><CheckCircle2 size={16} /><span>{Object.keys(answers).length} réponse(s) sélectionnée(s)</span></div><button className="quiz-finish-button" onClick={() => void finish()} disabled={loading || submitted || !allAnswered}>{submitted ? "Tentative enregistrée" : allAnswered ? "Terminer le QCM" : "Répondez à toutes les questions"} <ArrowUpRight size={14} /></button></aside>
      <section className="quiz-question-card panel">
        <div className="quiz-question-top"><div><span className="question-tag">QUESTION {current + 1} · {active.concept}</span><h2>{active.prompt}</h2></div><button className="flag-question" type="button" aria-label="Signaler cette question"><Flag size={15} /> Signaler</button></div>
        <div className="answers-list">{active.options.map((option, index) => <button type="button" className={`answer-option ${answers[active.id] === index ? "answer-selected" : ""} ${submitted && index === corrections[active.id]?.correctOption ? "answer-correct" : ""} ${submitted && answers[active.id] === index && index !== corrections[active.id]?.correctOption ? "answer-wrong" : ""}`} key={`${active.id}-${index}`} onClick={() => !submitted && setAnswers((currentAnswers) => ({ ...currentAnswers, [active.id]: index }))}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span className="answer-copy"><strong>{option.label}</strong><small>{option.detail}</small></span><span className="answer-check">{submitted && index === corrections[active.id]?.correctOption ? <CheckCircle2 size={20} /> : submitted && answers[active.id] === index ? <X size={20} /> : <span className="radio-ring" />}</span></button>)}</div>
        {submitted && corrections[active.id] && <div className="quiz-explanation"><div className="explanation-icon"><Lightbulb size={18} /></div><div><span className="section-kicker">CORRECTION DU BACKEND</span><p>{corrections[active.id].explanation}</p>{corrections[active.id].citations.map((citation) => <span className="citation-chip" key={`${citation.documentId}-${citation.pageNumber}`}><FileText size={13} /> {citation.documentTitle} · p. {citation.pageNumber}</span>)}</div></div>}
        {error && <div className="quiz-error" role="alert">{error}</div>}
        <div className="quiz-card-footer"><span className="quiz-source"><FileText size={14} /> Source : passages autorisés de {selectedCourse?.title ?? "votre cours"}</span><div>{current > 0 && <Button variant="secondary" onClick={() => setCurrent((index) => index - 1)}><ChevronLeft size={15} /> Précédente</Button>}{current < questions.length - 1 ? <Button onClick={() => setCurrent((index) => index + 1)} disabled={answers[active.id] === undefined}>Suivante <ChevronRight size={15} /></Button> : <Button onClick={() => void finish()} disabled={loading || submitted || !allAnswered}>{loading ? "Enregistrement…" : submitted ? "Tentative enregistrée" : "Terminer"} <Check size={15} /></Button>}</div></div>
      </section>
    </div>
    {result && <div className="quiz-result-banner panel"><div><span className="section-kicker">RÉSULTAT ENREGISTRÉ PAR LE BACKEND</span><strong>{result.score} / {result.total} · {result.percentage}%</strong><p>Votre tentative est enregistrée pour {selectedCourse?.title ?? "le cours"}.</p></div><Button variant="secondary" onClick={resetAttempt}>Nouveau QCM <RefreshCw size={15} /></Button></div>}
    <div className="quiz-bottom-note"><Info size={14} /> Les questions, réponses et scores proviennent du backend; aucune réponse d’exemple n’est utilisée dans cette session.</div>
  </div>;
}
