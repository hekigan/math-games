(function () {
  'use strict';

  // Même base IndexedDB et mêmes profils que la page de mathématiques (app.js).
  // Les scores des régions sont rangés dans le magasin « appState » (clé « regionsScores »),
  // ce qui évite de changer la version du schéma partagé.
  var DB_NAME = 'mathifun-db';
  var DB_VERSION = 2;
  var MAX_SCORES = 5;
  var MAX_ERRORS = 3;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var regions = window.REGIONS;
  var $ = function (id) { return document.getElementById(id); };

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () { // identique à app.js, au cas où cette page s'ouvre en premier
        var db = request.result;
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('results')) {
          db.createObjectStore('results', { keyPath: 'id' }).createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains('appState')) db.createObjectStore('appState', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('mistakes')) {
          db.createObjectStore('mistakes', { keyPath: 'id' }).createIndex('userId', 'userId', { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }
  function req(r) {
    return new Promise(function (resolve, reject) {
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }
  function store(name, mode) { return state.db.transaction(name, mode).objectStore(name); }
  // Si IndexedDB est indisponible (navigation privée, aperçu…), on joue quand même, sans sauvegarde durable
  var memory = {};
  function getState(key) {
    if (!state.db) return Promise.resolve(memory[key] === undefined ? null : memory[key]);
    return req(store('appState', 'readonly').get(key)).then(function (x) { return x ? x.value : null; });
  }
  function setState(key, value) {
    if (!state.db) { memory[key] = JSON.parse(JSON.stringify(value)); return Promise.resolve(); }
    return req(store('appState', 'readwrite').put({ key: key, value: JSON.parse(JSON.stringify(value)) }));
  }
  function uid(prefix) {
    if (window.crypto && crypto.randomUUID) return prefix + '-' + crypto.randomUUID();
    return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  var state = {
    db: null, users: [], userId: null, scores: {}, // scores : { idUtilisateur: [ {found,time,errors,date} ] }
    queue: [], current: null, found: {}, errors: 0,
    startedAt: 0, ticker: null, running: false, locked: false
  };
  function currentUser() {
    return state.users.filter(function (u) { return u.id === state.userId; })[0] || null;
  }

  // --- Carte ---
  var map = $('map');
  var pathEls = {};
  regions.forEach(function (r) {
    var p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', r.d);
    p.setAttribute('class', 'region');
    map.appendChild(p);
    pathEls[r.id] = p;
  });

  // --- Noms sur la carte (visibles avant le début de la partie) ---
  // Centre de gravité du plus grand polygone du tracé SVG
  function labelPoint(d) {
    var best = null;
    d.split('Z').forEach(function (sub) {
      var nums = sub.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
      if (nums.length < 6) return;
      var pts = [];
      for (var i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
      var A = 0, cx = 0, cy = 0;
      for (var j = 0; j < pts.length; j++) {
        var p = pts[j], q = pts[(j + 1) % pts.length];
        var c = p[0] * q[1] - q[0] * p[1];
        A += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
      }
      if (!best || Math.abs(A) > best.area) best = { area: Math.abs(A), x: cx / (3 * A), y: cy / (3 * A) };
    });
    return best;
  }
  // Réglages à la main pour les régions où le centre de gravité tombe mal : décalage (dx, dy) et taille du texte
  var LABEL_TWEAKS = {
    'Île-de-France': { size: 13 },
    'Corse': { dx: -60, dy: 0, anchor: 'end' }
  };
  var LABEL_LINES = {
    'Hauts-de-France': ['Hauts-de-', 'France'],
    'Pays de la Loire': ['Pays de', 'la Loire'],
    'Centre-Val de Loire': ['Centre-', 'Val de Loire'],
    'Bourgogne-Franche-Comté': ['Bourgogne-', 'Franche-Comté'],
    'Auvergne-Rhône-Alpes': ['Auvergne-', 'Rhône-Alpes'],
    'Nouvelle-Aquitaine': ['Nouvelle-', 'Aquitaine'],
    "Provence-Alpes-Côte d'Azur": ['Provence-', 'Alpes-Côte', "d'Azur"]
  };
  var labelsEl = document.createElementNS(SVGNS, 'g');
  labelsEl.setAttribute('class', 'labels');
  regions.forEach(function (r) {
    var pt = labelPoint(r.d);
    var tw = LABEL_TWEAKS[r.name] || {};
    var lines = LABEL_LINES[r.name] || [r.name];
    var t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('x', pt.x + (tw.dx || 0));
    t.setAttribute('y', pt.y + (tw.dy || 0) - (lines.length - 1) * 0.5 * (tw.size || 21) * 1.05);
    t.setAttribute('text-anchor', tw.anchor || 'middle');
    t.setAttribute('font-size', tw.size || 21);
    lines.forEach(function (line, i) {
      var ts = document.createElementNS(SVGNS, 'tspan');
      ts.setAttribute('x', pt.x + (tw.dx || 0));
      ts.setAttribute('dy', i === 0 ? 0 : (tw.size || 21) * 1.05);
      ts.textContent = line.trim();
      t.appendChild(ts);
    });
    labelsEl.appendChild(t);
  });
  map.appendChild(labelsEl);
  function showLabels(on) { labelsEl.style.display = on ? '' : 'none'; }

  // --- Liste de choix (ordre alphabétique comme sur la fiche) ---
  var choicesEl = $('choices');
  var buttons = {};
  regions.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); })
    .forEach(function (r) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = r.name;
      b.disabled = true;
      b.addEventListener('click', function () { answer(r.id, b); });
      choicesEl.appendChild(b);
      buttons[r.id] = b;
    });

  // --- Utilitaires ---
  function fmt(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function setHint(t) { $('hint').textContent = t; }

  function renderPlayers() {
    var u = currentUser();
    $('who').textContent = u ? u.name : '';
    $('switch').disabled = state.running; // pas de changement de joueur en cours de partie
    $('giveup').disabled = !state.running;
  }

  // Anciennes parties (avant l'ajout du nombre de régions) : toujours des victoires
  function foundOf(s) { return typeof s.found === 'number' ? s.found : regions.length; }

  // Classement : plus de régions trouvées d'abord, puis temps le plus court, puis moins d'erreurs
  function addScore(entry) {
    var id = state.userId;
    var list = (state.scores[id] = state.scores[id] || []);
    list.push(entry);
    list.sort(function (a, b) { return foundOf(b) - foundOf(a) || a.time - b.time || a.errors - b.errors; });
    var rank = list.indexOf(entry);
    state.scores[id] = list.slice(0, MAX_SCORES);
    // relire puis réécrire pour ne pas écraser les scores d'un autre onglet
    getState('regionsScores').then(function (all) {
      all = all || {};
      all[id] = state.scores[id];
      return setState('regionsScores', all);
    }).catch(function (e) { console.error(e); });
    renderScores();
    return rank;
  }

  function renderScores() {
    var box = $('score-cols');
    box.innerHTML = '';
    var users = state.users.slice().sort(function (a, b) {
      return (b.id === state.userId) - (a.id === state.userId);
    });
    users.forEach(function (u) {
      var col = document.createElement('div');
      var h = document.createElement('h3'); h.textContent = u.name;
      var ol = document.createElement('ol');
      var list = state.scores[u.id] || [];
      if (!list.length) {
        var e = document.createElement('li');
        e.className = 'empty'; e.textContent = 'Pas encore de partie';
        ol.appendChild(e);
      }
      list.forEach(function (sc) {
        var li = document.createElement('li');
        var n = foundOf(sc);
        li.innerHTML = '<strong></strong> <small></small>';
        li.firstChild.textContent = n + ' / ' + regions.length + ' régions — ' + fmt(sc.time);
        li.lastChild.textContent = '(' + sc.errors + (sc.errors > 1 ? ' erreurs)' : ' erreur)');
        if (n === regions.length) li.classList.add('perfect');
        ol.appendChild(li);
      });
      col.appendChild(h); col.appendChild(ol); box.appendChild(col);
    });
  }

  function renderStatus() {
    $('progress').textContent = Object.keys(state.found).length + ' / ' + regions.length;
    $('errors').textContent = state.errors;
  }

  function tick() { $('timer').textContent = fmt(Date.now() - state.startedAt); }

  // --- Jeu ---
  function nextRegion() {
    if (state.current) pathEls[state.current].classList.remove('active');
    state.current = state.queue.shift() || null;
    if (state.current) {
      pathEls[state.current].classList.add('active');
      setHint('Quelle est cette région ?');
    }
  }

  function startGame() {
    clearInterval(state.ticker);
    state.running = true; state.locked = false;
    state.found = {}; state.errors = 0; state.current = null;
    state.queue = shuffle(regions.map(function (r) { return r.id; }));
    if (state.lastLost && state.queue[0] === state.lastLost) {
      var k = 1 + Math.floor(Math.random() * (state.queue.length - 1));
      var t = state.queue[0]; state.queue[0] = state.queue[k]; state.queue[k] = t;
    }
    state.lastLost = null;
    // Liste des régions dans un ordre différent à chaque nouvelle partie
    shuffle(regions.slice()).forEach(function (r) { choicesEl.appendChild(buttons[r.id]); });
    regions.forEach(function (r) {
      pathEls[r.id].setAttribute('class', 'region');
      buttons[r.id].className = 'choice';
      buttons[r.id].disabled = false;
    });
    showLabels(false);
    $('win').hidden = true;
    $('win-missed').hidden = true;
    $('start').textContent = 'Recommencer';
    state.startedAt = Date.now();
    tick();
    state.ticker = setInterval(tick, 250);
    renderStatus(); renderPlayers();
    nextRegion();
  }

  function answer(id, btn) {
    if (!state.running || state.locked || btn.disabled) return;
    if (id === state.current) {
      state.found[id] = true;
      pathEls[id].classList.remove('active');
      pathEls[id].classList.add('found');
      btn.classList.add('done');
      btn.disabled = true;
      renderStatus();
      if (state.queue.length === 0) return finish();
      setHint('Bravo ! Une autre région…');
      nextRegion();
    } else {
      state.errors++;
      renderStatus();
      btn.classList.add('wrong');
      state.locked = true;
      if (state.errors >= MAX_ERRORS) return lose(btn);
      setHint('Essaie encore ! (' + (MAX_ERRORS - state.errors) + (MAX_ERRORS - state.errors > 1 ? ' essais restants)' : ' essai restant)'));
      setTimeout(function () { btn.classList.remove('wrong'); state.locked = false; }, 450);
    }
  }

  // Remet la carte, le chrono et les compteurs à zéro (sans enregistrer de score)
  function resetBoard() {
    clearInterval(state.ticker);
    state.running = false; state.locked = false;
    state.current = null; state.lastLost = null;
    state.found = {}; state.errors = 0; state.queue = [];
    regions.forEach(function (r) {
      pathEls[r.id].setAttribute('class', 'region');
      buttons[r.id].className = 'choice';
      buttons[r.id].disabled = true;
    });
    $('win').hidden = true;
    $('win-missed').hidden = true;
    showLabels(true);
    $('timer').textContent = '0:00';
    $('start').textContent = 'Commencer';
    setHint('Appuie sur « Commencer ».');
    renderStatus(); renderPlayers();
  }

  // Abandon : permet de remettre le temps à zéro et de changer de joueur
  function giveUp() {
    if (!state.running) return;
    resetBoard();
  }

  function lose() {
    state.lastLost = state.current; // la prochaine partie ne doit pas commencer par cette zone
    var missed = regions.filter(function (r) { return r.id === state.current; })[0];
    pathEls[state.current].classList.remove('active');
    pathEls[state.current].classList.add('missed'); // reste visible sur la carte
    clearInterval(state.ticker);
    state.running = false;
    var nFound = Object.keys(state.found).length;
    var time = Date.now() - state.startedAt;
    $('timer').textContent = fmt(time);
    var recorded = false;
    if (nFound > 0) {
      addScore({ found: nFound, time: time, errors: state.errors, date: Date.now() });
      recorded = true;
    }
    regions.forEach(function (r) { buttons[r.id].disabled = true; });
    renderPlayers();
    setHint('C\u2019était : ' + missed.name);
    $('win-title').textContent = 'Perdu, ' + currentUser().name + ' !';
    $('win-text').textContent = 'Tu as fait 3 erreurs. Tu avais trouvé ' +
      Object.keys(state.found).length + ' région' + (Object.keys(state.found).length > 1 ? 's' : '') +
      ' sur ' + regions.length + ' en ' + fmt(time) + '.' +
      (recorded ? ' Score enregistré.' : '');
    $('win-missed').textContent = 'La région à trouver était : ' + missed.name;
    $('win-missed').hidden = false;
    $('again').textContent = 'Recommencer';
    $('win').hidden = false;
  }

  function finish() {
    clearInterval(state.ticker);
    state.running = false; state.current = null;
    var time = Date.now() - state.startedAt;
    $('timer').textContent = fmt(time);
    var p = currentUser().name;
    var rank = addScore({ found: regions.length, time: time, errors: state.errors, date: Date.now() });
    renderPlayers();
    showLabels(true); // victoire : on peut relire les noms
    setHint('Terminé !');
    $('again').textContent = 'Rejouer';
    $('win-missed').hidden = true;
    $('win-title').textContent = 'Bravo ' + p + ' !';
    $('win-text').textContent = 'Temps : ' + fmt(time) + ' — ' + state.errors +
      (state.errors > 1 ? ' erreurs' : ' erreur') +
      (rank === 0 ? '. Nouveau record !' : '.');
    $('win').hidden = false;
  }

  // --- Choix du joueur (mêmes profils que la page de mathématiques) ---
  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0].toUpperCase(); }).join('');
  }

  function showLogin(message) {
    resetBoard();
    $('game').hidden = true;
    $('login').hidden = false;
    $('who-box').hidden = true;
    $('login-msg').textContent = message || '';
    var list = $('user-list');
    list.innerHTML = '';
    $('user-title').hidden = !state.users.length;
    $('no-user').hidden = !!state.users.length;
    state.users.forEach(function (u) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'user-card';
      b.innerHTML = '<span class="avatar"></span><strong></strong>';
      b.firstChild.textContent = initials(u.name);
      b.lastChild.textContent = u.name;
      b.addEventListener('click', function () { selectUser(u.id); });
      list.appendChild(b);
    });
  }

  function selectUser(id) {
    state.userId = id;
    setState('selectedUserId', id).catch(function (e) { console.error(e); });
    resetBoard();
    $('login').hidden = true;
    $('game').hidden = false;
    $('who-box').hidden = false;
    renderPlayers(); renderScores();
  }

  function createUser(ev) {
    ev.preventDefault();
    var name = $('new-user').value.trim();
    if (!name) return showLogin('Écris un prénom avant d\u2019ajouter un joueur.');
    if (state.users.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) {
      return showLogin('Ce prénom existe déjà.');
    }
    var user = { id: uid('user'), name: name, createdAt: Date.now(), lastSettings: null };
    // même structure que dans app.js ; lastSettings sera complété par la page de maths
    (state.db ? req(store('users', 'readwrite').put(user)) : Promise.resolve()).then(function () {
      state.users.push(user);
      $('new-user').value = '';
      selectUser(user.id);
    }).catch(function (e) { console.error(e); showLogin('Impossible d\u2019enregistrer le joueur.'); });
  }

  // --- Événements ---
  $('start').addEventListener('click', startGame);
  $('giveup').addEventListener('click', giveUp);
  $('again').addEventListener('click', startGame);
  $('switch').addEventListener('click', function () { if (!state.running) showLogin(); });
  $('create-user').addEventListener('submit', createUser);

  var dbWarning = '';
  openDatabase().catch(function (e) {
    console.error(e);
    dbWarning = 'Les profils ne seront pas conservés sur cet appareil (stockage indisponible).';
    return null;
  }).then(function (db) {
    state.db = db;
    if (!db) return [[], null, null];
    return Promise.all([req(store('users', 'readonly').getAll()), getState('selectedUserId'), getState('regionsScores')]);
  }).then(function (r) {
    state.users = r[0] || [];
    state.scores = r[2] || {};
    if (state.users.some(function (u) { return u.id === r[1]; })) selectUser(r[1]);
    else showLogin(dbWarning);
  });
})();
