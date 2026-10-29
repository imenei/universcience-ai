"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock3, LoaderCircle, RefreshCw, Target, Trophy } from "lucide-react";
import { courseCards } from "@/lib/data";
import type { Navigate } from "@/components/views";

type ProgressPayload = {
  summary: { attempts: number; averagePercentage: number; totalQuestions: number; correctAnswers: number };
  byCourse: Array<{ courseId: string; attemptCount: number; averagePercentage: number; lastAttempt: string | null; correctAnswers: number; totalQuestions: number }>;
  missedConcepts: Array<{ courseId: string; concept: string; errorCount: number; lastAttempt: string }>;
  recentAttempts: Array<{ attemptId: string; courseId: string; title: string; score: number; total: number; percentage: number; completedAt: string }>;
  weeklyActivity: Array<{ weekStart: string; attempts: number; durationMinutes: number; averagePercentage: number }>;
};

export function ProgressView({ onNavigate }: { onNavigate: Navigate }) {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProgress() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/progress", { credentials: "include", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "La progression n’est pas disponible.");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "La progression n’est pas disponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProgress(); }, []);
  const summary = data?.summary;
  const courseTitle = (courseId: string) => courseCards.find((course) => course.id === courseId)?.title ?? courseId;
  const weekLabel = (date: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));

  return <div className="page page-progress">
    <div className="page-header"><div><div className="eyebrow">Votre progression · données du compte</div><h1>Voir ce qui mérite votre attention.</h1><p>Scores de tentatives et concepts à revoir calculés depuis les données enregistrées par le backend.</p></div><div className="page-header-action"><button className="button button-secondary" onClick={() => void loadProgress()} disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={15} />} Actualiser</button></div></div>
    {error && <div className="quiz-error" role="alert">{error}<p>Ces chiffres ne sont pas remplis avec des données d’exemple. Vérifiez la base documentaire et l’API de progression.</p></div>}
    {loading && <div className="document-loading-note"><LoaderCircle size={16} className="spin" /> Chargement de vos tentatives depuis le backend…</div>}
    {!loading && !error && data && <>
      <div className="progress-kpi-row">
        <div className="panel progress-kpi"><div className="kpi-icon kpi-violet"><BarChart3 size={18} /></div><span className="section-kicker">QCM TERMINÉS</span><strong>{summary?.attempts ?? 0}</strong><p>Tentatives enregistrées</p></div>
        <div className="panel progress-kpi"><div className="kpi-icon kpi-green"><Trophy size={18} /></div><span className="section-kicker">SCORE MOYEN</span><strong>{summary?.attempts ? `${summary.averagePercentage}%` : "—"}</strong><p>{summary?.attempts ? "Moyenne de vos tentatives" : "Aucun score enregistré"}</p></div>
        <div className="panel progress-kpi"><div className="kpi-icon kpi-amber"><Target size={18} /></div><span className="section-kicker">QUESTIONS TRAITÉES</span><strong>{summary?.totalQuestions ?? 0}</strong><p>{summary?.correctAnswers ?? 0} réponse(s) correcte(s)</p></div>
        <div className="panel progress-kpi"><div className="kpi-icon kpi-blue"><BookOpen size={18} /></div><span className="section-kicker">COURS PRATIQUÉS</span><strong>{data.byCourse.length}</strong><p>Cours associés à vos QCM</p></div>
      </div>
      <div className="progress-main-grid">
        <section className="panel subject-progress-panel"><div className="section-heading"><h2>Résultats par cours</h2><button onClick={() => onNavigate("/quizzes")}>Créer un QCM <ArrowUpRight size={14} /></button></div>
          {data.byCourse.length === 0 ? <div className="quiz-course-empty"><strong>Pas encore de résultat.</strong><p>Les scores apparaîtront ici après votre première tentative enregistrée.</p><button className="button button-secondary" onClick={() => onNavigate("/quizzes")}>Choisir un cours</button></div> : <div className="subject-progress-list">{data.byCourse.map((course) => <div className="subject-progress-item" key={course.courseId}><div className="subject-progress-top"><span>{courseTitle(course.courseId)}</span><strong>{course.averagePercentage}%</strong></div><div className="progress-line"><span style={{ width: `${Math.min(100, Math.max(0, course.averagePercentage))}%` }} /></div><small>{course.attemptCount} tentative(s) · {course.correctAnswers}/{course.totalQuestions} réponses correctes</small></div>)}</div>}
        </section>
        <section className="panel missed-panel"><div className="section-heading"><h2>Concepts à reprendre</h2></div>
          {data.missedConcepts.length === 0 ? <div className="quiz-course-empty"><strong>Aucune erreur enregistrée.</strong><p>Quand une réponse incorrecte sera enregistrée, le concept concerné s’affichera ici.</p></div> : <div>{data.missedConcepts.map((item, index) => <div className="missed-item" key={`${item.courseId}-${item.concept}`}><div className="missed-number">{String(index + 1).padStart(2, "0")}</div><div><strong>{item.concept}</strong><p>{item.errorCount} réponse(s) à revoir · {courseTitle(item.courseId)}</p></div><span className="missed-tag">À revoir</span><ChevronRight size={16} /></div>)}</div>}
        </section>
      </div>
      <section className="panel progress-history-panel"><div className="section-heading"><h2>Activité et scores récents</h2><span>8 dernières semaines</span></div>
        {data.weeklyActivity.length === 0 ? <div className="quiz-course-empty"><p>Aucune tentative horodatée sur les huit dernières semaines.</p></div> : <div className="activity-chart" aria-label="Scores moyens des QCM par semaine">{data.weeklyActivity.map((week) => <div className="activity-bar-column" key={week.weekStart}><div className="activity-tooltip">{week.attempts} QCM · moyenne {week.averagePercentage}%</div><div className="activity-bar-track"><span className="activity-bar" style={{ height: `${Math.max(6, Math.min(100, week.averagePercentage))}%` }} /></div><span>{weekLabel(week.weekStart)}</span><small>{week.durationMinutes ? `${week.durationMinutes} min` : `${week.attempts} essai(s)`}</small></div>)}</div>}
      </section>
      <section className="panel history-panel progress-history-panel"><div className="section-heading"><h2>Dernières tentatives</h2><span>{data.recentAttempts.length} affichée(s)</span></div>
        {data.recentAttempts.length === 0 ? <div className="quiz-course-empty"><p>Votre historique sera enregistré après votre premier QCM terminé.</p></div> : <div className="history-list">{data.recentAttempts.map((attempt) => <div className="history-item" key={attempt.attemptId}><div className="history-type"><CheckCircle2 size={15} /></div><div><strong>{attempt.title}</strong><p>{courseTitle(attempt.courseId)}</p></div><span className="history-score">{attempt.score}/{attempt.total} · {attempt.percentage}%</span><span>{new Date(attempt.completedAt).toLocaleString("fr-FR")}</span></div>)}</div>}
      </section>
      <div className="quiz-bottom-note"><Clock3 size={14} /> Seules les tentatives de votre session sont agrégées; la durée et le temps passé ne sont pas utilisés comme mesure de maîtrise.</div>
    </>}
  </div>;
}
