"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { courseCards } from "@/lib/data";
import type { Navigate } from "@/components/views";

type Course = { courseId: string; documentCount: number; indexedDocumentCount: number; firstDocumentTitle?: string };
type CourseResult = { courseId: string; attemptCount: number; averagePercentage: number; correctAnswers: number; totalQuestions: number };
type Attempt = { attemptId: string; courseId: string; title: string; score: number; total: number; percentage: number; completedAt: string };
type LearningData = {
  courses: Course[];
  summary: { attempts: number; averagePercentage: number; totalQuestions: number; correctAnswers: number };
  byCourse: CourseResult[];
  recentAttempts: Attempt[];
};

export function MyLearningView({ onNavigate }: { onNavigate: Navigate }) {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLearning = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesResponse, progressResponse] = await Promise.all([
        fetch("/api/courses", { credentials: "include", cache: "no-store" }),
        fetch("/api/progress", { credentials: "include", cache: "no-store" }),
      ]);
      const [coursesData, progressData] = await Promise.all([
        coursesResponse.json().catch(() => ({})),
        progressResponse.json().catch(() => ({})),
      ]);
      if (coursesResponse.status === 401 || progressResponse.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!coursesResponse.ok) throw new Error(coursesData.error || "Les cours accessibles ne sont pas disponibles.");
      if (!progressResponse.ok) throw new Error(progressData.error || "La progression n’est pas disponible.");
      setData({
        courses: Array.isArray(coursesData.courses) ? coursesData.courses.filter((course: Course) => Number(course.indexedDocumentCount) > 0) : [],
        summary: progressData.summary ?? { attempts: 0, averagePercentage: 0, totalQuestions: 0, correctAnswers: 0 },
        byCourse: Array.isArray(progressData.byCourse) ? progressData.byCourse : [],
        recentAttempts: Array.isArray(progressData.recentAttempts) ? progressData.recentAttempts : [],
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Votre espace d’apprentissage n’est pas disponible.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLearning(); }, [loadLearning]);

  const titleFor = (course: Course) => courseCards.find((item) => item.id === course.courseId)?.title ?? course.firstDocumentTitle ?? course.courseId;
  const courseTitle = (courseId: string) => courseCards.find((item) => item.id === courseId)?.title ?? courseId;
  const dateLabel = (date: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(date));

  return <div className="page page-learning">
    <div className="page-header"><div><div className="eyebrow">Votre parcours</div><h1>Mon apprentissage</h1><p>Vos cours indexés, résultats de QCM et dernières tentatives enregistrées pour cette session.</p></div><div className="page-header-action"><button className="button button-primary" onClick={() => onNavigate("/library")}><BookOpen size={16} /> Explorer les cours</button></div></div>
    {loading && <div className="learning-state" role="status"><LoaderCircle size={18} className="spin" /> Chargement des données de votre compte…</div>}
    {!loading && error && <section className="panel learning-state learning-error" role="alert"><strong>Les données backend ne sont pas disponibles.</strong><p>{error}</p><button className="button button-secondary" onClick={() => void loadLearning()}><RefreshCw size={15} /> Réessayer</button></section>}
    {!loading && data && <>
      <div className="learning-stats-grid">
        <section className="panel learning-kpi"><span className="section-kicker">SCORE MOYEN DES QCM</span><strong>{data.summary.attempts ? `${data.summary.averagePercentage}%` : "—"}</strong><p>{data.summary.attempts ? `Calculé sur ${data.summary.attempts} tentative(s) enregistrée(s)` : "Aucune tentative corrigée pour le moment"}</p></section>
        <section className="panel learning-kpi"><span className="section-kicker">COURS ACCESSIBLES</span><strong>{data.courses.length}</strong><p>Avec au moins un document indexé</p></section>
        <section className="panel learning-kpi"><span className="section-kicker">QUESTIONS TRAITÉES</span><strong>{data.summary.totalQuestions}</strong><p>{data.summary.correctAnswers} réponse(s) correcte(s) enregistrée(s)</p></section>
      </div>
      <section className="panel learning-courses-panel"><div className="section-heading"><h2>Cours accessibles</h2><span>{data.courses.length} cours indexé(s)</span></div>
        {data.courses.length === 0 ? <div className="learning-state"><p>Aucun cours avec documents indexés n’est associé à votre session.</p><button className="button button-secondary" onClick={() => onNavigate("/library")}>Ouvrir la bibliothèque <ArrowUpRight size={14} /></button></div> : <div className="learning-course-list">{data.courses.map((course) => {
          const result = data.byCourse.find((item) => item.courseId === course.courseId);
          return <article className="learning-course-row" key={course.courseId}><div className="learning-course-icon"><BookOpen size={18} /></div><div className="learning-course-copy"><strong>{titleFor(course)}</strong><span><FileText size={13} /> {course.indexedDocumentCount} document(s) indexé(s)</span></div><div className="learning-course-score"><strong>{result?.attemptCount ? `${result.averagePercentage}%` : "—"}</strong><span>{result?.attemptCount ? `${result.attemptCount} QCM enregistré(s)` : "Aucune tentative enregistrée"}</span></div><button className="button button-secondary learning-course-action" onClick={() => onNavigate("/quizzes")}>Créer un QCM <ArrowUpRight size={14} /></button></article>;
        })}</div>}
      </section>
      <section className="panel learning-history-panel"><div className="section-heading"><h2>Tentatives récentes</h2><span>{data.recentAttempts.length} affichée(s)</span></div>
        {data.recentAttempts.length === 0 ? <p className="learning-history-empty">Vos tentatives corrigées apparaîtront ici après un QCM.</p> : <div className="learning-attempt-list">{data.recentAttempts.map((attempt) => <article className="learning-attempt-row" key={attempt.attemptId}><div><strong>{attempt.title}</strong><span>{courseTitle(attempt.courseId)} · {dateLabel(attempt.completedAt)}</span></div><strong className="learning-attempt-score">{attempt.score}/{attempt.total} · {attempt.percentage}%</strong></article>)}</div>}
      </section>
    </>}
  </div>;
}
