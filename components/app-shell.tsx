"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { navItems } from "@/lib/data";

export type Language = "Français" | "English" | "العربية";

type AppShellProps = {
  pathname: string;
  children: ReactNode;
  onNavigate: (href: string) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  user: { id: string; email?: string; demo?: boolean } | null;
};

const demoHighlights: Record<string, { label: string; title: string; description: string }> = {
  "/": { label: "APERÇU", title: "Votre parcours en un coup d’œil", description: "Cours indexés, activité et raccourcis pour commencer." },
  "/library": { label: "SOURCES", title: "Explorer les documents indexés", description: "Chaque PDF devient une source vérifiable pour l’IA." },
  "/tutor": { label: "TUTEUR IA", title: "Poser une question au cours", description: "Testez une réponse contextualisée avec citation de page." },
  "/quizzes": { label: "QCM", title: "Transformer le cours en entraînement", description: "Générez un QCM grounded puis mesurez votre résultat." },
  "/progress": { label: "PROGRESSION", title: "Voir ce qui mérite votre attention", description: "Les scores et concepts à revoir suivent vos tentatives." },
  "/demo": { label: "VISITE GUIDÉE", title: "Voir un exemple complet", description: "Question, source, QCM et progression en quelques clics." },
};

export function AppShell({ pathname, children, onNavigate, language, onLanguageChange, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const userLabel = user?.demo ? "Mode démo" : user?.email?.split("@")[0] || "Étudiant";
  const initials = user?.demo ? "DÉ" : user?.email?.slice(0, 2).toUpperCase() || "ET";

  const activeItem = navItems.find((item) => item.href === pathname) ?? navItems[0];
  const breadcrumb = pathname === "/" ? ["Espace étudiant"] : ["Espace étudiant", activeItem.label];

  const go = (href: string) => {
    setMobileOpen(false);
    onNavigate(href);
  };

  const logout = async () => {
    setLogoutLoading(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("La déconnexion n’a pas pu être confirmée.");
      window.location.assign("/login");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "La déconnexion a échoué. Réessayez.");
      setLogoutLoading(false);
    }
  };

  return (
    <div className="app-frame">
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand-lockup">
          <button className="brand-mark" aria-label="Retour au dashboard" onClick={() => go("/")}>
            <span className="brand-mark-page" />
            <span className="brand-mark-spark">✦</span>
          </button>
          {!collapsed && <div className="brand-wordmark">UniverScience AI<span>.</span></div>}
          <button className="icon-button sidebar-close-mobile" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>

        {!collapsed && (
          <div className="university-context">
            <div className="context-avatar">US</div>
            <div className="context-copy">
              <strong>Espace universitaire</strong>
              <span>Données autorisées pour ce compte</span>
            </div>
            <ChevronDown size={15} className="muted-icon" />
          </div>
        )}

        <nav className="primary-nav" aria-label="Navigation principale">
          <div className="nav-section-label">Apprendre</div>
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const active = item.href === pathname || (pathname === "/" && item.href === "/");
            return (
              <button key={item.href} className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={() => go(item.href)} title={collapsed ? item.label : undefined}>
                <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
          <div className="nav-section-label nav-section-secondary">Espace personnel</div>
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const active = item.href === pathname;
            return (
              <button key={item.href} className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={() => go(item.href)} title={collapsed ? item.label : undefined}>
                <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="sidebar-footer-card">
            <div className="footer-card-icon"><Sparkles size={16} /></div>
            <div>
              <strong>Besoin de comprendre ?</strong>
              <p>Posez une question à partir de votre cours.</p>
              <button onClick={() => go("/demo")}>Ouvrir la démo MVP <ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        <div className="sidebar-bottom">
          <button className="collapse-button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && <span>Réduire le menu</span>}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-topbar-left">
            <button className="icon-button mobile-menu-trigger" aria-label="Ouvrir le menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <button className="mobile-brand" onClick={() => go("/")}><span className="brand-mark mini"><span className="brand-mark-page" /><span className="brand-mark-spark">✦</span></span>UniverScience AI<span>.</span></button>
          </div>
          <div className="breadcrumbs" aria-label="Fil d’Ariane">
            {breadcrumb.map((crumb, index) => <span key={crumb} className={index === breadcrumb.length - 1 ? "breadcrumb-current" : ""}>{index > 0 && <ChevronRight size={13} />}{crumb}</span>)}
          </div>
          <div className="topbar-actions">
            <div className={`global-search ${searchOpen ? "global-search-open" : ""}`}>
              <Search size={17} />
              <input aria-label="Rechercher dans les cours" placeholder="Rechercher dans vos cours" />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button search-mobile" aria-label="Rechercher" onClick={() => setSearchOpen((value) => !value)}><Search size={18} /></button>
            <div className="language-control">
              <Globe2 size={16} />
              <select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)} aria-label="Choisir la langue">
                <option>Français</option>
                <option>English</option>
                <option>العربية</option>
              </select>
            </div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
            <button className="profile-button" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => void logout()} disabled={logoutLoading}>
              <span className="profile-avatar">{initials}</span>
              <span className="profile-name">{userLabel}</span>
              <LogOut size={15} aria-hidden="true" />
              <span className="profile-logout-label">{logoutLoading ? "Déconnexion…" : "Se déconnecter"}</span>
            </button>
            {logoutError && <span className="logout-error" role="alert">{logoutError}</span>}
          </div>
        </header>
        {user?.demo && <div className="demo-guide-strip"><div className="demo-guide-main"><span className="demo-guide-icon"><Sparkles size={15} /></span><div><span className="demo-guide-kicker">MODE DÉMO · {demoHighlights[pathname]?.label ?? "EXPLORATION"}</span><strong>{demoHighlights[pathname]?.title ?? "Explorez UniverScience AI"}</strong><span>{demoHighlights[pathname]?.description ?? "Découvrez le parcours d’apprentissage guidé."}</span></div></div><div className="demo-guide-links"><button className={pathname === "/demo" ? "active" : ""} onClick={() => go("/demo")}>Visite</button><button className={pathname === "/tutor" ? "active" : ""} onClick={() => go("/tutor")}>Tuteur</button><button className={pathname === "/quizzes" ? "active" : ""} onClick={() => go("/quizzes")}>QCM</button><button className={pathname === "/progress" ? "active" : ""} onClick={() => go("/progress")}>Progression</button></div></div>}
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
