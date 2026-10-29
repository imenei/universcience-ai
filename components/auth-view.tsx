"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, LoaderCircle, ShieldCheck } from "lucide-react";

export function AuthView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || "Connexion impossible."); return; }
      window.location.assign("/");
    } catch { setError("Le service de connexion est momentanément indisponible."); }
    finally { setLoading(false); }
  }

  async function enterDemo() {
    setError("");
    setDemoLoading(true);
    try {
      const response = await fetch("/api/session", { method: "POST", credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.demo) { setError(data.error || "La démonstration n’est pas disponible dans cet environnement."); return; }
      window.location.assign("/demo");
    } catch { setError("Le service de démonstration est momentanément indisponible."); }
    finally { setDemoLoading(false); }
  }

  return <main className="auth-page"><div className="auth-card">
    <div className="auth-brand"><span className="brand-mark"><span className="brand-mark-page" /><span className="brand-mark-spark">✦</span></span><strong>UniverScience AI<span>.</span></strong></div>
    <div className="auth-icon"><BookOpen size={22} /></div>
    <div className="eyebrow">Espace étudiant</div>
    <h1>Retrouver votre espace.</h1>
    <p className="auth-intro">Connectez-vous avec votre compte universitaire pour retrouver vos cours et utiliser le tuteur contextualisé.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Email universitaire<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@universite.dz" autoComplete="email" required /></label>
      <label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" autoComplete="current-password" required /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading || demoLoading}>{loading ? <LoaderCircle size={16} className="spin" /> : <ShieldCheck size={16} />} {loading ? "Connexion…" : "Se connecter"}<ArrowRight size={15} /></button>
    </form>
    <div className="auth-divider"><span>ou</span></div>
    <button className="button button-secondary auth-demo" type="button" onClick={() => void enterDemo()} disabled={loading || demoLoading}>{demoLoading ? <LoaderCircle size={16} className="spin" /> : <BookOpen size={16} />} {demoLoading ? "Ouverture de la démonstration…" : "Voir la démonstration"}</button>
    <p className="auth-demo-note">Sous la connexion · session temporaire de démonstration · aucune donnée institutionnelle requise</p>
    <p className="auth-note">La connexion réelle utilise Supabase Auth et des cookies HttpOnly. La démonstration crée une session temporaire séparée, sans compte institutionnel.</p>
  </div></main>;
}
