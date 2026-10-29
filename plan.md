# UniverScience AI — plan d’implémentation et de design

## Périmètre

UniverScience AI est une application d’apprentissage universitaire destinée d’abord aux étudiants en pharmacie et médecine en Algérie. La livraison reprend l’interface et le pipeline RAG existants en fermant l’écart entre les écrans et les données serveur : les QCM partent d’un cours réellement accessible et indexé, les tentatives et résultats sont lus/calculés côté backend, et les vues de progression utilisent les données de la session. Les intégrations externes non configurées restent explicitement signalées plutôt que simulées.

## Approche technique

- Next.js App Router + TypeScript pour les pages et les Route Handlers.
- Design system CSS avec variables, composants réutilisables, Lucide React et une mise en page responsive.
- Shell applicatif partagé avec sidebar repliable, top bar, fil d’Ariane et navigation par routes.
- Service RAG côté serveur séparé en ingestion PDF, embeddings, retrieval, génération et validation des citations.
- PostgreSQL/pgvector via `RAG_DATABASE_URL` lorsque configuré; le schéma SQL est versionné dans `db/schema.sql`.
- Fournisseur IA configurable via variables serveur uniquement (`AI_BASE_URL`, `AI_API_KEY`, `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL`).
- Conserver les exemples visuels déjà existants, mais ne jamais les proposer comme cours générables ni les afficher comme tentatives ou progression réelles.
- Vérifier la session via `/api/session` avant d’afficher le shell privé; le POST démo est explicite et interdit en production. `FIKRA_SESSION_SECRET` doit être une clé stable d’au moins 32 caractères, configurée dans l’environnement serveur.
- Alimenter le choix du cours via `/api/courses`; ne renvoyer dans la génération que les questions, options et sources; ne révéler les réponses et explications qu’après correction backend de la tentative.
- Ajouter `/api/progress` pour agréger les tentatives du seul utilisateur courant, les moyennes hebdomadaires, résultats par cours, concepts erronés et historique; alimenter le Dashboard, Mon apprentissage et Progression sans compteurs fictifs.

## Structure

- `app/`: layout, pages, manifeste de routes et endpoints d’authentification/session, cours, documents, ingestion, tuteur RAG, QCM, tentatives et progression.
- `components/`: shell, navigation, Dashboard et Mon apprentissage alimentés par les APIs, générateur QCM avec corrections après soumission, progression réelle et vues de cours.
- `lib/data.ts`: contenu de démonstration et types UI.
- `lib/rag/`: extraction, chunking, fournisseur IA, retrieval, citations et orchestration.
- `db/schema.sql`: tables et index pgvector pour documents, chunks, jobs et conversations.
- `public/`: manifeste des routes et fichiers statiques.

## Design

### Styles explorés

- **Editorial Scientific SaaS** — probabilité 0,07 : une interface de revue académique, claire et structurée.
- **Clinical Command Center** — probabilité 0,04 : une console plus dense, clinique et orientée suivi.
- **Quiet Academic Atelier** — probabilité 0,06 : un espace d’étude plus calme, tactile et contemplatif.

Le style choisi est **Editorial Scientific SaaS**.

### Mouvement de design

Un SaaS éditorial scientifique : l’information est hiérarchisée comme une page de cours bien annotée, avec une densité maîtrisée plutôt qu’un dashboard rempli de widgets.

### Principes

1. Une seule action d’apprentissage principale par vue.
2. Les sources et les statuts de vérification sont visibles, mais jamais alarmistes.
3. Les formes et couleurs servent la lecture et l’orientation, pas la décoration.
4. Les panneaux latéraux se replient pour préserver la concentration.

### Philosophie couleur

Le violet électrique identifie l’action et l’intelligence pédagogique. Le blanc chaud et le lavender créent une atmosphère de page imprimée modernisée. L’encre profonde garantit la lecture; le vert est réservé aux activités terminées et aux contenus vérifiés. Les bordures restent lavande-gris pour dessiner des limites sans alourdir l’espace.

### Paradigme de mise en page

Une composition en « rail d’étude » : une navigation permanente à gauche, une colonne de contenu dominante, et des panneaux contextuels qui peuvent disparaître. Les écrans utilisent des surfaces asymétriques et de grands blocs éditoriaux plutôt qu’une grille uniforme de cartes.

### Éléments signature

- Le mot-symbole UniverScience AI accompagné d’un glyphe « page + étincelle » construit avec deux traits violets.
- Des chips de source avec page PDF, utilisées comme preuves dans le studio et le tuteur.
- Des lignes de progression en forme de marge éditoriale, avec un point d’état vert ou violet.

### Interactions et animation

Les changements de vue utilisent un fondu court de 160 ms et une translation de 4 px. Les cartes réagissent par une légère élévation, jamais par un zoom. Les panneaux se replient avec une transition de largeur respectant `prefers-reduced-motion`. Les états de chargement utilisent des skeletons calmes; aucun effet de récompense ou de confettis.

### Typographie

Inter est utilisée via une pile système proche d’Inter pour rester robuste hors connexion. Les titres sont serrés et sobres; les labels utilisent une petite capitale visuelle et un interlettrage discret. La lecture de cours reste au minimum à 15–16 px avec une hauteur de ligne généreuse.

### Essence de marque

**UniverScience AI transforme un cours universitaire autorisé en un espace de compréhension guidée, pour réviser avec plus de clarté et moins de friction.** Personnalité : précis, calme, encourageant.

### Voix

Les titres sont directs et utiles; les CTA décrivent l’action réelle.

- « Reprendre là où vous vous êtes arrêté »
- « Voir la preuve dans le cours »

### Wordmark et couleur propriétaire

Le wordmark utilise `UniverScience AI` en graisse 760 avec un glyphe carré ouvert et une étincelle oblique, toujours en violet `#7757E8` sur fond clair. La couleur signature est `#7757E8`, suffisamment vive pour l’orientation mais assez sérieuse pour un contexte universitaire.

## Flux RAG

1. `/api/ingest` reçoit un PDF autorisé, valide le type et la taille, extrait le texte par page, nettoie et découpe en chunks.
2. Le service d’embeddings appelle le fournisseur configuré côté serveur; les vecteurs et métadonnées sont écrits dans `document_chunks`.
3. `/api/rag/ask` vérifie le contexte de cours, embedde la question, récupère les passages autorisés via cosine distance et assemble le contexte.
4. Le fournisseur génère une réponse en distinguant le contenu du cours de l’explication complémentaire.
5. Les citations retournées sont limitées aux pages présentes dans les passages récupérés; en contexte insuffisant, la réponse l’indique clairement.
6. Sans variables de fournisseur ou de base, l’interface présente un état de configuration manquante au lieu de simuler une réponse IA réelle.

## Déploiement

Le projet utilise pnpm `11.25.0` et écoute sur le port `3000`; `pnpm dev` sert l’aperçu, `pnpm run build` produit la version de production et `pnpm start` lance Next.js. L’hébergement utilise le `Dockerfile` existant, avec la capacité serveur activée et `/api/health` comme health check public non authentifié. Les valeurs privées restent dans l’environnement du projet; `.env.example` ne contient que des noms et des valeurs de remplacement. Supabase Auth, PostgreSQL/pgvector et le fournisseur IA sont des dépendances externes et restent à configurer avant le parcours étudiant réel.

## Parcours session et données réelles

- `/api/session` en GET ne crée pas de session; il rapporte uniquement une session Supabase validée ou une session démo signée déjà présente. Le POST de démo est explicite, vérifie `FIKRA_SESSION_SECRET` (32+ caractères), est protégé par `ALLOW_DEMO_SESSION` et interdit en production.
- L’espace étudiant redirige vers `/login` tant que la session n’a pas été confirmée. Les Route Handlers gardent leur propre contrôle d’identité et les filtres `document_access` restent la source des permissions de cours.
- Le générateur QCM attend un cours choisi dans les cours renvoyés par le backend; un cours sans passage indexé n’est pas offert. Le payload initial n’expose aucun choix correct ou explication; la correction n’est renvoyée qu’après l’enregistrement de la tentative. Si la base, la clé de session ou le fournisseur IA manque, l’interface expose l’erreur/configuration manquante.
- `/api/progress` n’agrège que les tentatives associées à l’utilisateur authentifié; le Dashboard, Mon apprentissage et Progression ne présentent pas d’anciens nombres d’exemple comme des scores réels.
