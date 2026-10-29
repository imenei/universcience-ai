# UniverScience AI — résultats de livraison

## 1. Shell applicatif et navigation

- [x] L’application présente une navigation desktop avec sidebar repliable, contexte du compte courant, Dashboard, Bibliothèque, Mon apprentissage, Tuteur IA, QCM & examens, Progression, Ressources enregistrées et Paramètres.
- [x] La top bar affiche le fil d’Ariane, la recherche globale, le sélecteur العربية / Français / English, les notifications et le profil de la session réelle.
- [x] Une action « Se déconnecter » dédiée et visible termine la session backend puis redirige vers la connexion.
- [x] La navigation s’adapte aux écrans mobiles avec une barre compacte et une drawer.

## 2. Dashboard étudiant

- [x] Le dashboard personnalise le titre à partir de la session vérifiée et ne présente pas une université, une spécialité ou une année fictive.
- [x] Il charge les cours accessibles et indexés, les tentatives enregistrées, l’activité hebdomadaire et les erreurs de concepts via le backend; les appels à l’action conduisent aux parcours de bibliothèque et de QCM.
- [x] Il expose des états de chargement, absence de cours et configuration backend manquante sans afficher de calendrier ou de résultats inventés.
- [x] Les recommandations sont formulées comme des orientations pédagogiques, sans prétendre mesurer une capacité ou une maîtrise.

## 3. Bibliothèque de cours

- [x] La bibliothèque reflète la hiérarchie université → spécialité → année → semestre → module → chapitre.
- [x] Elle propose recherche, filtres, progression, nombre de chapitres, ressources et statuts professeur-reviewed / AI-generated / pending-review.
- [x] Des états de recherche vide, chargement et absence de résultat sont représentés.

## 4. Course Learning Studio

- [x] Le studio réunit navigation de chapitre à gauche, contenu pédagogique central et tuteur IA contextuel à droite.
- [x] Le contenu central contient lecteur vidéo simulé, objectifs, visualisation scientifique, onglets Summary / Original document / Key concepts / Notes et actions d’étude.
- [x] Les citations affichent le document et la page d’origine lorsque disponibles; le contenu original et les explications complémentaires sont distingués.

## 5. Tuteur IA et quiz

- [x] Le tuteur affiche le contexte de cours, suggestions, conversation, références et signalement d’une réponse incorrecte.
- [x] Le quiz propose une question à la fois, options QCM, progression, signalement, validation et explication.
- [x] L’API `/api/quizzes/generate` récupère des passages RAG autorisés, demande un QCM structuré au fournisseur IA, valide la structure et sauvegarde `quiz_sets` / `quiz_questions`.
- [x] L’API `/api/quizzes/:id/attempt` calcule le score côté serveur et sauvegarde `quiz_attempts` / `quiz_answers`.
- [x] Les bonnes réponses et explications ne sont pas retournées par la génération; elles ne sont révélées qu’après la correction et l’enregistrement de la tentative.
- [x] Relier la page Progression aux tentatives réelles et afficher les erreurs par concept.
- [x] Les fonctionnalités d’IA réelles passent par des endpoints serveur; l’interface indique clairement si le fournisseur n’est pas configuré.

## 6. Progression et états produit

- [x] La progression affiche le nombre et la moyenne des tentatives, les résultats par cours, les concepts erronés, l’historique récent et l’activité/scores des huit dernières semaines à partir de données backend de la session.
- [x] Les états onboarding, upload PDF, traitement, ressource manquante, vérification, limites et erreur sont représentés dans l’interface.
- [x] Les statuts ne reposent pas uniquement sur la couleur et le temps passé n’est pas présenté comme une preuve de maîtrise.
- [x] « Mon apprentissage » charge ses cours indexés, ses scores et tentatives depuis `/api/courses` et `/api/progress`; les valeurs de démonstration codées en dur ont été supprimées.

## 7. Pipeline RAG serveur

- [x] `/api/ingest` valide les PDF, extrait les pages, découpe les paragraphes et prépare l’indexation avec embeddings configurables; la Bibliothèque déclenche réellement l’upload et affiche le statut.
- [x] `/api/rag/ask` filtre par cours/document autorisé, récupère des passages, appelle le LLM côté serveur et retourne des citations validées; l’identité est lue depuis une session signée côté serveur.
- [x] Les tables documents, chunks, jobs et historique de chat sont définies dans `db/schema.sql` avec pgvector.
- [x] Les clés sont uniquement côté serveur et `.env.example` ne contient aucune valeur secrète.
- [x] Configurer de façon sécurisée `RAG_DATABASE_URL`, les variables `AI_*` et les modèles fournisseur; vérifier l’accès PostgreSQL, l’extension pgvector, les tables `documents` / `document_chunks` / `quiz_sets` ainsi que la présence des modèles dans le catalogue IA.
- [ ] Tester de bout en bout avec un compte étudiant réel et des PDF autorisés, y compris l’indexation par embeddings et les réponses RAG citées.
- [ ] Fournir `FIKRA_SESSION_SECRET` stable d’au moins 32 caractères dans l’environnement serveur pour que le bouton de démonstration puisse signer ses sessions; sans la clé, l’API renvoie explicitement 503.
- [ ] Remplacer la session de démonstration Preview par une authentification institutionnelle vérifiée et appliquer les politiques d’accès de production lorsque les comptes étudiants seront disponibles.

## 8. Validation technique

- [x] Installer les dépendances, exécuter les diagnostics TypeScript et le build de production après les corrections finales; redémarrer le Preview après validation.
- [x] Utiliser des pages explicites, déclarer `/demo` dans Next.js et le manifeste, puis vérifier les routes et le manifeste en HTTP.
- [x] Enregistrer un checkpoint canonique et publier le code à la demande explicite de l’utilisateur; la publication automatique demeure désactivée. Les changements ultérieurs des secrets doivent être republiés explicitement.
- [x] Corriger `SUPABASE_URL` pour supprimer les espaces de bord avant de former les endpoints; TypeScript/build réussis, Supabase Settings HTTP 200, login fictif rejeté proprement en HTTP 401 (sans compte utilisateur réel).

## 9. Sélection de cours et parcours QCM relié au backend

- [x] Charger depuis l’API backend uniquement la liste des cours auxquels l’utilisateur a accès et qui contiennent des documents indexés; utiliser le cours choisi pour générer le QCM et afficher clairement son nom avant et pendant le quiz.
- [x] Demander à l’étudiant de choisir explicitement un cours avant de générer un QCM; ne pas remplacer une liste backend indisponible par des cours de démonstration qui sembleraient générables.
- [x] Générer ou récupérer les questions selon le cours choisi, ne jamais exposer les bonnes réponses avant soumission, envoyer les réponses au backend pour correction et afficher le score, les explications et les corrections après enregistrement côté serveur.
- [x] Présenter les états de chargement, de cours absent, de configuration manquante et d’erreur sans simuler une génération ou une réussite.

## 10. Session, protection de l’espace et démonstration

- [x] Ajouter sous le formulaire de connexion un bouton « Voir la démonstration » qui crée explicitement une session serveur puis ouvre `/demo`; si la clé requise manque, afficher l’erreur de configuration renvoyée par l’API.
- [x] Créer/valider côté serveur une session de démonstration signée, propre à chaque visite et expirant après huit heures, limitée à l’environnement non-production; une consultation anonyme de l’état de session ne crée pas de session et la démo est désactivée en production.
- [x] Vérifier la session avant d’afficher les routes privées, continuer de vérifier l’identité et les autorisations sur les API, et rediriger vers la connexion si la session est absente ou expirée.
- [x] Afficher une action de déconnexion dédiée et visible; elle efface les cookies d’application/Supabase puis ramène l’utilisateur vers la connexion.

## 11. Connexion des vues aux données backend

- [x] Relier les écrans/actions produits aux routes backend existantes ou ajoutées, notamment les cours autorisés, les documents, le tuteur, les quiz, les tentatives et la progression.
- [x] Afficher les données appartenant à la session de l’utilisateur; les écrans du dashboard, de résultats, des concepts à revoir et de l’historique n’utilisent pas des valeurs de démonstration lorsque l’API de données réelles est indisponible.

## 12. Vérification de la version jointe et hébergement

- [x] L’archive a été inspectée; elle contient `.env.example` mais pas de fichier `.env` avec des identifiants.
- [x] Les dépendances verrouillées ont été installées; `pnpm exec tsc --noEmit` et `pnpm run build` ont réussi sur la version jointe.
- [x] Importer la version dans le projet WebDev sans remplacer son interface, puis démarrer l’aperçu et vérifier `/manus-routes.json` ainsi que `/api/health`; `/`, `/login`, le manifeste et le health check ont tous répondu HTTP 200.
- [x] Déclarer le conteneur serveur avec `Dockerfile` et `/api/health` comme health check; le code de l’application est publié avec succès.
- [ ] Le script `pnpm lint` doit être configuré sans assistant interactif; sa commande actuelle a ouvert un assistant ESLint et s’est arrêtée, sans modifier les fichiers.
- [x] Configurer par formulaire sécurisé les valeurs Supabase Auth, PostgreSQL/pgvector et fournisseur IA; Supabase Auth répond HTTP 200, les modèles IA configurés sont présents, et PostgreSQL accepte la connexion avec pgvector et les tables RAG attendues.
- [ ] Vérifier un vrai login étudiant puis un parcours RAG/QCM de bout en bout avec un cours et des documents autorisés; aucune donnée utilisateur ni PDF autorisé n’a été fourni pour ce test.
