"use client";

import { useEffect, useState, type FormEvent } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "1") {
      setNotice("Adresse confirmée. Vous pouvez maintenant vous connecter.");
      window.history.replaceState({}, "", "/login");
    } else if (params.get("mode") === "signup") {
      setMode("signup");
    }
  }, []);

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
      window.location.assign("/dashboard");
    } catch { setError("Le service d’authentification est momentanément indisponible."); }
    finally { setLoading(false); }
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
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <ShieldCheck size={16} />} {loading ? (isSignup ? "Création…" : "Connexion…") : (isSignup ? "Créer mon compte" : "Se connecter")}<ArrowRight size={15} /></button>
    </form>
    <p className="auth-note">La connexion et la création de compte utilisent Supabase Auth. Votre espace est accessible après confirmation de votre adresse email.</p>
  </div></main>;
}
