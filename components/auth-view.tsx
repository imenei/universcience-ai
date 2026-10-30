"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";

type AuthMode = "login" | "signup";

export function AuthView() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "signup" && password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || (mode === "login" ? "Connexion impossible." : "Création du compte impossible.")); return; }
      if (mode === "signup" && data.requiresEmailConfirmation) {
        setNotice("Compte créé. Consultez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      window.location.assign("/");
    } catch { setError("Le service d’authentification est momentanément indisponible."); }
    finally { setLoading(false); }
  }

  async function enterDemo() {
    setError("");
    setNotice("");
    setDemoLoading(true);
    try {
      const response = await fetch("/api/session", { method: "POST", credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.demo) { setError(data.error || "La démonstration n’est pas disponible dans cet environnement."); return; }
      window.location.assign("/demo");
    } catch { setError("Le service de démonstration est momentanément indisponible."); }
    finally { setDemoLoading(false); }
  }

  const isSignup = mode === "signup";
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-brand"><span className="brand-mark"><span className="brand-mark-page" /><span className="brand-mark-spark">✦</span></span><strong>UniverScience AI<span>.</span></strong></div>
    <div className="auth-icon">{isSignup ? <UserPlus size={22} /> : <BookOpen size={22} />}</div>
    <div className="eyebrow">Espace étudiant</div>
    <h1>{isSignup ? "Créer votre espace." : "Retrouver votre espace."}</h1>
    <p className="auth-intro">{isSignup ? "Créez un compte pour sauvegarder vos cours, vos QCM et votre progression." : "Connectez-vous avec votre compte universitaire pour retrouver vos cours et utiliser le tuteur contextualisé."}</p>
    <div className="auth-mode-switch" role="tablist" aria-label="Mode d’authentification">
      <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")} role="tab" aria-selected={mode === "login"}>Se connecter</button>
      <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")} role="tab" aria-selected={mode === "signup"}>Créer un compte</button>
    </div>
    <form onSubmit={submit} className="auth-form">
      <label>Email universitaire<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@universite.dz" autoComplete="email" required /></label>
      <label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "8 caractères minimum" : "Votre mot de passe"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 8 : undefined} required /></label>
      {isSignup && <label>Confirmer le mot de passe<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Répétez votre mot de passe" autoComplete="new-password" minLength={8} required /></label>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="auth-notice" role="status">{notice}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading || demoLoading}>{loading ? <LoaderCircle size={16} className="spin" /> : <ShieldCheck size={16} />} {loading ? (isSignup ? "Création…" : "Connexion…") : (isSignup ? "Créer mon compte" : "Se connecter")}<ArrowRight size={15} /></button>
    </form>
    <div className="auth-divider"><span>ou</span></div>
    <button className="button button-secondary auth-demo" type="button" onClick={() => void enterDemo()} disabled={loading || demoLoading}>{demoLoading ? <LoaderCircle size={16} className="spin" /> : <BookOpen size={16} />} {demoLoading ? "Ouverture de la démonstration…" : "Voir la démonstration"}</button>
    <p className="auth-demo-note">Session temporaire · aucune donnée institutionnelle requise pour la démonstration</p>
    <p className="auth-note">La connexion et la création de compte utilisent Supabase Auth. La démonstration crée une session temporaire séparée, sans compte institutionnel.</p>
  </div></main>;
}
