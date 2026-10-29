import {
  Archive,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Bibliothèque de cours", href: "/library", icon: Library },
  { label: "Mon apprentissage", href: "/my-learning", icon: BookOpen },
  { label: "Tuteur IA", href: "/tutor", icon: BrainCircuit },
  { label: "QCM & examens", href: "/quizzes", icon: ClipboardCheck },
  { label: "Progression", href: "/progress", icon: BarChart3 },
  { label: "Ressources enregistrées", href: "/saved", icon: Archive, badge: "8" },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export const courseCards = [
  {
    id: "pharmaco",
    title: "Pharmacologie générale",
    subtitle: "2e année · Semestre 3",
    professor: "Cours institutionnel · revue en attente",
    progress: 68,
    chapters: 12,
    resources: 24,
    status: "pending-review" as const,
    accent: "violet",
  },
  {
    id: "biochem",
    title: "Biochimie métabolique",
    subtitle: "2e année · Semestre 3",
    professor: "Dr. N. Benali · contenu du cours",
    progress: 42,
    chapters: 9,
    resources: 18,
    status: "professor-reviewed" as const,
    accent: "teal",
  },
  {
    id: "physio",
    title: "Physiologie humaine",
    subtitle: "1re année · Semestre 2",
    professor: "Supports de faculté · AI-generated",
    progress: 31,
    chapters: 14,
    resources: 31,
    status: "ai-generated" as const,
    accent: "amber",
  },
  {
    id: "anatomy",
    title: "Anatomie fonctionnelle",
    subtitle: "1re année · Semestre 2",
    professor: "Pr. S. Rahmani · contenu du cours",
    progress: 76,
    chapters: 16,
    resources: 37,
    status: "professor-reviewed" as const,
    accent: "blue",
  },
  {
    id: "chimie",
    title: "Chimie thérapeutique",
    subtitle: "3e année · Semestre 5",
    professor: "Support de module · revue en attente",
    progress: 18,
    chapters: 8,
    resources: 14,
    status: "pending-review" as const,
    accent: "rose",
  },
  {
    id: "microbio",
    title: "Microbiologie médicale",
    subtitle: "2e année · Semestre 4",
    professor: "Cours de faculté · AI-generated",
    progress: 55,
    chapters: 11,
    resources: 22,
    status: "ai-generated" as const,
    accent: "green",
  },
];

export const weeklyActivity = [
  { day: "Lun", value: 42, label: "42 min" },
  { day: "Mar", value: 68, label: "1 h 08" },
  { day: "Mer", value: 34, label: "34 min" },
  { day: "Jeu", value: 78, label: "1 h 18" },
  { day: "Ven", value: 52, label: "52 min" },
  { day: "Sam", value: 27, label: "27 min" },
  { day: "Dim", value: 12, label: "12 min" },
];

export const progressBySubject = [
  { label: "Pharmacologie", value: 68, tone: "violet" },
  { label: "Biochimie", value: 42, tone: "teal" },
  { label: "Anatomie", value: 76, tone: "blue" },
  { label: "Physiologie", value: 31, tone: "amber" },
];

export const quizQuestion = {
  id: "q-transport-01",
  count: 7,
  total: 12,
  chapter: "Pharmacologie générale · Chapitre 03",
  prompt: "Quel mécanisme décrit le mieux le passage d’une molécule à travers une membrane selon son gradient de concentration, sans dépense directe d’ATP ?",
  options: [
    { id: "a", label: "Transport actif primaire", detail: "Utilise directement l’hydrolyse de l’ATP." },
    { id: "b", label: "Diffusion facilitée", detail: "Utilise un transporteur ou un canal sans ATP direct." },
    { id: "c", label: "Endocytose médiée par récepteur", detail: "Internalise une particule par invagination membranaire." },
    { id: "d", label: "Pompe ionique", detail: "Maintient un gradient contre le gradient électrochimique." },
  ],
  answer: "b",
  explanation: "La diffusion facilitée suit le gradient de concentration et implique une protéine membranaire. Elle ne consomme pas directement d’ATP, contrairement au transport actif primaire.",
};

export const chatMessages = [
  {
    role: "assistant" as const,
    label: "UniverScience AI · basé sur le cours",
    text: "La diffusion facilitée permet à certaines molécules de traverser la membrane via un canal ou un transporteur, tout en suivant leur gradient de concentration. Elle ne requiert pas de dépense directe d’ATP.",
    citations: ["Pharmacologie générale.pdf · p. 18"],
  },
  {
    role: "user" as const,
    label: "Vous",
    text: "Quelle est la différence avec un transport actif secondaire ?",
    citations: [],
  },
  {
    role: "assistant" as const,
    label: "UniverScience AI · explication complémentaire",
    text: "Le transport actif secondaire n’hydrolyse pas directement l’ATP. Il exploite l’énergie stockée dans le gradient d’un autre ion, souvent Na⁺, pour déplacer une seconde substance contre son gradient.",
    citations: ["Pharmacologie générale.pdf · p. 19", "Explication complémentaire · à vérifier"],
  },
];

export const recentHistory = [
  { title: "Membrane et transport cellulaire", course: "Pharmacologie générale", when: "Aujourd’hui, 10:42", type: "Studio" },
  { title: "QCM · Enzymologie", course: "Biochimie métabolique", when: "Hier, 18:15", type: "Quiz" },
  { title: "Voies d’administration", course: "Pharmacologie générale", when: "Hier, 15:30", type: "Résumé" },
  { title: "Os du membre supérieur", course: "Anatomie fonctionnelle", when: "Lun. 21 oct.", type: "Document" },
];

export const learningObjectives = [
  "Différencier diffusion simple, diffusion facilitée et transport actif.",
  "Relier le gradient électrochimique au déplacement des ions.",
  "Identifier les implications pharmacocinétiques des transporteurs.",
];

export const institutionalContext = {
  university: "Université des Sciences de la Santé d’Alger",
  specialty: "Pharmacie",
  year: "2e année · 2025–2026",
};

export const statusLabel: Record<string, string> = {
  "professor-reviewed": "Revu dans le cours",
  "ai-generated": "Généré par IA · à vérifier",
  "pending-review": "Revue en attente",
};

export const statusIcon = {
  reviewed: GraduationCap,
  ai: Sparkles,
};
