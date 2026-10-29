"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookMarked,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Columns3,
  FileText,
  Flag,
  FlaskConical,
  FolderOpen,
  Gauge,
  GraduationCap,
  Headphones,
  Info,
  Languages,
  Library,
  Lightbulb,
  ListFilter,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  UploadCloud,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  chatMessages,
  courseCards,
  institutionalContext,
  learningObjectives,
  statusLabel,
} from "@/lib/data";

export type Navigate = (href: string) => void;

type PageHeaderProps = { eyebrow: string; title: string; description: string; action?: ReactNode };

function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return <div className="page-header">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {action && <div className="page-header-action">{action}</div>}
  </div>;
}

function ProgressRing({ value, size = 74, tone = "violet" }: { value: number; size?: number; tone?: string }) {
  return <div className={`progress-ring progress-ring-${tone}`} style={{ width: size, height: size, background: `conic-gradient(var(--${tone}), ${value * 3.6}deg, #eeeef4 ${value * 3.6}deg)` }}>
    <div className="progress-ring-inner"><strong>{value}%</strong></div>
  </div>;
}

function StatusPill({ status }: { status: keyof typeof statusLabel }) {
  const reviewed = status === "professor-reviewed";
  const pending = status === "pending-review";
  return <span className={`status-pill ${reviewed ? "status-reviewed" : pending ? "status-pending" : "status-ai"}`}>
    {reviewed ? <CheckCircle2 size={13} /> : pending ? <Clock3 size={13} /> : <Sparkles size={13} />}
    {statusLabel[status]}
  </span>;
}

function Button({ children, className = "", variant = "primary", onClick, type = "button", disabled = false }: { children: ReactNode; className?: string; variant?: "primary" | "secondary" | "ghost" | "quiet"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function SectionHeading({ title, link, onClick }: { title: string; link?: string; onClick?: () => void }) {
  return <div className="section-heading"><h2>{title}</h2>{link && <button onClick={onClick}>{link}<ArrowUpRight size={14} /></button>}</div>;
}

type DashboardCourse = { courseId: string; documentCount: number; indexedDocumentCount: number; firstDocumentTitle?: string };
type DashboardProgress = {
  summary: { attempts: number; averagePercentage: number; totalQuestions: number; correctAnswers: number };
  byCourse: Array<{ courseId: string; attemptCount: number; averagePercentage: number }>;
  missedConcepts: Array<{ courseId: string; concept: string; errorCount: number }>;
  weeklyActivity: Array<{ weekStart: string; attempts: number; durationMinutes: number; averagePercentage: number }>;
};

export function DashboardView({ onNavigate, user }: { onNavigate: Navigate; user: { email?: string; demo?: boolean } | null }) {
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [progress, setProgress] = useState<DashboardProgress | null>(null);
  const [progressError, setProgressError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/courses", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { window.location.assign("/login"); return; }
        if (!response.ok) throw new Error(data.error || "Les cours ne sont pas disponibles.");
        if (active) setCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((error) => { if (active) setCoursesError(error instanceof Error ? error.message : "Les cours ne sont pas disponibles."); })
      .finally(() => { if (active) setCoursesLoading(false); });
    fetch("/api/progress", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { window.location.assign("/login"); return; }
        if (!response.ok) throw new Error(data.error || "La progression n’est pas disponible.");
        if (active) setProgress(data);
      })
      .catch((error) => { if (active) setProgressError(error instanceof Error ? error.message : "La progression n’est pas disponible."); });
    return () => { active = false; };
  }, []);

  const firstCourse = courses[0];
  const attemptedCourses = progress?.byCourse.filter((course) => course.attemptCount > 0) ?? [];
  const courseTitle = (courseId: string) => courseCards.find((course) => course.id === courseId)?.title ?? courseId;
  const priorityConcept = progress?.missedConcepts[0];
  const currentWeek = progress?.weeklyActivity[progress.weeklyActivity.length - 1];
  const weekLabel = (date: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
  const maxWeeklyAttempts = Math.max(1, ...(progress?.weeklyActivity.map((week) => week.attempts) ?? []));
  const greeting = user?.demo ? "votre démonstration" : user?.email?.split("@")[0] ?? "votre espace";

  return <div className="page page-dashboard">
    <PageHeader eyebrow="Espace étudiant · données connectées" title={`Bonjour ${greeting}, reprenons le fil.`} description="Vos cours autorisés et résultats de QCM sont chargés depuis le backend; aucune statistique d’exemple n’est affichée comme une donnée réelle." action={<Button variant="secondary" onClick={() => onNavigate("/library")}><Plus size={16} /> Ajouter un cours</Button>} />
    <div className="context-strip"><div className="context-strip-left"><div className="institution-icon"><GraduationCap size={18} /></div><span>Espace d’apprentissage</span><span className="context-separator">/</span><strong>Cours accessibles depuis votre session</strong></div><span className="context-year">Session connectée</span></div>

    {(coursesError || progressError) && <div className="quiz-error dashboard-data-error" role="status">{coursesError || progressError}<p>Les indicateurs ci-dessous restent vides tant que le backend n’a pas renvoyé de données.</p></div>}

    <section className="dashboard-grid dashboard-grid-top">
      <div className="continue-card">
        <div className="continue-card-top"><span className="section-kicker">COURS INDEXÉS</span><button className="icon-button light-icon" aria-label="Ouvrir la bibliothèque" onClick={() => onNavigate("/library")}><MoreHorizontal size={18} /></button></div>
        <div className="continue-card-body"><div className="course-orb orb-violet"><FlaskConical size={27} /></div><div><h2>{coursesLoading ? "Chargement des cours…" : firstCourse ? courseTitle(firstCourse.courseId) : "Aucun cours indexé"}</h2><p>{firstCourse ? firstCourse.firstDocumentTitle ?? `${firstCourse.indexedDocumentCount} document(s) indexé(s)` : "Importez un support PDF autorisé pour commencer."}</p></div></div>
        <div className="continue-progress-row"><span>Documents indexés disponibles</span><strong>{firstCourse?.indexedDocumentCount ?? 0}</strong></div>
        <div className="progress-line progress-line-light"><span style={{ width: firstCourse ? "100%" : "0%" }} /></div>
        <div className="continue-card-footer"><span className="last-seen"><FileText size={14} /> {firstCourse ? `${firstCourse.documentCount} document(s) dans ce cours` : "Aucune source connectée"}</span><Button onClick={() => onNavigate(firstCourse ? "/quizzes" : "/library")}>{firstCourse ? "Créer un QCM" : "Ajouter un cours"} <ChevronRight size={15} /></Button></div>
      </div>

      <div className="objective-card">
        <div className="objective-header"><span className="section-kicker">VOTRE ACTIVITÉ QCM</span><span className="objective-date">RÉEL</span></div>
        <div className="objective-main"><div className="target-icon"><Target size={20} /></div><div><h3>{progress?.summary.attempts ? `${progress.summary.attempts} tentative(s) enregistrée(s)` : "Prêt pour votre première tentative ?"}</h3><p>{progress?.summary.attempts ? `${progress.summary.totalQuestions} question(s) traitée(s)` : "Choisissez un cours indexé et démarrez un QCM."}</p></div></div>
        <div className="objective-footer"><div className="objective-check"><span className="check-dot"><Check size={12} /></span><span>{progress?.summary.attempts ? `${progress.summary.averagePercentage}% de moyenne` : "Aucune tentative encore"}</span></div><button className="text-link" onClick={() => onNavigate("/quizzes")}>Choisir un cours <ArrowUpRight size={14} /></button></div>
      </div>
    </section>

    <section className="dashboard-grid dashboard-grid-main">
      <div className="panel subjects-panel"><SectionHeading title="Cours accessibles" link="Bibliothèque" onClick={() => onNavigate("/library")} />
        {coursesLoading ? <div className="document-loading-note">Chargement des cours autorisés…</div> : courses.length ? <div className="subject-list">{courses.slice(0, 4).map((course) => <button className="subject-row" key={course.courseId} onClick={() => onNavigate("/quizzes")}><span className="subject-icon subject-violet"><FlaskConical size={17} /></span><span className="subject-info"><strong>{courseTitle(course.courseId)}</strong><small>{course.indexedDocumentCount} document(s) indexé(s) · accès autorisé</small></span><span className="subject-progress"><em>{course.indexedDocumentCount} doc.</em></span><ChevronRight size={16} className="row-chevron" /></button>)}</div> : <div className="dashboard-empty"><strong>Aucun cours disponible.</strong><p>Les cours apparaîtront après l’indexation d’un PDF auquel votre compte a accès.</p><Button variant="secondary" onClick={() => onNavigate("/library")}>Ouvrir la bibliothèque</Button></div>}
      </div>

      <div className="panel activity-panel"><SectionHeading title="Activité récente" link="Détails" onClick={() => onNavigate("/progress")} /><div className="activity-summary"><strong>{currentWeek ? `${currentWeek.attempts} QCM` : "—"}</strong><span>{currentWeek ? `${weekLabel(currentWeek.weekStart)}${currentWeek.durationMinutes ? ` · ${currentWeek.durationMinutes} min chronométrées` : " · tentatives enregistrées"}` : progressError || "Aucune tentative récente"}</span></div>
        {progress?.weeklyActivity.length ? <div className="activity-chart" aria-label="Activité hebdomadaire calculée depuis les tentatives">{progress.weeklyActivity.map((week) => <div className="activity-bar-column" key={week.weekStart}><div className="activity-tooltip">{week.attempts} QCM · {week.averagePercentage}% de moyenne</div><div className="activity-bar-track"><span className="activity-bar" style={{ height: `${Math.max(8, Math.min(100, (week.attempts / maxWeeklyAttempts) * 100))}%` }} /></div><span>{weekLabel(week.weekStart)}</span></div>)}</div> : <div className="dashboard-empty dashboard-empty-compact"><p>L’activité hebdomadaire s’affichera après votre première tentative enregistrée.</p></div>}
      </div>
    </section>

    <section className="dashboard-grid dashboard-grid-bottom">
      <div className="panel recommendation-panel"><div className="recommendation-icon"><Lightbulb size={18} /></div><div className="recommendation-copy"><span className="section-kicker">PISTE DE RÉVISION</span><h3>{priorityConcept ? `Revoir ${priorityConcept.concept}` : "Vos erreurs guideront les prochaines révisions."}</h3><p>{priorityConcept ? `${priorityConcept.errorCount} réponse(s) incorrecte(s) enregistrée(s) dans ${courseTitle(priorityConcept.courseId)}.` : "Les concepts à revoir apparaîtront ici à partir des corrections réelles de vos QCM."}</p><button className="text-link" onClick={() => onNavigate(priorityConcept ? "/quizzes" : "/progress")}>{priorityConcept ? "Créer une nouvelle session" : "Voir ma progression"} <ArrowUpRight size={14} /></button></div><div className="recommendation-art"><div className="membrane-line" /><div className="membrane-dot dot-one" /><div className="membrane-dot dot-two" /><div className="membrane-arrow">↓</div></div></div>
      <div className="panel upcoming-panel"><SectionHeading title="Sources indexées" link="Tout voir" onClick={() => onNavigate("/library")} />
        {courses.slice(0, 2).map((course) => <div className="upcoming-item" key={course.courseId}><div className="date-block"><strong>{course.indexedDocumentCount}</strong><span>PDF</span></div><div><strong>{courseTitle(course.courseId)}</strong><p>{course.firstDocumentTitle ?? "Document indexé et autorisé"}</p></div><button className="upcoming-status" onClick={() => onNavigate("/quizzes")}>Créer un QCM</button></div>)}
        {!coursesLoading && !courses.length && <div className="dashboard-empty dashboard-empty-compact"><p>{coursesError || "Aucun document prêt; ajoutez un PDF pour commencer."}</p></div>}
      </div>
    </section>
  </div>;
}
function FilterSelect({ label, value }: { label: string; value: string }) {
  return <button className="filter-select"><span>{label}</span><strong>{value}</strong><ChevronDown size={14} /></button>;
}

export type AvailableCourse = {
  id: string;
  title: string;
  documentCount: number;
  indexedDocumentCount: number;
  firstDocumentTitle?: string;
  lastUpdated?: string;
};

function readableCourseTitle(courseId: string, firstDocumentTitle?: string) {
  if (firstDocumentTitle) return firstDocumentTitle.replace(/\.pdf$/i, "");
  return courseId.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LibraryView({ onNavigate }: { onNavigate: Navigate }) {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<AvailableCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; pageCount: number; status: string; createdAt: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [uploadState, setUploadState] = useState<string | null>(null);
  const [courseIdInput, setCourseIdInput] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCourses = async () => {
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const response = await fetch("/api/courses", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign("/login"); return; }
      if (!response.ok) throw new Error(data.error || "La liste des cours n’est pas disponible.");
      const nextCourses: AvailableCourse[] = (Array.isArray(data.courses) ? data.courses : []).map((course: AvailableCourse) => ({
        id: course.id || (course as AvailableCourse & { courseId: string }).courseId,
        title: readableCourseTitle((course.id || (course as AvailableCourse & { courseId: string }).courseId), course.firstDocumentTitle),
        documentCount: Number(course.documentCount) || 0,
        indexedDocumentCount: Number(course.indexedDocumentCount) || 0,
        firstDocumentTitle: course.firstDocumentTitle,
        lastUpdated: course.lastUpdated,
      }));
      setCourses(nextCourses);
      setSelectedCourseId((current) => nextCourses.some((course) => course.id === current) ? current : nextCourses[0]?.id ?? "");
    } catch (error) {
      setCoursesError(error instanceof Error ? error.message : "La liste des cours n’est pas disponible.");
    } finally { setCoursesLoading(false); }
  };

  const loadDocuments = async (courseId: string) => {
    if (!courseId) { setDocuments([]); return; }
    setDocumentsLoading(true);
    try {
      const response = await fetch(`/api/documents?courseId=${encodeURIComponent(courseId)}`, { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } finally { setDocumentsLoading(false); }
  };

  useEffect(() => { void loadCourses(); }, []);
  useEffect(() => { void loadDocuments(selectedCourseId); }, [selectedCourseId]);

  const filteredCourses = courses.filter((course) => `${course.title} ${course.id} ${course.firstDocumentTitle ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  const importPdf = async (file: File) => {
    const courseId = courseIdInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mon-cours";
    if (file.type !== "application/pdf") { setUploadState("Sélectionnez un fichier PDF."); return; }
    setUploadState("Import et indexation du cours en cours…");
    const form = new FormData();
    form.append("file", file);
    form.append("courseId", courseId);
    try {
      const response = await fetch("/api/ingest", { method: "POST", body: form, credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setUploadState(data.error || "Le traitement du PDF a échoué."); return; }
      setUploadState(`Cours importé : ${data.pageCount || 0} page(s), ${data.chunkCount || 0} passage(s) indexé(s).`);
      setCourseIdInput("");
      await loadCourses();
      setSelectedCourseId(courseId);
    } catch { setUploadState("Le service d’ingestion n’est pas joignable pour le moment."); }
  };

  return <div className="page page-library">
    <PageHeader eyebrow="Cours de votre session" title="Mes cours" description="Seuls les cours réellement importés et indexés pour votre compte sont affichés ici." action={<><input ref={fileInput} type="file" accept="application/pdf" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importPdf(file); event.currentTarget.value = ""; }} /><Button variant="secondary" onClick={() => fileInput.current?.click()}><UploadCloud size={16} /> Importer un PDF</Button></>} />
    {uploadState && <div className="library-upload-status"><UploadCloud size={15} /><span>{uploadState}</span><button className="icon-button" onClick={() => setUploadState(null)} aria-label="Fermer le statut"><X size={14} /></button></div>}
    <section className="panel simple-import-panel"><div><span className="section-kicker">AVANT L’IMPORT</span><h2>Nom du cours</h2><p>Utilisez un identifiant simple, par exemple <strong>anatomie</strong> ou <strong>biochimie-s3</strong>. Il sera utilisé pour retrouver le cours dans les QCM.</p></div><input value={courseIdInput} onChange={(event) => setCourseIdInput(event.target.value)} placeholder="Ex. anatomie-s3" aria-label="Identifiant du cours" /></section>
    <div className="library-toolbar"><div className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans mes cours" /></div><span className="result-count">{filteredCourses.length} cours disponible{filteredCourses.length > 1 ? "s" : ""}</span></div>
    {coursesLoading && <div className="document-loading-note">Chargement de vos cours indexés…</div>}
    {coursesError && <div className="quiz-error" role="alert">{coursesError}</div>}
    {!coursesLoading && !coursesError && filteredCourses.length === 0 && <div className="empty-state"><div className="empty-icon"><Library size={23} /></div><h3>Aucun cours disponible</h3><p>Importez un PDF et attendez la fin de son indexation. Les cours d’exemple ne sont pas affichés comme s’ils étaient réels.</p></div>}
    {filteredCourses.length > 0 && <div className="course-grid">{filteredCourses.map((course) => <button key={course.id} className={`course-card ${selectedCourseId === course.id ? "course-card-selected" : ""}`} onClick={() => setSelectedCourseId(course.id)}><div className="course-card-banner banner-violet"><div className="banner-grid" /><span className="course-card-symbol"><FileText size={21} /></span></div><div className="course-card-content"><div className="course-card-meta"><span>{course.id}</span><span className="document-status document-status-indexed">Indexé</span></div><h3>{course.title}</h3><p>{course.firstDocumentTitle ?? "Cours importé"}</p><div className="course-card-stats"><span><FileText size={14} /> {course.indexedDocumentCount} document(s)</span><span><CheckCircle2 size={14} /> Prêt pour les QCM</span></div></div></button>)}</div>}
    {selectedCourse && <section className="panel imported-documents-panel"><div className="section-heading"><div><span className="section-kicker">COURS SÉLECTIONNÉ</span><h2>{selectedCourse.title}</h2></div><Button onClick={() => onNavigate("/quizzes")}>Créer un QCM <ArrowUpRight size={14} /></Button></div>{documentsLoading ? <div className="document-loading-note">Chargement des documents…</div> : documents.length === 0 ? <p className="document-loading-note">Aucun document trouvé pour ce cours.</p> : <div className="imported-document-list">{documents.map((document) => <div className="imported-document-row" key={document.id}><div className="imported-document-icon"><FileText size={17} /></div><div className="imported-document-copy"><strong>{document.title}</strong><span>{document.pageCount} page{document.pageCount > 1 ? "s" : ""} · {document.status === "indexed" ? "prêt" : "en traitement"}</span></div><span className={`document-status document-status-${document.status}`}>{document.status === "indexed" ? "Indexé" : "Traitement"}</span><button className="text-link" onClick={() => onNavigate("/tutor")}>Questionner <ArrowUpRight size={14} /></button></div>)}</div>}</section>}
  </div>;
}

export function StudioView({ onNavigate }: { onNavigate: Navigate }) {
  const [activeTab, setActiveTab] = useState("Résumé");
  const [note, setNote] = useState("");
  return <div className="page page-studio">
    <PageHeader eyebrow="Studio d’étude" title="Réviser simplement" description="Un espace calme pour lire le résumé de votre cours, noter les idées importantes et lancer un QCM. Les vidéos ont été retirées." action={<Button variant="secondary" onClick={() => onNavigate("/library")}><Library size={16} /> Retour aux cours</Button>} />
    <div className="studio-basic-grid"><section className="panel studio-basic-main"><div className="studio-course-heading"><div className="course-orb orb-violet"><FileText size={24} /></div><div><span className="section-kicker">COURS SÉLECTIONNÉ</span><h2>Pharmacologie générale</h2><p>Membrane et transport cellulaire · document importé</p></div></div><div className="studio-summary"><span className="section-kicker">RÉSUMÉ</span><h3>Comprendre le passage des molécules à travers la membrane</h3><p>La diffusion facilitée permet à certaines molécules de traverser la membrane grâce à un canal ou un transporteur, en suivant leur gradient de concentration, sans dépense directe d’ATP.</p></div><div className="studio-tabs"><div className="tab-list">{["Résumé", "Concepts clés", "Notes"].map((tab) => <button key={tab} className={activeTab === tab ? "tab-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="tab-content">{activeTab === "Résumé" && <><SourceBadge /><p>La membrane plasmique est une barrière sélective. La diffusion simple, la diffusion facilitée et le transport actif se distinguent par le rôle des protéines et la consommation d’énergie.</p></>}{activeTab === "Concepts clés" && <div className="concept-chip-list"><span>Gradient de concentration</span><span>Canal ionique</span><span>Transporteur</span><span>ATP</span></div>}{activeTab === "Notes" && <div className="notes-area"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Écrivez une note…" /><Button variant="secondary">Enregistrer</Button></div>}</div></div></section><aside className="panel studio-basic-side"><span className="section-kicker">ACTIONS RAPIDES</span><h3>Que voulez-vous faire ?</h3><button className="studio-simple-action" onClick={() => onNavigate("/tutor")}><Sparkles size={17} /> Poser une question au tuteur</button><button className="studio-simple-action" onClick={() => onNavigate("/quizzes")}><CheckCircle2 size={17} /> Générer un QCM</button><button className="studio-simple-action" onClick={() => onNavigate("/library")}><FileText size={17} /> Voir le document original</button><div className="studio-objectives"><span className="section-kicker">OBJECTIFS</span>{learningObjectives.map((objective) => <p key={objective}><CheckCircle2 size={14} /> {objective}</p>)}</div></aside></div>
  </div>;
}

function CitationChip({ children }: { children: ReactNode }) { return <span className="citation-chip"><FileText size={12} />{children}</span>; }

function SourceBadge({ type = "course" }: { type?: "course" | "supplement" }) { return <span className={`source-badge ${type === "supplement" ? "source-supplement" : ""}`}>{type === "supplement" ? <Sparkles size={12} /> : <CheckCircle2 size={12} />}{type === "supplement" ? "Explication complémentaire" : "Dans le cours"}</span>; }


function ClipboardIcon() { return <span className="inline-icon-placeholder">✓</span>; }

type ConversationMessage = (typeof chatMessages)[number];

export function TutorMessages({ compact = false, messages = [] }: { compact?: boolean; messages?: ConversationMessage[] }) {
  const allMessages = [...chatMessages, ...messages];
  return <div className={`chat-messages ${compact ? "chat-messages-compact" : ""}`}>{allMessages.map((message, index) => <div className={`chat-message chat-${message.role}`} key={`${message.role}-${index}`}><div className="chat-message-meta">{message.role === "assistant" && <span className="tiny-ai"><Sparkles size={11} /></span>}<span>{message.label}</span>{message.role === "assistant" && index === 0 && <SourceBadge />}</div><p>{message.text}</p>{message.citations.length > 0 && <div className="chat-citations">{message.citations.map((citation) => <CitationChip key={citation}>{citation}</CitationChip>)}</div>}</div>)}</div>;
}

function TutorComposer({ courseId = "pharmaco", onConversationMessage }: { courseId?: string; onConversationMessage?: (messages: ConversationMessage[]) => void }) {
  const [value, setValue] = useState("");
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [replyCitations, setReplyCitations] = useState<Array<{ documentTitle: string; pageNumber: number }>>([]);
  const cleanAnswer = (answer: string) => answer.replace(/\s*\[SOURCE\s+\d+(?:\s*,\s*SOURCE\s+\d+)*\]/gi, "").trim();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || asking) return;
    const submittedQuestion = value.trim();
    setAsking(true);
    setReply(null);
    setReplyCitations([]);
    onConversationMessage?.([{ role: "user", label: "Vous", text: submittedQuestion, citations: [] }, { role: "assistant", label: "UniverScience AI · recherche en cours", text: "Recherche dans votre cours…", citations: [] }]);
    try {
      const response = await fetch("/api/rag/ask", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ question: submittedQuestion, courseId, history: [] }) });
      const data = await response.json().catch(() => ({}));
      const answer = response.ok ? cleanAnswer(data.answer ?? "Aucune réponse disponible.") : (data.error ?? `Le tuteur a répondu avec le statut ${response.status}.`);
      setReply(answer);
      const rawCitations: unknown[] = Array.isArray(data.citations) ? data.citations : [];
      const citations = response.ok ? rawCitations.filter((citation: unknown): citation is { documentTitle: string; pageNumber: number } => Boolean(citation && typeof citation === "object" && "documentTitle" in citation && "pageNumber" in citation)).map((citation: { documentTitle: string; pageNumber: number }) => `${citation.documentTitle} · p. ${citation.pageNumber}`) : [];
      setReplyCitations(citations.map((citation) => { const separator = citation.lastIndexOf(" · p. "); return { documentTitle: citation.slice(0, separator), pageNumber: Number(citation.slice(separator + 6)) }; }));
      onConversationMessage?.([{ role: "assistant", label: response.ok ? "UniverScience AI · basé sur le cours" : "UniverScience AI · information", text: answer, citations }]);
    } catch {
      const answer = "Le service de tutorat n’est pas joignable pour le moment. Vérifiez la configuration serveur.";
      setReply(answer);
      onConversationMessage?.([{ role: "assistant", label: "UniverScience AI · erreur", text: answer, citations: [] }]);
    } finally {
      setAsking(false);
      setValue("");
    }
  };
  return <div className="tutor-composer-wrap"><div className="suggested-prompts"><button onClick={() => setValue("Explique-moi la différence avec le transport actif")}>Différence avec le transport actif</button><button onClick={() => setValue("Donne-moi un exemple clinique")}>Un exemple clinique</button></div>{reply && !onConversationMessage && <div className="tutor-inline-reply"><span className="tiny-ai"><Sparkles size={11} /></span><div className="tutor-reply-content"><p>{reply}</p>{replyCitations.length > 0 && <div className="chat-citations">{replyCitations.map((citation) => <CitationChip key={`${citation.documentTitle}-${citation.pageNumber}`}>{citation.documentTitle} · p. {citation.pageNumber}</CitationChip>)}</div>}</div></div>}<form className="tutor-composer" onSubmit={submit}><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={asking ? "Recherche dans le cours…" : "Posez une question sur ce chapitre…"} rows={1} /><div className="composer-actions"><button type="button" className="icon-button"><Plus size={16} /></button><span><button type="button" className="icon-button"><Mic2 size={16} /></button><button type="submit" className="send-button" aria-label="Envoyer"><Send size={16} /></button></span></div></form><div className="composer-disclaimer"><LockKeyhole size={11} /> Les réponses sont générées à partir des sources autorisées.</div></div>;
}

export function TutorView() {
  const [liveMessages, setLiveMessages] = useState<ConversationMessage[]>([]);
  return <div className="page page-tutor"><PageHeader eyebrow="Tuteur de cours" title="Posez vos questions, avec les sources à portée de main." description="Un espace de conversation lié à vos modules, conçu pour expliquer sans perdre le fil du document original." action={<div className="verified-note"><CheckCircle2 size={16} /> Sources activées</div>} /><div className="tutor-layout"><aside className="tutor-context-panel panel"><div className="panel-label-row"><span className="section-kicker">CONTEXTE DE LA SESSION</span><button className="icon-button"><MoreHorizontal size={17} /></button></div><div className="active-course-context"><div className="course-orb orb-violet"><FlaskConical size={22} /></div><strong>Pharmacologie générale</strong><span>Chapitre 03 · Membrane et transport cellulaire</span></div><div className="context-divider" /><span className="section-kicker">SUGGESTIONS</span><div className="prompt-list"><button><Lightbulb size={15} /> Résumer ce chapitre en 5 points</button><button><CircleHelp size={15} /> Pourquoi le gradient est-il important ?</button><button><FlaskConical size={15} /> Donner un exemple de médicament</button><button><Languages size={15} /> Expliquer en arabe</button></div><div className="tutor-source-note"><Info size={15} /><p>Les réponses distinguent le contenu présent dans le document des explications complémentaires.</p></div></aside><section className="panel tutor-conversation"><div className="conversation-header"><div><span className="section-kicker">CONVERSATION</span><h2>Membrane et transport cellulaire</h2></div><div className="conversation-actions"><button className="icon-button"><RefreshCw size={16} /></button><button className="icon-button"><MoreHorizontal size={17} /></button></div></div><div className="conversation-scroll"><TutorMessages messages={liveMessages} /><div className="conversation-loading"><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /><span>Le contexte sera recherché à chaque nouvelle question</span></div></div><TutorComposer onConversationMessage={(messages) => setLiveMessages((current) => { const next = [...current]; for (const message of messages) { if (message.role === "assistant" && next.at(-1)?.label === "UniverScience AI · recherche en cours") next[next.length - 1] = message; else next.push(message); } return next; })} /></section></div></div>;
}

export function DemoMvpView({ onNavigate }: { onNavigate: Navigate }) {
  return <div className="page page-demo"><PageHeader eyebrow="Mode MVP · démonstration" title="Tester UniverScience AI en quelques étapes." description="Cette vue reste disponible pour vérifier le parcours complet sans compte universitaire réel. Les données démo ne remplacent pas une authentification institutionnelle en production." /><div className="context-strip"><div className="context-strip-left"><div className="institution-icon"><Sparkles size={18} /></div><span>Démonstration du parcours</span><strong>Parcours interactif · sources de l’utilisateur</strong></div><span className="context-year">Aperçu interactif</span></div><div className="dashboard-grid dashboard-grid-main"><section className="panel demo-step-card"><span className="section-kicker">ÉTAPE 1 · SOURCES</span><h2>Importer un cours</h2><p>Ajoutez un PDF autorisé pour alimenter le tuteur et la génération de QCM avec ses pages sources.</p><Button onClick={() => onNavigate("/library")}><Library size={16} /> Ouvrir la bibliothèque</Button></section><section className="panel demo-step-card"><span className="section-kicker">ÉTAPE 2 · APPRENDRE</span><h2>Questionner le tuteur</h2><p>Posez une question sur le document sélectionné et vérifiez les citations retournées.</p><Button variant="secondary" onClick={() => onNavigate("/tutor")}><Bot size={16} /> Ouvrir le tuteur</Button></section><section className="panel demo-step-card"><span className="section-kicker">ÉTAPE 3 · S’ENTRAÎNER</span><h2>Générer un QCM</h2><p>Choisissez le cours, le chapitre, la difficulté et le nombre de questions à générer.</p><Button variant="secondary" onClick={() => onNavigate("/quizzes")}><CheckCircle2 size={16} /> Ouvrir les QCM</Button></section><section className="panel demo-step-card"><span className="section-kicker">ÉTAPE 4 · MESURER</span><h2>Consulter la progression</h2><p>Les scores réels et les concepts à reprendre sont chargés depuis vos tentatives enregistrées côté backend.</p><Button variant="secondary" onClick={() => onNavigate("/progress")}><Gauge size={16} /> Voir la progression</Button></section></div><div className="quiz-bottom-note"><LockKeyhole size={14} /> La session est vérifiée par le serveur. Utilisez « Se déconnecter » en haut à droite pour fermer votre session.</div></div>;
}

export function GenericView({ title, eyebrow, description, icon: Icon = FolderOpen }: { title: string; eyebrow: string; description: string; icon?: LucideIcon }) {
  return <div className="page"><PageHeader eyebrow={eyebrow} title={title} description={description} /><div className="panel empty-state generic-empty"><div className="empty-icon"><Icon size={24} /></div><h3>Votre espace est prêt</h3><p>Cette section est structurée dans l’application. Les données connectées apparaîtront lorsque votre établissement et vos ressources seront configurés.</p><Button variant="secondary"><Plus size={16} /> Ajouter une ressource</Button></div></div>;
}
