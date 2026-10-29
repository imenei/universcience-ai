# UniverScience AI — Learning Studio

UniverScience AI est une interface d’apprentissage universitaire destinée aux étudiants en pharmacie et médecine. Elle transforme des cours autorisés en un parcours de révision guidé : Dashboard, bibliothèque, Learning Studio, tuteur contextuel, QCM et progression.

## Démarrer

Le projet utilise Next.js, TypeScript, Tailwind CSS, Lucide React et pnpm 11.25.0.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

L’application écoute sur `http://localhost:3000`. Le build de production est vérifié avec :

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm start
```

## Routes principales

Les routes `/`, `/login`, `/demo`, `/library`, `/my-learning`, `/studio`, `/tutor`, `/quizzes`, `/progress`, `/saved` et `/settings` sont déclarées dans `public/manus-routes.json`. Le bouton sous Connexion crée une session démo serveur puis ouvre `/demo`.

Le Dashboard, la Bibliothèque, le tuteur, les QCM et la Progression communiquent avec les Route Handlers serveur. Le Dashboard charge les cours accessibles, tentatives, durées chronométrées et activité hebdomadaire; il n’invente pas de progression en l’absence de données. Le générateur charge `/api/courses` et demande un choix explicite parmi les cours autorisés possédant des documents indexés; `/api/quizzes/generate` récupère le contexte RAG de ce cours, génère et sauvegarde les questions; `/api/quizzes/:id/attempt` calcule et conserve le score. `/api/progress` agrège ensuite les tentatives de l’utilisateur, les résultats par cours, les erreurs par concept, l’activité sur huit semaines et l’historique. Les exemples de parcours ne sont jamais présentés comme des cours générables ou des scores réels.

## Activer le RAG réel

Le pipeline serveur est organisé dans `lib/rag/` : extraction PDF par page, nettoyage et chunking, embeddings, recherche vectorielle filtrée, génération grounded et validation des citations. Le schéma PostgreSQL/pgvector se trouve dans `db/schema.sql`.

1. Créer une base PostgreSQL avec l’extension `vector`.
2. Exécuter `db/schema.sql`.
3. Renseigner `RAG_DATABASE_URL`, `AI_BASE_URL`, `AI_API_KEY`, `AI_CHAT_MODEL` et `AI_EMBEDDING_MODEL` dans l’environnement serveur. `RAG_DATABASE_URL` est volontairement distinct de `DATABASE_URL`, qui est réservé par Webdev.
4. Pour activer la démo Preview ou déployer, définir `FIKRA_SESSION_SECRET` sur une valeur aléatoire stable d’au moins 32 caractères; sans cette clé, la route de démonstration retourne un message de configuration explicite.
5. Configurer Supabase Auth, créer ou inviter les comptes étudiants et renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY` via la carte sécurisée. La route `/login` utilise l’authentification email/mot de passe Supabase et les endpoints RAG vérifient ensuite l’utilisateur via `/auth/v1/user`.

Les secrets ne doivent jamais recevoir de préfixe `NEXT_PUBLIC_`, être écrits dans le code, exposés dans le navigateur ou committés. `.env.example` ne contient que des noms et valeurs de remplacement.

### Endpoints

- `POST /api/ingest` : reçoit un champ multipart `file` de type PDF et un `courseId`, vérifie la session serveur, extrait le document, crée les chunks, génère les embeddings et indexe les passages autorisés.
- `POST /api/rag/ask` : reçoit `question`, `courseId`, éventuellement `documentIds` et `history`, retrouve uniquement les passages accessibles à l’utilisateur et renvoie `answer`, `grounded` et les citations de page validées.
- `POST /api/quizzes/generate` : reçoit `courseId`, un sujet, une difficulté, une langue et un nombre de questions; génère un QCM grounded et crée `quiz_sets` / `quiz_questions`, sans renvoyer les réponses correctes avant l’envoi de la tentative.
- `POST /api/quizzes/:id/attempt` : reçoit les réponses de l’étudiant, calcule et enregistre le score côté serveur dans `quiz_attempts` / `quiz_answers`, puis retourne les corrections et explications.
- `GET /api/courses` : retourne uniquement les cours possédant des documents indexés auxquels l’utilisateur courant est autorisé.
- `GET /api/progress` : retourne exclusivement les statistiques, concepts à revoir, tentatives et activité des huit dernières semaines de l’utilisateur authentifié.
- `GET /api/session` : vérifie la session existante sans en créer une. `POST /api/session` démarre une session de démonstration signée après action explicite; le mode démo est réservé au MVP/Preview et désactivé en production.

Si la base ou le fournisseur IA n’est pas configuré, l’interface affiche un état explicite de configuration manquante. Elle ne fabrique pas de réponse ni de citation pour donner l’illusion d’un RAG actif.

## Architecture

`components/` contient le shell et les vues. `lib/data.ts` porte les données de démonstration. `lib/rag/` sépare configuration, ingestion, fournisseur IA, retrieval et orchestration. `app/api/` expose les Route Handlers serveur. `db/schema.sql` définit `documents`, `document_access`, `document_chunks`, `ingestion_jobs` et `chat_history`.

## Accès et production

La session de démonstration utilise un cookie HttpOnly signé, à durée limitée, avec `SameSite=None; Secure` lorsqu’elle est servie sur HTTPS; elle requiert `FIKRA_SESSION_SECRET` stable d’au moins 32 caractères et `ALLOW_DEMO_SESSION=true`. En production, Supabase Auth fournit aussi une session réelle vérifiée via cookies HttpOnly; les comptes doivent être confirmés dans Supabase avant connexion. Les règles `document_access` restent la source d’autorisation des cours. La base externe PostgreSQL/pgvector, l’IA et Supabase doivent être configurés dans l’environnement serveur pour effectuer un parcours réel de bout en bout.
