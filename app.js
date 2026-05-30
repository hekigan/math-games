(function () {
  const { createApp, nextTick } = Vue;

  const DB_NAME = "mathifun-db";
  const DB_VERSION = 2;
  const USER_STORE = "users";
  const RESULT_STORE = "results";
  const STATE_STORE = "appState";
  const MISTAKE_STORE = "mistakes";

  const operationDefs = [
    { id: "addition", icon: "+" },
    { id: "subtraction", icon: "-" },
    { id: "multiplication", icon: "x" },
    { id: "division", icon: "÷" }
  ];

  const modeDefs = [
    {
      id: "timed",
      icon: "⏱",
      timed: true,
      endless: true,
      usesTimeLimit: true,
      usesQuestionCount: false
    },
    {
      id: "ten",
      icon: "🎯",
      timed: false,
      fixedTotal: 10,
      usesTimeLimit: false,
      usesQuestionCount: false
    },
    {
      id: "perfect",
      icon: "💎",
      timed: false,
      endless: true,
      stopOnMistake: true,
      usesTimeLimit: false,
      usesQuestionCount: false
    },
    {
      id: "boss",
      icon: "👑",
      timed: true,
      fixedTotal: 15,
      boss: true,
      usesTimeLimit: true,
      usesQuestionCount: false
    },
    {
      id: "calm",
      icon: "🌈",
      timed: false,
      usesTimeLimit: false,
      usesQuestionCount: true
    }
  ];

  const languages = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" }
  ];

  const translations = {
    fr: {
      locale: "fr-FR",
      loading: "Chargement de tes aventures...",
      languageLabel: "Langue",
      brandEyebrow: "Apprendre en jouant",
      createPlayer: "Créer un joueur",
      playerPlaceholder: "Prénom du joueur",
      addPlayer: "Ajouter",
      chooseProfile: "Choisis ton profil",
      gamesPlayed: (count) => `${count} partie${count > 1 ? "s" : ""}`,
      delete: "Supprimer",
      welcome: "Bienvenue !",
      createFirstPlayer: "Crée un premier joueur pour garder les scores séparés.",
      deletePlayerTitle: (name) => `Supprimer ${name} ?`,
      deletePlayerText: "Ses scores et son historique seront supprimés. Cette action ne touche pas les autres joueurs.",
      cancel: "Annuler",
      confirmDelete: "Oui, supprimer",
      activeProfile: "Profil actif",
      greeting: (name) => `Bonjour ${name} !`,
      changePlayer: "Changer de joueur",
      dailyMission: "Mission du jour",
      heroTitle: "Gagne des étoiles avec tes calculs",
      heroText: "Choisis une opération, règle la difficulté, puis bats ton meilleur score.",
      starsEarned: "étoiles gagnées",
      chooseOperation: "Choisir une opération",
      gameMode: "Mode de jeu",
      settings: "Réglages",
      minimum: "Minimum",
      maximum: "Maximum",
      time: "Temps",
      questions: "Questions",
      seconds: (count) => `${count} secondes`,
      questionCount: (count) => `${count} questions`,
      start: "Commencer",
      scoreboard: "Tableau des scores",
      pointsShort: "pts",
      noScore: "Aucun score pour ce joueur pour le moment.",
      recentGames: "Dernières parties",
      playToFillHistory: "Joue une partie pour remplir l'historique.",
      review: "À revoir",
      errors: (count) => `${count} erreur${count > 1 ? "s" : ""}`,
      noReview: (operation) => `Aucune opération à revoir pour ${operation.toLowerCase()}.`,
      quit: "Quitter",
      score: "Score",
      streak: "Série",
      calm: "Calme",
      reviewQuestion: "Question à revoir",
      answerAria: "Réponse",
      validate: "Valider",
      correctProgress: (correct, total) => `${correct} bonne(s) réponse(s) sur ${total}`,
      resultOf: (name) => `Résultat de ${name}`,
      points: "points",
      correctAnswers: "réponses justes",
      successRate: "réussite",
      playAgain: "Rejouer",
      backToMenu: "Retour au menu",
      openDbError: "Impossible d'ouvrir la base locale du navigateur.",
      emptyName: "Écris un prénom avant d'ajouter un joueur.",
      duplicateName: "Ce prénom existe déjà.",
      playerReady: (name) => `${name} peut commencer à jouer.`,
      playerDeleted: (name) => `${name} a été supprimé.`,
      rangeMultiplication: (min, max, multiplierMax) => `Tables de ${min} x 1 à ${max} x ${multiplierMax}.`,
      rangeDivision: (min, max, multiplierMax) => `Divisions de ${min} x 1 à ${max} x ${multiplierMax}.`,
      rangeValues: (min, max) => `Valeurs entre ${min} et ${max}.`,
      resultGreat: "Fantastique !",
      resultGood: "Très bien joué !",
      resultKeepGoing: "Continue, tu progresses !",
      newBestScore: "Nouveau meilleur score pour ce mode !",
      currentBestScore: (score) => `Meilleur score actuel : ${score} points.`,
      firstScore: "Premier score enregistré pour ce mode.",
      startFeedback: "À toi de jouer !",
      invalidAnswer: "Écris un nombre pour répondre.",
      wrongAnswer: (answer) => `Presque ! La réponse était ${answer}.`,
      goodFeedback: ["Bravo !", "Super calcul !", "Excellent !", "Tu files !", "Belle série !"],
      operations: {
        addition: { label: "Addition", help: "Additionner deux nombres" },
        subtraction: { label: "Soustraction", help: "Retirer sans résultat négatif" },
        multiplication: { label: "Multiplication", help: "Réviser les tables" },
        division: { label: "Division", help: "Divisions avec réponse entière" }
      },
      modes: {
        timed: { label: "Course contre la montre", description: "Le plus de réponses avant la fin du temps." },
        ten: { label: "Défi 10 questions", description: "Dix questions pour viser le meilleur score." },
        perfect: { label: "Série parfaite", description: "Continue jusqu'à la première erreur." },
        boss: { label: "Boss des tables", description: "La difficulté monte après chaque bonne réponse." },
        calm: { label: "Entraînement calme", description: "Pas de chrono, juste progresser tranquillement." }
      }
    },
    en: {
      locale: "en-US",
      loading: "Loading your adventures...",
      languageLabel: "Language",
      brandEyebrow: "Learn by playing",
      createPlayer: "Create a player",
      playerPlaceholder: "Player name",
      addPlayer: "Add",
      chooseProfile: "Choose your profile",
      gamesPlayed: (count) => `${count} game${count === 1 ? "" : "s"}`,
      delete: "Delete",
      welcome: "Welcome!",
      createFirstPlayer: "Create a first player to keep scores separate.",
      deletePlayerTitle: (name) => `Delete ${name}?`,
      deletePlayerText: "Their scores and history will be deleted. This action does not affect other players.",
      cancel: "Cancel",
      confirmDelete: "Yes, delete",
      activeProfile: "Active profile",
      greeting: (name) => `Hello ${name}!`,
      changePlayer: "Change player",
      dailyMission: "Today's mission",
      heroTitle: "Win stars with your calculations",
      heroText: "Choose an operation, set the difficulty, then beat your best score.",
      starsEarned: "stars earned",
      chooseOperation: "Choose an operation",
      gameMode: "Game mode",
      settings: "Settings",
      minimum: "Minimum",
      maximum: "Maximum",
      time: "Time",
      questions: "Questions",
      seconds: (count) => `${count} seconds`,
      questionCount: (count) => `${count} questions`,
      start: "Start",
      scoreboard: "Scoreboard",
      pointsShort: "pts",
      noScore: "No score for this player yet.",
      recentGames: "Recent games",
      playToFillHistory: "Play a game to fill the history.",
      review: "To review",
      errors: (count) => `${count} error${count === 1 ? "" : "s"}`,
      noReview: (operation) => `No operation to review for ${operation.toLowerCase()}.`,
      quit: "Quit",
      score: "Score",
      streak: "Streak",
      calm: "Calm",
      reviewQuestion: "Question to review",
      answerAria: "Answer",
      validate: "Check",
      correctProgress: (correct, total) => `${correct} correct answer(s) out of ${total}`,
      resultOf: (name) => `${name}'s result`,
      points: "points",
      correctAnswers: "correct answers",
      successRate: "success",
      playAgain: "Play again",
      backToMenu: "Back to menu",
      openDbError: "Unable to open the browser's local database.",
      emptyName: "Enter a first name before adding a player.",
      duplicateName: "This first name already exists.",
      playerReady: (name) => `${name} can start playing.`,
      playerDeleted: (name) => `${name} was deleted.`,
      rangeMultiplication: (min, max, multiplierMax) => `Tables from ${min} x 1 to ${max} x ${multiplierMax}.`,
      rangeDivision: (min, max, multiplierMax) => `Divisions from ${min} x 1 to ${max} x ${multiplierMax}.`,
      rangeValues: (min, max) => `Values between ${min} and ${max}.`,
      resultGreat: "Fantastic!",
      resultGood: "Very well played!",
      resultKeepGoing: "Keep going, you're improving!",
      newBestScore: "New best score for this mode!",
      currentBestScore: (score) => `Current best score: ${score} points.`,
      firstScore: "First score saved for this mode.",
      startFeedback: "Your turn!",
      invalidAnswer: "Enter a number to answer.",
      wrongAnswer: (answer) => `Almost! The answer was ${answer}.`,
      goodFeedback: ["Great!", "Nice math!", "Excellent!", "You're flying!", "Nice streak!"],
      operations: {
        addition: { label: "Addition", help: "Add two numbers" },
        subtraction: { label: "Subtraction", help: "Subtract without a negative result" },
        multiplication: { label: "Multiplication", help: "Practice times tables" },
        division: { label: "Division", help: "Divisions with whole-number answers" }
      },
      modes: {
        timed: { label: "Race against the clock", description: "Answer as many as possible before time runs out." },
        ten: { label: "10-question challenge", description: "Ten questions to aim for your best score." },
        perfect: { label: "Perfect streak", description: "Keep going until the first mistake." },
        boss: { label: "Times tables boss", description: "The difficulty rises after each correct answer." },
        calm: { label: "Calm practice", description: "No timer, just steady progress." }
      }
    }
  };

  const defaultSettings = {
    addition: { rangeMin: 0, rangeMax: 10, timeLimit: 60, questionCount: 10, mode: "timed" },
    subtraction: { rangeMin: 0, rangeMax: 10, timeLimit: 60, questionCount: 10, mode: "timed" },
    multiplication: { rangeMin: 1, rangeMax: 10, timeLimit: 60, questionCount: 10, mode: "ten" },
    division: { rangeMin: 1, rangeMax: 10, timeLimit: 60, questionCount: 10, mode: "ten" }
  };

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(USER_STORE)) {
          db.createObjectStore(USER_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(RESULT_STORE)) {
          const results = db.createObjectStore(RESULT_STORE, { keyPath: "id" });
          results.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(MISTAKE_STORE)) {
          const mistakes = db.createObjectStore(MISTAKE_STORE, { keyPath: "id" });
          mistakes.createIndex("userId", "userId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function txStore(db, storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function getAll(db, storeName) {
    return new Promise((resolve, reject) => {
      const request = txStore(db, storeName, "readonly").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function putItem(db, storeName, item) {
    return new Promise((resolve, reject) => {
      const plainItem = JSON.parse(JSON.stringify(item));
      const request = txStore(db, storeName, "readwrite").put(plainItem);
      request.onsuccess = () => resolve(plainItem);
      request.onerror = () => reject(request.error);
    });
  }

  function deleteItem(db, storeName, id) {
    return new Promise((resolve, reject) => {
      const request = txStore(db, storeName, "readwrite").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function deleteResultsForUser(db, userId) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RESULT_STORE, "readwrite");
      const store = tx.objectStore(RESULT_STORE);
      const index = store.index("userId");
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function deleteMistakesForUser(db, userId) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MISTAKE_STORE, "readwrite");
      const store = tx.objectStore(MISTAKE_STORE);
      const index = store.index("userId");
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function getState(db, key) {
    return new Promise((resolve, reject) => {
      const request = txStore(db, STATE_STORE, "readonly").get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  function setState(db, key, value) {
    return putItem(db, STATE_STORE, { key, value });
  }

  function uid(prefix) {
    if (crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(defaultSettings));
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function detectLanguage() {
    const browserLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return browserLanguage.toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  document.documentElement.lang = detectLanguage();

  createApp({
    data() {
      return {
        loading: true,
        db: null,
        users: [],
        results: [],
        mistakes: [],
        selectedUserId: null,
        view: "login",
        newUserName: "",
        userMessage: "",
        deleteTarget: null,
        language: detectLanguage(),
        languages,
        setup: {
          operation: "addition",
          mode: "timed",
          rangeMin: 0,
          rangeMax: 10,
          timeLimit: 60,
          questionCount: 10
        },
        game: null,
        currentQuestion: { text: "", answer: 0 },
        answerText: "",
        timerId: null,
        lastResult: null,
        previousBestScore: 0
      };
    },

    computed: {
      currentUser() {
        return this.users.find((user) => user.id === this.selectedUserId) || null;
      },

      copy() {
        return translations[this.language] || translations.en;
      },

      operations() {
        return operationDefs.map((operation) => ({
          ...operation,
          ...this.copy.operations[operation.id]
        }));
      },

      modes() {
        return modeDefs.map((mode) => ({
          ...mode,
          ...this.copy.modes[mode.id]
        }));
      },

      activeMode() {
        return this.modes.find((mode) => mode.id === this.setup.mode) || this.modes[0];
      },

      timeSettingDisabled() {
        return !this.activeMode.usesTimeLimit;
      },

      questionSettingDisabled() {
        return !this.activeMode.usesQuestionCount;
      },

      rangeLowerBound() {
        return ["multiplication", "division"].includes(this.setup.operation) ? 1 : 0;
      },

      currentUserResults() {
        return this.results
          .filter((result) => result.userId === this.selectedUserId)
          .sort((a, b) => b.createdAt - a.createdAt);
      },

      recentResults() {
        return this.currentUserResults.slice(0, 6);
      },

      currentMistakes() {
        return this.mistakes
          .filter((mistake) => mistake.userId === this.selectedUserId)
          .sort((a, b) => b.priority - a.priority || b.lastWrongAt - a.lastWrongAt);
      },

      operationMistakes() {
        return this.currentMistakes
          .filter((mistake) => mistake.operation === this.setup.operation)
          .filter((mistake) => this.mistakeFitsSelectedRange(mistake))
          .slice(0, 6);
      },

      rangeHelpText() {
        const multiplierMax = Math.max(10, this.setup.rangeMax);
        if (this.setup.operation === "multiplication") {
          return this.copy.rangeMultiplication(this.setup.rangeMin, this.setup.rangeMax, multiplierMax);
        }
        if (this.setup.operation === "division") {
          return this.copy.rangeDivision(this.setup.rangeMin, this.setup.rangeMax, multiplierMax);
        }
        return this.copy.rangeValues(this.setup.rangeMin, this.setup.rangeMax);
      },

      bestScores() {
        const best = new Map();
        this.currentUserResults.forEach((result) => {
          const key = `${result.operation}-${result.mode}`;
          if (!best.has(key) || result.score > best.get(key).score) {
            best.set(key, {
              key,
              label: `${this.operationLabel(result.operation)} - ${this.modeLabel(result.mode)}`,
              score: result.score
            });
          }
        });
        return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, 8);
      },

      totalStars() {
        return this.currentUserResults.reduce((sum, result) => sum + Math.max(1, Math.floor(result.score / 100)), 0);
      },

      progressPercent() {
        if (!this.game) return 0;
        if (this.activeMode.timed && this.game.initialTime > 0) {
          return clamp(((this.game.initialTime - this.game.timeLeft) / this.game.initialTime) * 100, 0, 100);
        }
        const target = this.game.targetTotal || this.setup.questionCount;
        return clamp((this.game.total / target) * 100, 0, 100);
      },

      resultAccuracy() {
        if (!this.lastResult || !this.lastResult.total) return 0;
        return Math.round((this.lastResult.correct / this.lastResult.total) * 100);
      },

      medal() {
        if (this.resultAccuracy >= 90) return "🏆";
        if (this.resultAccuracy >= 70) return "⭐";
        return "🌟";
      },

      resultTitle() {
        if (this.resultAccuracy >= 90) return this.copy.resultGreat;
        if (this.resultAccuracy >= 70) return this.copy.resultGood;
        return this.copy.resultKeepGoing;
      },

      bestScoreMessage() {
        if (!this.lastResult) return "";
        if (this.lastResult.score > this.previousBestScore) return this.copy.newBestScore;
        if (this.previousBestScore > 0) return this.copy.currentBestScore(this.previousBestScore);
        return this.copy.firstScore;
      }
    },

    watch: {
      language(newLanguage) {
        document.documentElement.lang = newLanguage;
      }
    },

    async mounted() {
      try {
        this.db = await openDatabase();
        await setState(this.db, "schemaVersion", DB_VERSION);
        const savedLanguage = await getState(this.db, "language");
        if (savedLanguage === "fr" || savedLanguage === "en") {
          this.language = savedLanguage;
        }
        document.documentElement.lang = this.language;
        this.users = await getAll(this.db, USER_STORE);
        this.results = await getAll(this.db, RESULT_STORE);
        this.mistakes = await getAll(this.db, MISTAKE_STORE);
        this.selectedUserId = await getState(this.db, "selectedUserId");
        if (!this.users.some((user) => user.id === this.selectedUserId)) {
          this.selectedUserId = null;
        }
        if (this.selectedUserId) {
          this.loadUserSettings();
          this.view = "home";
        }
      } catch (error) {
        console.error(error);
        this.userMessage = this.copy.openDbError;
      } finally {
        this.loading = false;
      }
    },

    beforeUnmount() {
      this.stopTimer();
    },

    methods: {
      async saveLanguage() {
        document.documentElement.lang = this.language;
        this.userMessage = "";
        if (this.db) {
          await setState(this.db, "language", this.language);
        }
      },

      initials(name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("");
      },

      userResultCount(userId) {
        return this.results.filter((result) => result.userId === userId).length;
      },

      operationLabel(id) {
        return (this.operations.find((operation) => operation.id === id) || {}).label || id;
      },

      modeLabel(id) {
        return (this.modes.find((mode) => mode.id === id) || {}).label || id;
      },

      formatDate(value) {
        return new Intl.DateTimeFormat(this.copy.locale, {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date(value));
      },

      async createUser() {
        const name = this.newUserName.trim();
        if (!name) {
          this.userMessage = this.copy.emptyName;
          return;
        }
        if (this.users.some((user) => user.name.toLowerCase() === name.toLowerCase())) {
          this.userMessage = this.copy.duplicateName;
          return;
        }

        const user = {
          id: uid("user"),
          name,
          createdAt: Date.now(),
          lastSettings: cloneDefaults()
        };

        await putItem(this.db, USER_STORE, user);
        this.users.push(user);
        this.newUserName = "";
        this.userMessage = this.copy.playerReady(name);
        await this.selectUser(user.id);
      },

      async selectUser(userId) {
        this.selectedUserId = userId;
        await setState(this.db, "selectedUserId", userId);
        this.loadUserSettings();
        this.view = "home";
      },

      askDeleteUser(user) {
        this.deleteTarget = user;
      },

      cancelDelete() {
        this.deleteTarget = null;
      },

      async confirmDeleteUser() {
        if (!this.deleteTarget) return;
        const userId = this.deleteTarget.id;
        await deleteResultsForUser(this.db, userId);
        await deleteMistakesForUser(this.db, userId);
        await deleteItem(this.db, USER_STORE, userId);
        this.users = this.users.filter((user) => user.id !== userId);
        this.results = this.results.filter((result) => result.userId !== userId);
        this.mistakes = this.mistakes.filter((mistake) => mistake.userId !== userId);
        if (this.selectedUserId === userId) {
          this.selectedUserId = null;
          await setState(this.db, "selectedUserId", null);
          this.view = "login";
        }
        this.userMessage = this.copy.playerDeleted(this.deleteTarget.name);
        this.deleteTarget = null;
      },

      goLogin() {
        this.stopTimer();
        this.view = "login";
      },

      goHome() {
        this.stopTimer();
        this.view = "home";
      },

      setOperation(operationId) {
        this.saveCurrentSettings();
        this.setup.operation = operationId;
        this.loadOperationSettings(operationId);
      },

      setMode(modeId) {
        this.setup.mode = modeId;
        if (modeId === "ten") this.setup.questionCount = 10;
        if (modeId === "boss") this.setup.questionCount = 15;
        this.saveCurrentSettings();
      },

      loadUserSettings() {
        if (!this.currentUser) return;
        if (!this.currentUser.lastSettings) {
          this.currentUser.lastSettings = cloneDefaults();
        }
        this.loadOperationSettings(this.setup.operation);
      },

      loadOperationSettings(operationId) {
        const settings = this.currentUser.lastSettings[operationId] || defaultSettings[operationId];
        this.setup = {
          operation: operationId,
          mode: settings.mode || "timed",
          rangeMin: settings.rangeMin,
          rangeMax: settings.rangeMax,
          timeLimit: settings.timeLimit || 60,
          questionCount: settings.questionCount || 10
        };
        this.normalizeRange();
      },

      normalizeRange() {
        const lowerBound = this.rangeLowerBound;
        this.setup.rangeMin = Math.max(Number(this.setup.rangeMin), lowerBound);
        this.setup.rangeMax = Math.max(Number(this.setup.rangeMax), lowerBound);
        if (this.setup.rangeMin > this.setup.rangeMax) {
          const changedMin = document.activeElement && document.activeElement.id === "range-min";
          if (changedMin) this.setup.rangeMax = this.setup.rangeMin;
          else this.setup.rangeMin = this.setup.rangeMax;
        }
        this.saveCurrentSettings();
      },

      async saveCurrentSettings() {
        if (!this.currentUser) return;
        const user = this.currentUser;
        user.lastSettings = user.lastSettings || cloneDefaults();
        user.lastSettings[this.setup.operation] = {
          rangeMin: this.setup.rangeMin,
          rangeMax: this.setup.rangeMax,
          timeLimit: this.setup.timeLimit,
          questionCount: this.setup.questionCount,
          mode: this.setup.mode
        };
        await putItem(this.db, USER_STORE, user);
      },

      startGame() {
        this.stopTimer();
        this.normalizeRange();
        this.saveCurrentSettings();
        const mode = this.activeMode;
        const targetTotal = mode.fixedTotal || (mode.endless ? null : this.setup.questionCount);
        this.previousBestScore = this.getBestScoreForCurrentSetup();
        this.game = {
          score: 0,
          correct: 0,
          total: 0,
          streak: 0,
          startedAt: Date.now(),
          timeLeft: mode.timed ? this.setup.timeLimit : 0,
          initialTime: mode.timed ? this.setup.timeLimit : 0,
          targetTotal,
          feedback: this.copy.startFeedback,
          feedbackType: ""
        };
        this.view = "game";
        this.nextQuestion();
        if (mode.timed) this.startTimer();
        nextTick(() => this.focusAnswer());
      },

      startTimer() {
        this.timerId = window.setInterval(() => {
          if (!this.game) return;
          this.game.timeLeft -= 1;
          if (this.game.timeLeft <= 0) {
            this.finishGame(true);
          }
        }, 1000);
      },

      stopTimer() {
        if (this.timerId) {
          window.clearInterval(this.timerId);
          this.timerId = null;
        }
      },

      focusAnswer() {
        if (this.$refs.answerInput) {
          this.$refs.answerInput.focus();
        }
      },

      nextQuestion() {
        this.answerText = "";
        this.currentQuestion = this.generateQuestion();
        nextTick(() => this.focusAnswer());
      },

      generateQuestion() {
        const remembered = this.pickRememberedMistake();
        if (remembered) return remembered;

        const min = this.setup.rangeMin;
        const max = this.setup.rangeMax;
        const bossBonus = this.activeMode.boss ? Math.floor((this.game ? this.game.correct : 0) / 3) : 0;
        const bossMax = Math.max(max + bossBonus, min);
        let a = rand(min, bossMax);
        let b = rand(min, bossMax);

        if (this.setup.operation === "addition") {
          return this.makeQuestion(`${a} + ${b}`, a + b, [a, b]);
        }

        if (this.setup.operation === "subtraction") {
          const bigger = Math.max(a, b);
          const smaller = Math.min(a, b);
          return this.makeQuestion(`${bigger} - ${smaller}`, bigger - smaller, [bigger, smaller]);
        }

        if (this.setup.operation === "multiplication") {
          const table = rand(min, max);
          const multiplier = rand(1, Math.max(10, max));
          return this.makeQuestion(`${table} x ${multiplier}`, table * multiplier, [table, multiplier]);
        }

        const divisor = rand(min, max);
        const quotient = rand(1, Math.max(10, max));
        const product = divisor * quotient;
        return this.makeQuestion(`${product} ÷ ${divisor}`, quotient, [divisor, quotient]);
      },

      makeQuestion(text, answer, rangeTerms) {
        return {
          text,
          answer,
          factKey: `${this.setup.operation}:${text}`,
          rangeTerms
        };
      },

      pickRememberedMistake() {
        if (!this.operationMistakes.length || Math.random() > 0.45) return null;
        const weighted = [];
        this.operationMistakes.forEach((mistake) => {
          const weight = Math.max(1, Math.min(5, mistake.priority || 1));
          for (let index = 0; index < weight; index += 1) {
            weighted.push(mistake);
          }
        });
        const mistake = weighted[rand(0, weighted.length - 1)];
        return {
          text: mistake.text,
          answer: mistake.answer,
          factKey: mistake.factKey,
          rangeTerms: this.getMistakeRangeTerms(mistake),
          remembered: true
        };
      },

      mistakeFitsSelectedRange(mistake) {
        const terms = this.getMistakeRangeTerms(mistake);
        if (!terms.length) return false;
        if (["multiplication", "division"].includes(mistake.operation)) {
          const table = terms[0];
          const multiplier = terms[1];
          const multiplierMax = Math.max(10, this.setup.rangeMax);
          return table >= this.setup.rangeMin
            && table <= this.setup.rangeMax
            && multiplier >= 1
            && multiplier <= multiplierMax;
        }
        return terms.every((value) => value >= this.setup.rangeMin && value <= this.setup.rangeMax);
      },

      getMistakeRangeTerms(mistake) {
        if (Array.isArray(mistake.rangeTerms) && mistake.rangeTerms.length) {
          return mistake.rangeTerms.map(Number).filter((value) => Number.isFinite(value));
        }

        const numbers = String(mistake.text || "")
          .match(/-?\d+/g)
          ?.map(Number)
          .filter((value) => Number.isFinite(value)) || [];

        if (mistake.operation === "division") {
          const divisor = numbers.length ? numbers[numbers.length - 1] : null;
          const quotient = Number(mistake.answer);
          return [divisor, quotient].filter((value) => Number.isFinite(value));
        }

        return numbers;
      },

      async submitAnswer() {
        if (!this.game) return;
        const cleaned = this.answerText.trim().replace(",", ".");
        if (cleaned === "" || Number.isNaN(Number(cleaned))) {
          this.game.feedback = this.copy.invalidAnswer;
          this.game.feedbackType = "bad";
          return;
        }

        const answer = Number(cleaned);
        const isCorrect = answer === this.currentQuestion.answer;
        this.game.total += 1;

        if (isCorrect) {
          await this.recordFactResult(true);
          if (!this.game) return;
          this.game.correct += 1;
          this.game.streak += 1;
          const streakBonus = Math.min(this.game.streak * 3, 30);
          const speedBonus = this.activeMode.timed ? Math.max(0, this.game.timeLeft) : 5;
          this.game.score += 10 + streakBonus + speedBonus;
          this.game.feedback = this.randomGoodFeedback();
          this.game.feedbackType = "good";
        } else {
          await this.recordFactResult(false);
          if (!this.game) return;
          this.game.streak = 0;
          this.game.feedback = this.copy.wrongAnswer(this.currentQuestion.answer);
          this.game.feedbackType = "bad";
          if (this.activeMode.stopOnMistake) {
            window.setTimeout(() => this.finishGame(true), 650);
            return;
          }
        }

        const target = this.game.targetTotal || this.setup.questionCount;
        if (!this.activeMode.endless && this.game.total >= target) {
          this.finishGame(true);
          return;
        }
        if (this.activeMode.fixedTotal && this.game.total >= this.activeMode.fixedTotal) {
          this.finishGame(true);
          return;
        }

        window.setTimeout(() => this.nextQuestion(), 350);
      },

      async recordFactResult(isCorrect) {
        if (!this.currentQuestion || !this.currentQuestion.factKey || !this.selectedUserId) return;
        const id = `${this.selectedUserId}::${this.currentQuestion.factKey}`;
        const existing = this.mistakes.find((mistake) => mistake.id === id);

        if (isCorrect) {
          if (!existing) return;
          await deleteItem(this.db, MISTAKE_STORE, id);
          this.mistakes = this.mistakes.filter((mistake) => mistake.id !== id);
          return;
        }

        const now = Date.now();
        const rangeTerms = this.currentQuestion.rangeTerms
          ? Array.from(this.currentQuestion.rangeTerms).map(Number).filter((value) => Number.isFinite(value))
          : this.getMistakeRangeTerms({
              operation: this.setup.operation,
              text: this.currentQuestion.text,
              answer: this.currentQuestion.answer
            });
        const mistake = {
          id,
          userId: this.selectedUserId,
          operation: this.setup.operation,
          factKey: this.currentQuestion.factKey,
          text: this.currentQuestion.text,
          answer: this.currentQuestion.answer,
          rangeTerms,
          wrongCount: existing ? existing.wrongCount + 1 : 1,
          priority: existing ? Math.min(existing.priority + 1, 8) : 3,
          lastWrongAt: now,
          createdAt: existing ? existing.createdAt : now
        };

        await putItem(this.db, MISTAKE_STORE, mistake);
        this.mistakes = this.mistakes.filter((item) => item.id !== id);
        this.mistakes.push(mistake);
      },

      randomGoodFeedback() {
        const messages = this.copy.goodFeedback;
        return messages[rand(0, messages.length - 1)];
      },

      quitGame() {
        if (!this.game) return;
        const shouldSavePerfectRun = this.activeMode.stopOnMistake && this.game.total > 0;
        this.finishGame(shouldSavePerfectRun);
      },

      async finishGame(saveResult) {
        if (!this.game) return;
        this.stopTimer();

        if (!saveResult || this.game.total === 0) {
          this.game = null;
          this.view = "home";
          return;
        }

        const result = {
          id: uid("result"),
          userId: this.selectedUserId,
          operation: this.setup.operation,
          mode: this.setup.mode,
          score: this.game.score,
          correct: this.game.correct,
          total: this.game.total,
          duration: Math.round((Date.now() - this.game.startedAt) / 1000),
          rangeMin: this.setup.rangeMin,
          rangeMax: this.setup.rangeMax,
          createdAt: Date.now()
        };

        await putItem(this.db, RESULT_STORE, result);
        this.results.push(result);
        this.lastResult = result;
        this.game = null;
        this.view = "results";
      },

      getBestScoreForCurrentSetup() {
        return this.currentUserResults
          .filter((result) => result.operation === this.setup.operation && result.mode === this.setup.mode)
          .reduce((best, result) => Math.max(best, result.score), 0);
      }
    }
  }).mount("#app");
})();
