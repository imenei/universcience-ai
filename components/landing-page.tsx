import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  BookOpen,
  BrainCircuit,
  Check,
  FileText,
  GraduationCap,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    number: "01",
    title: "Comprendre le cours",
    text: "Posez une question et retrouvez les passages utiles dans les documents autorisés. Les sources restent visibles quand elles sont disponibles.",
    tone: "violet",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "S’entraîner sur le contenu",
    text: "Générez des QCM à partir des cours indexés. Les réponses et explications apparaissent après l’enregistrement de votre tentative.",
    tone: "teal",
  },
  {
    icon: Layers,
    number: "03",
    title: "Suivre son rythme",
    text: "Retrouvez vos tentatives et votre progression à partir de vos données réelles, sans résultats de démonstration présentés comme les vôtres.",
    tone: "amber",
  },
];

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Ajoutez un support autorisé",
    text: "Importez un cours PDF auquel vous avez le droit d’accéder.",
  },
  {
    icon: MessageCircle,
    number: "02",
    title: "Interrogez vos sources",
    text: "Le tuteur recherche dans le contenu indexé et cite les passages utiles.",
  },
  {
    icon: Check,
    number: "03",
    title: "Consolidez vos acquis",
    text: "Entraînez-vous avec des QCM liés au cours, puis consultez vos résultats.",
  },
];

function Brand() {
  return (
    <Link className="landing-brand" href="/" aria-label="UniverScience AI, accueil">
      <span className="landing-brand-mark" aria-hidden="true">
        <span className="landing-brand-page" />
        <span className="landing-brand-spark">✦</span>
      </span>
      <span className="landing-brand-name">UniverScience <b>AI</b></span>
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Brand />
          <nav className="landing-nav-links" aria-label="Navigation de la page">
            <a href="#fonctionnalites">L’approche</a>
            <a href="#comment-ca-marche">Comment ça marche</a>
            <a href="#pour-qui">Pour qui</a>
          </nav>
          <div className="landing-header-actions">
            <Link className="landing-login-link" href="/login">Connexion</Link>
            <Link className="button button-primary landing-button landing-header-cta" href="/login?mode=signup">
              Créer un compte <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-container landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow"><span><Sparkles size={14} aria-hidden="true" /></span> Le studio d’étude qui part de vos cours</div>
            <h1 id="landing-title">Comprendre le cours.<br /><em>Retenir l’essentiel.</em></h1>
            <p className="landing-hero-description">
              UniverScience AI relie vos supports autorisés, un tuteur qui cite ses sources et des QCM adaptés aux documents indexés — dans un même espace de révision.
            </p>
            <div className="landing-hero-actions">
              <Link className="button button-primary landing-button landing-button-large" href="/login?mode=signup">
                Créer mon espace <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a className="landing-text-link" href="#comment-ca-marche">Découvrir l’approche <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="landing-hero-note">
              <span className="landing-note-mark"><Check size={13} aria-hidden="true" /></span>
              <span>Vos cours restent au centre. L’IA vous aide à les travailler.</span>
            </div>
          </div>

          <div className="landing-hero-visual" role="img" aria-label="Aperçu illustratif d’un cours, d’une réponse sourcée et d’un QCM">
            <div className="landing-orbit landing-orbit-one" aria-hidden="true" />
            <div className="landing-orbit landing-orbit-two" aria-hidden="true" />
            <div className="landing-preview-window" aria-hidden="true">
              <div className="landing-preview-topbar">
                <div className="landing-window-dots"><i /><i /><i /></div>
                <span>ESPACE D’ÉTUDE</span>
                <span className="landing-preview-label">APERÇU ILLUSTRATIF</span>
              </div>
              <div className="landing-course-card">
                <div className="landing-course-icon"><FileText size={19} /></div>
                <div className="landing-course-copy"><span>PHARMACOLOGIE GÉNÉRALE</span><strong>Membrane &amp; transport</strong></div>
                <span className="landing-course-tag">PDF</span>
              </div>
              <div className="landing-tutor-card">
                <div className="landing-tutor-heading">
                  <span className="landing-tutor-avatar"><BrainCircuit size={15} /></span>
                  <span><strong>Tuteur de cours</strong><small>Recherche dans vos sources</small></span>
                  <span className="landing-live-dot" />
                </div>
                <div className="landing-question">Pourquoi le gradient électrochimique est-il important ?</div>
                <div className="landing-answer">Il aide à expliquer le déplacement des ions à travers la membrane. Comparez cette explication au passage de votre cours.</div>
                <div className="landing-citation"><BookOpen size={13} /><span>Source de cours</span><b>p. 12</b></div>
              </div>
              <div className="landing-quiz-card">
                <div className="landing-quiz-icon"><Check size={17} /></div>
                <div><span>POUR ALLER PLUS LOIN</span><strong>Un QCM lié à votre cours</strong></div>
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="landing-floating-note" aria-hidden="true"><span className="landing-floating-check"><Check size={13} /></span><span><strong>Sources visibles</strong><small>Le cours reste votre repère</small></span></div>
          </div>
        </section>

        <section className="landing-proof-band" aria-label="Principes de l’espace d’étude">
          <div className="landing-container landing-proof-inner">
            <span className="landing-proof-intro">Un espace de travail bâti autour de trois repères</span>
            <div><BookOpen size={17} aria-hidden="true" /><span>Vos supports de cours</span></div>
            <div><BrainCircuit size={17} aria-hidden="true" /><span>Des explications contextualisées</span></div>
            <div><Check size={17} aria-hidden="true" /><span>Des résultats enregistrés</span></div>
          </div>
        </section>

        <section className="landing-container landing-features" id="fonctionnalites" aria-labelledby="features-title">
          <div className="landing-section-intro">
            <span className="landing-section-kicker">L’APPRENTISSAGE, RELIÉ À VOS SOURCES</span>
            <h2 id="features-title">Moins de dispersion.<br /><em>Plus de continuité.</em></h2>
            <p>Du premier document à la révision, gardez le contexte de votre cours à portée de main.</p>
            <Link className="landing-inline-link" href="/login?mode=signup">Découvrir mon espace <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="landing-feature-list">
            {features.map(({ icon: Icon, number, title, text, tone }) => (
              <article className="landing-feature" key={number}>
                <div className={`landing-feature-icon landing-tone-${tone}`}><Icon size={20} aria-hidden="true" /></div>
                <div className="landing-feature-body">
                  <span className="landing-feature-number">{number} / 03</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowUpRight className="landing-feature-arrow" size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="landing-how" id="comment-ca-marche" aria-labelledby="how-title">
          <div className="landing-container">
            <div className="landing-how-heading">
              <div>
                <span className="landing-section-kicker">UN PARCOURS SIMPLE, SANS PERDRE LE FIL</span>
                <h2 id="how-title">Votre cours. Votre méthode.<br /><em>Une étape à la fois.</em></h2>
              </div>
              <p>Un espace pour transformer vos ressources autorisées en moments de compréhension et d’entraînement.</p>
            </div>
            <div className="landing-steps">
              {steps.map(({ icon: Icon, number, title, text }) => (
                <article className="landing-step" key={number}>
                  <div className="landing-step-top"><span className="landing-step-icon"><Icon size={19} aria-hidden="true" /></span><span>{number}</span></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-container landing-audience" id="pour-qui" aria-labelledby="audience-title">
          <div className="landing-audience-mark" aria-hidden="true"><Atom size={34} strokeWidth={1.5} /></div>
          <div className="landing-audience-copy">
            <span className="landing-section-kicker">POUR LES PARCOURS QUI DEMANDENT DE LA RIGUEUR</span>
            <h2 id="audience-title">Des cours denses méritent<br /><em>un espace à leur mesure.</em></h2>
            <p>Pharmacie, médecine, sciences : organisez vos supports, questionnez les notions difficiles et révisez à partir de ce que vous étudiez réellement.</p>
          </div>
          <div className="landing-audience-tags" aria-label="Domaines d’étude">
            <span><GraduationCap size={16} aria-hidden="true" /> Pharmacie</span>
            <span><Atom size={16} aria-hidden="true" /> Médecine</span>
            <span><BookOpen size={16} aria-hidden="true" /> Sciences</span>
          </div>
        </section>

        <section className="landing-container landing-final-cta" aria-labelledby="final-cta-title">
          <div className="landing-final-copy">
            <span className="landing-section-kicker">LE PROCHAIN CHAPITRE COMMENCE AVEC VOUS</span>
            <h2 id="final-cta-title">Faites de votre prochain cours<br /><em>un meilleur point de départ.</em></h2>
            <p>Retrouvez vos supports, posez vos questions et avancez à votre rythme.</p>
          </div>
          <Link className="button landing-button landing-button-light" href="/login?mode=signup">Créer mon espace <ArrowRight size={17} aria-hidden="true" /></Link>
          <Sparkles className="landing-final-spark" size={27} aria-hidden="true" />
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <Brand />
          <p>L’IA peut se tromper. Vérifiez toujours les explications à l’aide de vos supports et des consignes de votre enseignement.</p>
          <Link href="/login">Connexion <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  );
}
