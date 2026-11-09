(function () {
  'use strict';

  var PLAYERS = ['Alain', 'Emma'];
  var STORE_KEY = 'mathifun-regions-v1'; // { player, scores: { Alain: [...], Emma: [...] } }
  var MAX_SCORES = 5;
  var MAX_ERRORS = 3;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var regions = window.REGIONS;
  var $ = function (id) { return document.getElementById(id); };

  // --- Stockage local (jamais d'erreur bloquante si indisponible) ---
  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORE_KEY));
      if (data && data.scores) return data;
    } catch (e) { /* ignore */ }
    return { player: PLAYERS[0], scores: { Alain: [], Emma: [] } };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.store)); } catch (e) { /* ignore */ }
  }

  var state = {
    store: load(),
    queue: [], current: null, found: {}, errors: 0,
    startedAt: 0, ticker: null, running: false, locked: false
  };
  PLAYERS.forEach(function (p) { if (!state.store.scores[p]) state.store.scores[p] = []; });
  if (PLAYERS.indexOf(state.store.player) < 0) state.store.player = PLAYERS[0];

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
    Array.prototype.forEach.call(document.querySelectorAll('.player'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-player') === state.store.player);
      b.disabled = state.running; // pas de changement de joueur en cours de partie
    });
    $('giveup').disabled = !state.running;
  }

  // Anciennes parties (avant l'ajout du nombre de régions) : toujours des victoires
  function foundOf(s) { return typeof s.found === 'number' ? s.found : regions.length; }

  // Classement : plus de régions trouvées d'abord, puis temps le plus court, puis moins d'erreurs
  function addScore(entry) {
    var p = state.store.player;
    var list = state.store.scores[p];
    list.push(entry);
    list.sort(function (a, b) { return foundOf(b) - foundOf(a) || a.time - b.time || a.errors - b.errors; });
    var rank = list.indexOf(entry);
    state.store.scores[p] = list.slice(0, MAX_SCORES);
    save();
    renderScores();
    return rank;
  }

  function renderScores() {
    PLAYERS.forEach(function (p) {
      var ol = $('scores-' + p);
      ol.innerHTML = '';
      var list = state.store.scores[p];
      if (!list.length) {
        var li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'Pas encore de partie';
        ol.appendChild(li);
        return;
      }
      list.forEach(function (s) {
        var li = document.createElement('li');
        var n = foundOf(s);
        li.innerHTML = '<strong></strong> <small></small>';
        li.firstChild.textContent = n + ' / ' + regions.length + ' régions — ' + fmt(s.time);
        li.lastChild.textContent = '(' + s.errors + (s.errors > 1 ? ' erreurs)' : ' erreur)');
        if (n === regions.length) li.classList.add('perfect');
        ol.appendChild(li);
      });
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
    regions.forEach(function (r) {
      pathEls[r.id].setAttribute('class', 'region');
      buttons[r.id].className = 'choice';
      buttons[r.id].disabled = false;
    });
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

  // Abandon : tout remettre à zéro (sans enregistrer de score) pour pouvoir changer de joueur
  function giveUp() {
    if (!state.running) return;
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
    $('timer').textContent = '0:00';
    $('start').textContent = 'Commencer';
    setHint('Choisis ton nom puis appuie sur « Commencer ».');
    renderStatus(); renderPlayers();
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
    $('win-title').textContent = 'Perdu, ' + state.store.player + ' !';
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
    var p = state.store.player;
    var rank = addScore({ found: regions.length, time: time, errors: state.errors, date: Date.now() });
    renderPlayers();
    setHint('Terminé !');
    $('again').textContent = 'Rejouer';
    $('win-missed').hidden = true;
    $('win-title').textContent = 'Bravo ' + p + ' !';
    $('win-text').textContent = 'Temps : ' + fmt(time) + ' — ' + state.errors +
      (state.errors > 1 ? ' erreurs' : ' erreur') +
      (rank === 0 ? '. Nouveau record !' : '.');
    $('win').hidden = false;
  }

  // --- Événements ---
  $('start').addEventListener('click', startGame);
  $('giveup').addEventListener('click', giveUp);
  $('again').addEventListener('click', startGame);
  Array.prototype.forEach.call(document.querySelectorAll('.player'), function (b) {
    b.addEventListener('click', function () {
      if (state.running) return;
      state.store.player = b.getAttribute('data-player');
      save(); renderPlayers();
    });
  });

  renderPlayers(); renderScores(); renderStatus();
})();
