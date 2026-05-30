# MathiFun - Instructions et référence

## Objectif

Créer une application Vue statique pour aider les enfants de primaire à apprendre les mathématiques en jouant. L'interface est en français, colorée, simple à utiliser, et fonctionne sans serveur local.

## Fichiers

- `index.html` : page principale, chargement de Vue depuis CDN, liaison vers CSS et JavaScript.
- `style.css` : styles de l'interface enfantine, responsive et colorée.
- `app.js` : logique Vue, IndexedDB, utilisateurs, jeux, scores et réglages.
- `INSTRUCTIONS.md` : ce document de référence.

## Lancement

Ouvrir directement `index.html` dans un navigateur moderne. Aucun serveur n'est nécessaire.

Vue est chargé depuis `https://unpkg.com/vue@3/dist/vue.global.prod.js`. Une connexion internet est donc nécessaire si le navigateur n'a pas déjà Vue en cache.

## Fonctionnalités

- Création, sélection et suppression de joueurs sans mot de passe.
- Confirmation avant suppression d'un joueur.
- Scores et historiques séparés pour chaque joueur.
- Sauvegarde locale en IndexedDB, pas dans les cookies.
- Opérations disponibles :
  - Addition
  - Soustraction sans résultat négatif
  - Multiplication
  - Division avec réponses entières
- Réglage du minimum et du maximum avec deux champs numériques.
- Mémorisation du dernier réglage par joueur et par opération.
- Selon le mode de jeu choisi, certains réglages restent visibles mais deviennent grisés et inactifs s'ils ne sont pas utilisés.
- La multiplication démarre par défaut sur la base classique `1` à `10`.
- Pour la multiplication, le minimum et le maximum définissent les tables à réviser à gauche. Le multiplicateur à droite va de `1` à `10`, ou jusqu'au maximum sélectionné si celui-ci dépasse `10`.
- La division démarre par défaut sur la base classique `1` à `10`.
- Pour la division, le minimum et le maximum définissent aussi la table à gauche. Le quotient à droite va de `1` à `10`, ou jusqu'au maximum sélectionné si celui-ci dépasse `10`.

## Modes de jeu

- Course contre la montre : répondre au maximum de questions avant la fin du temps.
- Défi 10 questions : série courte avec score final.
- Série parfaite : la partie s'arrête à la première erreur.
- Boss des tables : difficulté progressive, surtout utile pour multiplication et division.
- Entraînement calme : sans chronomètre, pour pratiquer sans pression.

## Données stockées

La base IndexedDB s'appelle `mathifun-db`.

Magasins :

- `users` : `{ id, name, createdAt, lastSettings }`
- `results` : `{ id, userId, operation, mode, score, correct, total, duration, rangeMin, rangeMax, createdAt }`
- `mistakes` : opérations à revoir par joueur, avec l'opération, la réponse attendue, le nombre d'erreurs et la priorité.
- `appState` : état global léger, dont le joueur sélectionné et la version de schéma.

## Règles pédagogiques

- La soustraction génère toujours une opération dont le résultat est positif ou nul.
- La division est construite depuis une multiplication afin d'obtenir une réponse entière.
- Les scores récompensent les bonnes réponses, la vitesse et les séries de bonnes réponses.
- Les tableaux de scores ne mélangent jamais les joueurs.
- Une opération ratée est mémorisée pour le joueur et l'opération en cours, puis proposée plus souvent jusqu'à ce que l'enfant réponde correctement.
- Les opérations à revoir ne sont reproposées que si elles font partie de la plage actuellement sélectionnée. Pour la multiplication et la division, cela respecte la logique des tables : par exemple `5` à `8` autorise `5 x 1` jusqu'à `8 x 10`, puis les divisions correspondantes.

## Tests manuels recommandés

1. Ouvrir `index.html` directement dans le navigateur.
2. Créer deux joueurs.
3. Jouer une partie avec chaque joueur et vérifier que les scores restent séparés.
4. Tester addition, soustraction, multiplication et division.
5. Tester chaque mode de jeu.
6. Fermer puis rouvrir le navigateur et vérifier que les joueurs et scores sont encore présents.
7. Supprimer les cookies uniquement et vérifier que les données IndexedDB restent présentes.
8. Changer les champs numériques min/max, revenir plus tard, et vérifier que les réglages sont pré-remplis pour chaque opération.

## Extensions possibles

- Ajouter des niveaux par classe scolaire.
- Ajouter des badges persistants.
- Ajouter une exportation/importation JSON des profils.
- Ajouter un mode dédié uniquement aux opérations à revoir.
- Ajouter une option pour autoriser les soustractions négatives pour les élèves plus avancés.
