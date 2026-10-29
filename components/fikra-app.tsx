"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { AppShell, type Language } from "@/components/app-shell";
import { DashboardView, DemoMvpView, GenericView, LibraryView, StudioView, TutorView } from "@/components/views";
import { MyLearningView } from "@/components/my-learning-view";
import { QuizView } from "@/components/quiz-view";
import { ProgressView } from "@/components/progress-view";
import { Archive, Settings } from "lucide-react";

type SessionUser = { id: string; email?: string; demo?: boolean };

export function FikraApp() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("Français");
  const [sessionState, setSessionState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    setSessionState("checking");
    fetch("/api/session", { credentials: "include", cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok && data.authenticated && data.user?.id) {
          setSessionUser({ ...data.user, demo: Boolean(data.demo) });
          setSessionState("authenticated");
          return;
        }
        setSessionUser(null);
        setSessionState("unauthenticated");
        router.replace("/login");
      })
      .catch(() => {
        if (!active) return;
        setSessionUser(null);
        setSessionState("unauthenticated");
        router.replace("/login");
      });
    return () => { active = false; };
  }, [pathname, router]);

  const onNavigate = (href: string) => router.push(href);
  if (sessionState !== "authenticated") {
    return <main className="auth-page"><div className="session-check-card"><LoaderCircle size={20} className="spin" /><span>{sessionState === "checking" ? "Vérification de votre session…" : "Redirection vers la connexion…"}</span></div></main>;
  }

  let view: ReactNode;
  if (pathname === "/" || pathname === "") view = <DashboardView onNavigate={onNavigate} user={sessionUser} />;
  else if (pathname === "/library") view = <LibraryView onNavigate={onNavigate} />;
  else if (pathname === "/my-learning") view = <MyLearningView onNavigate={onNavigate} />;
  else if (pathname === "/studio") view = <StudioView onNavigate={onNavigate} />;
  else if (pathname === "/tutor") view = <TutorView />;
  else if (pathname === "/quizzes") view = <QuizView onNavigate={onNavigate} />;
  else if (pathname === "/demo") view = <DemoMvpView onNavigate={onNavigate} />;
  else if (pathname === "/progress") view = <ProgressView onNavigate={onNavigate} />;
  else if (pathname === "/saved") view = <GenericView title="Ressources enregistrées" eyebrow="Espace personnel" description="Vos documents, résumés et explications sauvegardés pour y revenir au bon moment." icon={Archive} />;
  else if (pathname === "/settings") view = <GenericView title="Paramètres" eyebrow="Espace personnel" description="Gérez votre langue, vos préférences de révision et les sources utilisées par votre espace d’étude." icon={Settings} />;
  else view = <DashboardView onNavigate={onNavigate} user={sessionUser} />;

  return <AppShell pathname={pathname} onNavigate={onNavigate} language={language} onLanguageChange={setLanguage} user={sessionUser}>{view}</AppShell>;
}
