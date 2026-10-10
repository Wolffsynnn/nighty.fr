// ===== DÉTECTION APPAREIL (vrai mobile vs PC) =====
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent)
               || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));

if (IS_MOBILE) {
  document.body.classList.add('is-mobile');
} else {
  document.body.classList.add('is-desktop');
}

// ===== DEBUG VISUEL =====
window.onerror = function (msg) {
  const el = document.getElementById('debug-message');
  if (el) {
    el.textContent = '❌ ERREUR : ' + msg;
    el.style.display = 'block';
  }
};

let _msgTimer = null;
function showMessage(text) {
  const el = document.getElementById('debug-message');
  if (!el) {
    console.log('[showMessage]', text);
    return;
  }
  el.textContent = text;
  el.style.display = 'block';
  if (_msgTimer) clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => {
    el.style.display = 'none';
  }, 3000);
}

function safeOn(el, event, cb) {
  if (!el) {
    console.warn('⚠️ Élément manquant pour event "' + event + '"');
    return;
  }
  el.addEventListener(event, cb);
}

let blockAutoRedirect = false;

let choixAnge = 'none';
let choixMaire = 'none';
let choixAdjoint = 'non';

// ===== RÉCUPÉRATION DES ÉCRANS =====
const introScreen       = document.getElementById('intro-screen');
const authScreen        = document.getElementById('auth-screen');
const modeScreen        = document.getElementById('mode-screen');
const lobbyScreen       = document.getElementById('lobby-screen');
const publicGamesScreen = document.getElementById('public-games-screen');
const friendsScreen     = document.getElementById('friends-screen');
const profileScreen     = document.getElementById('profile-screen');
const gameLobbyScreen   = document.getElementById('game-lobby-screen');

const btnContinue     = document.getElementById('btn-continue');
const btnBackMode     = document.getElementById('btn-back-mode');
const btnBackGames    = document.getElementById('btn-back-games');
const btnRefreshGames = document.getElementById('btn-refresh-games');
const gamesList       = document.getElementById('games-list');
const gamesTabs       = document.querySelectorAll('.games-tab');
let currentGamesTab   = 'public';

// ═══════════════════════════════════════════════════════════
// 📚 RÔLES
// ═══════════════════════════════════════════════════════════
const ROLES_BASE = [
  { id: 'simple-villageois', nom: 'Simple Villageois', emoji: '🧑‍🌾', camp: 'village', estUnique: false, description: 'Habitant sans pouvoir. Vote le jour pour démasquer les loups.' },
  { id: 'loup-garou',        nom: 'Loup-Garou',        emoji: '🐺', camp: 'loups',   estUnique: false, description: 'Se réveille chaque nuit avec sa meute pour éliminer un joueur.' },
  { id: 'voyante',           nom: 'Voyante',           emoji: '🔮', camp: 'village', estUnique: true,  description: 'Découvre le rôle exact d\'un joueur chaque nuit.' },
  { id: 'sorciere',          nom: 'Sorcière',          emoji: '🧪', camp: 'village', estUnique: true,  description: 'Deux potions : une pour sauver, une pour tuer.' },
  { id: 'loup-noir',         nom: 'Loup Noir',         emoji: '🖤', camp: 'loups',   estUnique: true,  description: 'Peut infecter une victime une fois par partie.' },
  { id: 'loup-bavard',       nom: 'Loup Bavard',       emoji: '🗣️', camp: 'loups',   estUnique: true,  description: 'Doit cacher un mot chaque jour dans le chat.' },
  { id: 'loup-blanc',        nom: 'Loup Blanc',        emoji: '🤍', camp: 'neutre',  estUnique: true,  description: 'Faux allié des loups. Gagne seul.' },
  { id: 'petite-fille-classique', nom: 'Petite Fille Classique', emoji: '👧', camp: 'village', estUnique: true, description: 'Espionne le chat des loups.' },
  { id: 'chasseur',          nom: 'Chasseur',          emoji: '🏹', camp: 'village', estUnique: true,  description: 'À sa mort, emporte un joueur avec lui.' },
  { id: 'garde',             nom: 'Garde',             emoji: '🛡️', camp: 'village', estUnique: true,  description: 'Protège un joueur chaque nuit.' },
  { id: 'cupidon',           nom: 'Cupidon',           emoji: '💘', camp: 'village', estUnique: true,  description: 'Unit 2 joueurs la première nuit.' },
  { id: 'mentaliste',        nom: 'Mentaliste',        emoji: '🧠', camp: 'village', estUnique: true,  description: 'Perçoit l\'issue du vote avant la fin.' },
  { id: 'necromancien',      nom: 'Nécromancien',      emoji: '💀', camp: 'village', estUnique: true,  description: 'Parle aux morts chaque nuit.' },
  { id: 'fossoyeur',         nom: 'Fossoyeur',         emoji: '⚰️', camp: 'village', estUnique: true,  description: 'À sa mort, révèle 2 joueurs dont un loup.' },
];

const ROLES_VARIANTES = [
  { id: 'petite-fille-2-0',   nom: 'Petite Fille 2.0',   emoji: '👧', camp: 'village', estUnique: true,  description: 'Espionne ET parle aux loups anonymement.' },
  { id: 'voyante-bavarde',    nom: 'Voyante Bavarde',    emoji: '🗣️🔮', camp: 'village', estUnique: true,  description: 'Voit un rôle, le village apprend le rôle (sans le pseudo).' },
];

const ROLES_NIGHTMARES = [
  { id: 'nightmares-original', nom: 'Nightmares (Original)', emoji: '🌑', camp: 'nightmares', estUnique: true, description: 'Marque un joueur chaque nuit. Mort au tour suivant.' },
  { id: 'rodeur',              nom: 'Le Rodeur',              emoji: '🌫️', camp: 'nightmares', estUnique: true, description: 'Rode 2 nuits. Sa cible doit le tuer sinon elle meurt.' },
  { id: 'marionettiste',       nom: 'La Marionettiste',       emoji: '🎭', camp: 'nightmares', estUnique: true, description: 'Contrôle un joueur et utilise son pouvoir.' },
];

// ═══════════════════════════════════════════════════════════
// 📋 COMPOSITIONS PRÉDÉFINIES
// ═══════════════════════════════════════════════════════════
const COMPOS_PREDEFINIES = {
  5:  ['loup-garou', 'voyante', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  6:  ['loup-garou', 'voyante', 'sorciere', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  7:  ['loup-garou', 'loup-garou', 'voyante', 'sorciere', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  8:  ['loup-garou', 'loup-garou', 'voyante', 'sorciere', 'garde', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  9:  ['loup-garou', 'loup-garou', 'voyante', 'sorciere', 'garde', 'chasseur', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  10: ['loup-garou', 'loup-garou', 'loup-noir', 'voyante', 'sorciere', 'garde', 'chasseur', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  11: ['loup-garou', 'loup-garou', 'loup-garou', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  12: ['loup-garou', 'loup-garou', 'loup-garou', 'loup-noir', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  13: ['loup-garou', 'loup-garou', 'loup-garou', 'loup-noir', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'mentaliste', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  14: ['loup-garou', 'loup-garou', 'loup-garou', 'loup-noir', 'loup-bavard', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'mentaliste', 'simple-villageois', 'simple-villageois', 'simple-villageois'],
  15: ['loup-garou', 'loup-garou', 'loup-garou', 'loup-garou', 'loup-noir', 'loup-bavard', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'mentaliste', 'necromancien', 'simple-villageois', 'simple-villageois'],
  16: ['loup-garou', 'loup-garou', 'loup-garou', 'loup-garou', 'loup-noir', 'loup-bavard', 'loup-blanc', 'voyante', 'sorciere', 'garde', 'chasseur', 'cupidon', 'mentaliste', 'necromancien', 'fossoyeur', 'simple-villageois'],
};

function getRoleById(id) {
  return [...ROLES_BASE, ...ROLES_VARIANTES, ...ROLES_NIGHTMARES].find(r => r.id === id) || null;
}

// ===================== BARRE D'ONGLETS GLOBALE =====================
const globalTabBar  = document.getElementById('global-tab-bar');
const globalTabBtns = globalTabBar ? globalTabBar.querySelectorAll('.tab-btn') : [];

if (globalTabBar) globalTabBar.classList.add('hidden');

function updateTabBarVisibility() {
  if (!globalTabBar) return;

  const screensWithTabBar = ['lobby-screen', 'public-games-screen', 'friends-screen', 'profile-screen'];

  const activeScreen = document.querySelector('.screen:not(.hidden)');
  if (!activeScreen) return;

  if (screensWithTabBar.includes(activeScreen.id)) {
    globalTabBar.classList.add('visible');
  } else {
    globalTabBar.classList.remove('visible');
  }

  let activeTab = '';
  if (activeScreen.id === 'lobby-screen')        activeTab = 'lobby';
  if (activeScreen.id === 'public-games-screen') activeTab = 'play';
  if (activeScreen.id === 'friends-screen')      activeTab = 'friends';
  if (activeScreen.id === 'profile-screen')      activeTab = 'profile';

  globalTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });
}

function goToScreen(screen) {
  if (!screen) return;
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  screen.classList.remove('hidden');
  updateTabBarVisibility();
}

// ===== ONGLETS GLOBAUX =====
globalTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    if (tab === 'lobby') {
      goToScreen(lobbyScreen);
    } else if (tab === 'play') {
      goToScreen(publicGamesScreen);
      loadPublicGames();
    } else if (tab === 'profile') {
      openProfile(window.firebaseAuth?.currentUser?.displayName || 'moi', true);
    } else if (tab === 'friends') {
      goToScreen(friendsScreen);
      loadFriendsTab('list');
    } else if (tab === 'shop') {
      showMessage('🛍️ Boutique bientôt disponible');
    } else if (tab === 'options') {
      showMessage('⚙️ Options bientôt disponibles');
    }
  });
});

// ===== INTRO → AUTH =====
safeOn(btnContinue, 'click', () => {
  goToScreen(authScreen);
});

safeOn(btnBackMode, 'click', () => {
  blockAutoRedirect = true;
  goToScreen(authScreen);
});

// ===== ONGLETS AUTH =====
const tabs = document.querySelectorAll('.auth-tab');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    if (tab.dataset.tab === 'login') {
      formLogin?.classList.remove('hidden');
      formRegister?.classList.add('hidden');
    } else {
      formLogin?.classList.add('hidden');
      formRegister?.classList.remove('hidden');
    }
  });
});

// ===== POPUP COMMING SOON =====
const popup = document.getElementById('coming-soon-popup');
const btnPopupBack = document.getElementById('popup-return');

safeOn(btnPopupBack, 'click', () => {
  if (popup) popup.classList.add('hidden');
});

// ===== ATTENDRE FIREBASE =====
async function waitForFirebase() {
  const start = Date.now();
  while (!window.firebaseAuth) {
    if (Date.now() - start > 10000) {
      throw new Error('Firebase auth non chargé après 10s');
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return window.firebaseAuth;
}

// ===== IMPORT FIRESTORE =====
let firestoreFns = null;
async function getFirestoreFns() {
  if (!firestoreFns) {
    firestoreFns = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');
  }
  return firestoreFns;
}

// ═══════════════════════════════════════════════════════════
// SYSTÈME DE PRÉSENCE
// ═══════════════════════════════════════════════════════════
const MAX_FRIENDS = 50;
const ONLINE_TIMEOUT_MS = 2 * 60 * 1000;

async function updatePresence(status, gameId = null) {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  const { doc, setDoc } = await getFirestoreFns();

  try {
    const updates = {
      lastSeen: Date.now(),
      currentGameStatus: status,
      currentGameId: gameId,
    };
    await setDoc(doc(window.firebaseDB, 'users', user.uid), updates, { merge: true });
  } catch (err) {
    console.warn('Erreur updatePresence:', err);
  }
}

setInterval(() => {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  if (currentGameData) {
    const status = currentGameData.status === 'waiting' ? 'waiting' : 'playing';
    updatePresence(status, currentGameId);
  } else {
    updatePresence('online', null);
  }
}, 60 * 1000);

async function initPresence() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;
  await updatePresence('online', null);
}

function getFriendStatus(userData) {
  if (!userData) return 'offline';

  const lastSeen = userData.lastSeen || 0;
  const now = Date.now();

  if (now - lastSeen > ONLINE_TIMEOUT_MS) return 'offline';

  const status = userData.currentGameStatus;
  if (status === 'waiting') return 'waiting';
  if (status === 'playing') return 'playing';
  return 'online';
}

function getFriendStatusLabel(status) {
  if (status === 'online')   return { label: 'En ligne',     cls: 'online' };
  if (status === 'waiting')  return { label: 'En attente',   cls: 'waiting' };
  if (status === 'playing')  return { label: 'En partie',    cls: 'playing' };
  return { label: 'Hors ligne', cls: 'offline' };
}

// ===== INITIALISATION FIREBASE =====
async function initFirebase() {
  const auth = await waitForFirebase();
  showMessage('✅ Firebase prêt');

  const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
  } = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showMessage('👤 Connecté : ' + (user.displayName || user.email));

      if (!blockAutoRedirect) {
        goToScreen(modeScreen);
      }

      const pending = sessionStorage.getItem('pendingInvite');
      if (pending) {
        openProfile(pending);
        sessionStorage.removeItem('pendingInvite');
      }

      checkGameLink();
      initPresence();
    } else {
      showMessage('👤 Aucun utilisateur connecté');
    }
  });

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value.trim().toLowerCase();
      const password = e.target.password.value;
      const fakeEmail = `${username}@nighty.app`;

      blockAutoRedirect = false;

      try {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
        showMessage('✅ Connexion réussie !');
        goToScreen(modeScreen);
      } catch (err) {
        showMessage('❌ Connexion : ' + (err.code || err.message));
      }
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value.trim().toLowerCase();
      const password = e.target.password.value;

      const pseudoRegex = /^[a-z0-9._]{3,16}$/;
      if (!pseudoRegex.test(username)) {
        showMessage('❌ Pseudo invalide (3-16 car., a-z 0-9 . _)');
        return;
      }

      const fakeEmail = `${username}@nighty.app`;
      blockAutoRedirect = false;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        await updateProfile(userCredential.user, { displayName: username });

        const { doc, setDoc, serverTimestamp } = await getFirestoreFns();

        await setDoc(doc(window.firebaseDB, 'users', userCredential.user.uid), {
          pseudo: username,
          createdAt: serverTimestamp(),
          lastSeen: Date.now(),
          currentGameStatus: 'online',
          currentGameId: null,
          stats: { games: 0, wins: 0, ratio: 0 },
          friends: [],
          achievements: [],
          friendsRequests: { sent: [], received: [] },
        });

        showMessage('✅ Inscription réussie ! Pseudo : ' + username);
        goToScreen(modeScreen);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          showMessage('❌ Ce pseudo est déjà pris.');
        } else if (err.code === 'auth/weak-password') {
          showMessage('❌ Mot de passe trop faible (6 car. min).');
        } else {
          showMessage('❌ ' + err.code + ' — ' + err.message);
        }
      }
    });
  }
}

initFirebase().catch(err => {
  console.error('❌ initFirebase :', err);
  showMessage('❌ Firebase : ' + err.message);
});

// ===== MODE NORMAL → LOBBY =====
// ✅ CORRIGÉ : sélection plus robuste (par data-mode, insensible au HTML exact)
function attacherBoutonModeNormal() {
  const modeCards = document.querySelectorAll('.mode-card');
  let trouve = false;

  modeCards.forEach(card => {
    const dataMode = (card.dataset.mode || '').toLowerCase();
    const titre = card.querySelector('h3')?.textContent?.toLowerCase() || '';

    const estNormal = dataMode === 'normal' || titre.includes('normal');

    if (estNormal) {
      const btn = card.querySelector('.mode-play') || card.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          goToScreen(lobbyScreen);
          const canvas = document.getElementById('shader-canvas-lobby');
          if (canvas) initShaderCanvas(canvas);
        });
        trouve = true;
      }
    }
  });

  if (!trouve) {
    console.warn('⚠️ Bouton Mode Normal non trouvé');
  }
}

attacherBoutonModeNormal();

// ===== MODE BOSS → popup =====
function attacherBoutonModeBoss() {
  const modeCards = document.querySelectorAll('.mode-card');

  modeCards.forEach(card => {
    const dataMode = (card.dataset.mode || '').toLowerCase();
    const titre = card.querySelector('h3')?.textContent?.toLowerCase() || '';

    const estBoss = dataMode === 'boss' || titre.includes('boss');

    if (estBoss) {
      const btn = card.querySelector('.mode-play') || card.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          if (popup) popup.classList.remove('hidden');
        });
      }
    }
  });
}

attacherBoutonModeBoss();

// ===== PARTIES : Retour =====
safeOn(btnBackGames, 'click', () => {
  goToScreen(lobbyScreen);
});

// ===== PARTIES : Rafraîchir =====
safeOn(btnRefreshGames, 'click', () => {
  btnRefreshGames.classList.add('spinning');
  setTimeout(() => btnRefreshGames.classList.remove('spinning'), 800);
  loadPublicGames();
});

// ═══════════════════════════════════════════════════════════
// ONGLETS PUBLIQUES / PRIVÉES
// ═══════════════════════════════════════════════════════════
gamesTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    gamesTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    currentGamesTab = tab.dataset.gamesTab;
    loadGames();
  });
});

// ===================== SHADER =====================
const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_progress;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float fog = noise(uv * 4.0 + u_time * 0.3);
    fog += noise(uv * 8.0 - u_time * 0.2) * 0.5;
    float intensity = (1.0 - u_progress) * fog;
    vec3 fogColor = mix(vec3(0.05, 0.05, 0.15), vec3(0.9, 0.6, 0.2), fog * 0.4);
    float alpha = intensity * 0.7;
    gl_FragColor = vec4(fogColor, alpha);
  }
`;

function initShaderCanvas(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) return null;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uProgress = gl.getUniformLocation(program, 'u_progress');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let startTime = performance.now();
  let animating = true;

  function render() {
    if (!animating) return;
    const elapsed = (performance.now() - startTime) / 1000;
    const progress = Math.min(elapsed / 2.5, 1);

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uProgress, progress);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (progress < 1) {
      requestAnimationFrame(render);
    } else {
      animating = false;
      canvas.classList.remove('active');
    }
  }

  canvas.classList.add('active');
  startTime = performance.now();
  render();
}

// ===================== ÉCRAN AMIS =====================
const btnBackFriends = document.getElementById('btn-back-friends');
const friendsSearch = document.getElementById('friends-search');
const friendsResults = document.getElementById('friends-search-results');
const btnCopyInvite = document.getElementById('btn-copy-invite');
const friendsPanels = {
  list: document.querySelector('[data-friends-panel="list"]'),
  received: document.querySelector('[data-friends-panel="received"]'),
  sent: document.querySelector('[data-friends-panel="sent"]'),
  suggestions: document.querySelector('[data-friends-panel="suggestions"]'),
};

safeOn(btnBackFriends, 'click', () => {
  goToScreen(lobbyScreen);
});

const friendsTabs = document.querySelectorAll('.friends-tab');
friendsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    friendsTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    Object.values(friendsPanels).forEach((p) => p && p.classList.add('hidden'));
    const target = friendsPanels[tab.dataset.friendsTab];
    if (target) {
      target.classList.remove('hidden');
      loadFriendsTab(tab.dataset.friendsTab);
    }
  });
});

async function loadFriendsTab(tabName) {
  try {
    const user = window.firebaseAuth?.currentUser;
    if (!user) return;

    const { collection, getDocs, doc, getDoc } = await getFirestoreFns();

    if (tabName === 'list') {
      if (!friendsPanels.list) return;

      const snap = await getDocs(collection(window.firebaseDB, 'friendships'));
      const myFriendships = snap.docs.filter(d => {
        const data = d.data();
        return data.users && data.users.includes(user.uid);
      });

      const countEl = document.getElementById('friends-count');
      if (countEl) countEl.textContent = myFriendships.length;

      if (myFriendships.length === 0) {
        friendsPanels.list.innerHTML = '<p class="friends-empty">Aucun ami pour le moment...</p>';
        return;
      }

      let html = '';
      for (const d of myFriendships) {
        const data = d.data();
        const otherId = data.users.find(id => id !== user.uid);
        const otherDoc = await getDoc(doc(window.firebaseDB, 'users', otherId));
        if (otherDoc.exists()) {
          const other = otherDoc.data();
          const status = getFriendStatus(other);
          const { label, cls } = getFriendStatusLabel(status);

          let joinBtn = '';
          if (status === 'waiting' && other.currentGameId) {
            joinBtn = `<button class="friend-join-btn" data-joingame="${other.currentGameId}">Rejoindre</button>`;
          }

          html += `
            <div class="friend-card" data-userid="${otherId}" data-pseudo="${other.pseudo}" data-requestid="">
              <div class="friend-avatar">👤</div>
              <div class="friend-info">
                <span class="friend-pseudo">${other.pseudo}</span>
                <span class="friend-card-status">
                  <span class="status-dot ${cls}"></span>${label}
                </span>
              </div>
              <div class="friend-actions">
                ${joinBtn}
                <button class="action-btn disabled">✓ Ami</button>
              </div>
            </div>
          `;
        }
      }
      friendsPanels.list.innerHTML = html;

      friendsPanels.list.querySelectorAll('.friend-join-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const gameId = btn.dataset.joingame;
          if (!gameId) return;

          const { doc, getDoc } = await getFirestoreFns();
          const gameDoc = await getDoc(doc(window.firebaseDB, 'games', gameId));
          if (!gameDoc.exists()) {
            showMessage('❌ Cette partie n\'existe plus.');
            return;
          }

          const gameData = gameDoc.data();
          if (gameData.type === 'private') {
            pendingPrivateGameId = gameId;
            if (enterCodePopup) {
              enterCodePopup.classList.remove('hidden');
              if (ecCode) {
                ecCode.value = '';
                ecCode.focus();
              }
            }
          } else {
            joinGame(gameId);
          }
        });
      });

      friendsPanels.list.querySelectorAll('.friend-card').forEach(card => {
        card.addEventListener('click', () => {
          const pseudo = card.dataset.pseudo;
          if (pseudo) openProfile(pseudo);
        });
      });

    } else if (tabName === 'received') {
      if (!friendsPanels.received) return;
      const snap = await getDocs(collection(window.firebaseDB, 'friendRequests'));
      const myRequests = snap.docs.filter(d => d.data().to === user.uid);

      if (myRequests.length === 0) {
        friendsPanels.received.innerHTML = '<p class="friends-empty">Aucune demande reçue.</p>';
        return;
      }

      let html = '';
      for (const d of myRequests) {
        const data = d.data();
        html += renderFriendCard(data.from, data.fromPseudo, 'received', d.id);
      }
      friendsPanels.received.innerHTML = html;

    } else if (tabName === 'sent') {
      if (!friendsPanels.sent) return;
      const snap = await getDocs(collection(window.firebaseDB, 'friendRequests'));
      const myRequests = snap.docs.filter(d => d.data().from === user.uid);

      if (myRequests.length === 0) {
        friendsPanels.sent.innerHTML = '<p class="friends-empty">Aucune demande envoyée.</p>';
        return;
      }

      let html = '';
      for (const d of myRequests) {
        const data = d.data();
        html += renderFriendCard(data.to, data.toPseudo, 'sent', d.id);
      }
      friendsPanels.sent.innerHTML = html;

    } else if (tabName === 'suggestions') {
      if (!friendsPanels.suggestions) return;
      const usersSnap = await getDocs(collection(window.firebaseDB, 'users'));
      const friendshipsSnap = await getDocs(collection(window.firebaseDB, 'friendships'));
      const friendIds = new Set();
      friendshipsSnap.docs.forEach(d => {
        const data = d.data();
        if (data.users && data.users.includes(user.uid)) {
          const otherId = data.users.find(id => id !== user.uid);
          if (otherId) friendIds.add(otherId);
        }
      });

      const requestsSnap = await getDocs(collection(window.firebaseDB, 'friendRequests'));
      const pendingIds = new Set();
      requestsSnap.docs.forEach(d => {
        const data = d.data();
        if (data.from === user.uid) pendingIds.add(data.to);
        if (data.to === user.uid) pendingIds.add(data.from);
      });

      let html = '';
      usersSnap.forEach(d => {
        if (d.id === user.uid) return;
        if (friendIds.has(d.id)) return;
        if (pendingIds.has(d.id)) return;

        const data = d.data();
        html += renderFriendCard(d.id, data.pseudo, 'add');
      });

      friendsPanels.suggestions.innerHTML = html || '<p class="friends-empty">Aucune suggestion pour le moment.</p>';
    }

    attachFriendCardActions();
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

function renderFriendCard(userId, pseudo, state, requestId = '') {
  let btn = '';
  if (state === 'add')      btn = '<button class="action-btn accept" data-action="add">+ Ajouter</button>';
  if (state === 'friend')   btn = '<button class="action-btn disabled">✓ Ami</button>';
  if (state === 'sent')     btn = '<button class="action-btn cancel" data-action="cancel">Annuler</button>';
  if (state === 'received') btn = '<button class="action-btn accept" data-action="accept">Accepter</button><button class="action-btn refuse" data-action="refuse">Refuser</button>';

  return `
    <div class="friend-card" data-userid="${userId}" data-pseudo="${pseudo}" data-requestid="${requestId}">
      <div class="friend-avatar">👤</div>
      <div class="friend-info">
        <span class="friend-pseudo">${pseudo}</span>
      </div>
      <div class="friend-actions">${btn}</div>
    </div>
  `;
}

function attachFriendCardActions() {
  document.querySelectorAll('.friend-card .action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      const card = btn.closest('.friend-card');
      const userId = card.dataset.userid;
      const pseudo = card.dataset.pseudo;
      const requestId = card.dataset.requestid;
      const action = btn.dataset.action;

      const user = window.firebaseAuth?.currentUser;
      if (!user) return;

      const { doc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } = await getFirestoreFns();

      if (action === 'add') {
        const friendshipsSnap = await getDocs(collection(window.firebaseDB, 'friendships'));
        const myFriendsCount = friendshipsSnap.docs.filter(d =>
          d.data().users && d.data().users.includes(user.uid)
        ).length;

        if (myFriendsCount >= MAX_FRIENDS) {
          showMessage('🐺 Ta meute est complète (' + MAX_FRIENDS + '/' + MAX_FRIENDS + ') ! Retire un ami pour en ajouter un autre.');
          return;
        }

        const reqId = `${user.uid}_${userId}`;
        await setDoc(doc(window.firebaseDB, 'friendRequests', reqId), {
          from: user.uid,
          fromPseudo: user.displayName,
          to: userId,
          toPseudo: pseudo,
          createdAt: serverTimestamp(),
        });
        showMessage('✅ Demande envoyée à ' + pseudo);
        btn.textContent = '⏳ Envoyé';
        btn.classList.remove('accept');
        btn.classList.add('disabled');

      } else if (action === 'accept') {
        const friendshipId = [user.uid, userId].sort().join('_');
        await setDoc(doc(window.firebaseDB, 'friendships', friendshipId), {
          users: [user.uid, userId],
          createdAt: serverTimestamp(),
        });
        await deleteDoc(doc(window.firebaseDB, 'friendRequests', requestId));
        showMessage('✅ ' + pseudo + ' est maintenant ton ami !');
        card.remove();

      } else if (action === 'refuse') {
        await deleteDoc(doc(window.firebaseDB, 'friendRequests', requestId));
        showMessage('❌ Demande refusée');
        card.remove();

      } else if (action === 'cancel') {
        await deleteDoc(doc(window.firebaseDB, 'friendRequests', requestId));
        showMessage('❌ Demande annulée');
        card.remove();
      }
    });
  });
}

safeOn(friendsSearch, 'input', async (e) => {
  const query_text = e.target.value.trim().toLowerCase();

  if (query_text.length < 3) {
    friendsResults?.classList.add('hidden');
    return;
  }

  const { collection, getDocs } = await getFirestoreFns();
  const snap = await getDocs(collection(window.firebaseDB, 'users'));

  const results = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.pseudo && data.pseudo.toLowerCase().includes(query_text)) {
      results.push({ id: d.id, pseudo: data.pseudo });
    }
  });

  const user = window.firebaseAuth?.currentUser;

  if (!friendsResults) return;

  if (results.length === 0) {
    friendsResults.innerHTML = '<p class="friends-empty">Aucun joueur trouvé.</p>';
  } else {
    friendsResults.innerHTML = results.map(r => {
      if (r.id === user?.uid) return '';
      return renderFriendCard(r.id, r.pseudo, 'add');
    }).join('');
    attachFriendCardActions();
  }

  friendsResults.classList.remove('hidden');
});

safeOn(btnCopyInvite, 'click', async () => {
  const currentUser = window.firebaseAuth?.currentUser;
  const pseudo = currentUser?.displayName || 'joueur';
  const link = `${window.location.origin}/?invite=${pseudo}`;

  try {
    await navigator.clipboard.writeText(link);
    showMessage('🔗 Lien copié : ' + link);
  } catch (err) {
    showMessage('❌ Impossible de copier le lien.');
  }
});

// ===================== ÉCRAN PROFIL =====================
const btnBackProfile = document.getElementById('btn-back-profile');
const profilePseudo = document.getElementById('profile-pseudo');
const profileStatus = document.getElementById('profile-status');
const profileActionBtn = document.getElementById('profile-action-btn');

safeOn(btnBackProfile, 'click', () => {
  goToScreen(lobbyScreen);
});

async function openProfile(pseudo, isSelf = false) {
  if (profilePseudo) profilePseudo.textContent = pseudo;

  const currentUser = window.firebaseAuth?.currentUser;
  const { doc, getDoc, collection, getDocs } = await getFirestoreFns();

  if (isSelf) {
    if (profileStatus) profileStatus.innerHTML = '<span class="status-dot online"></span> Toi';
    if (profileActionBtn) {
      profileActionBtn.textContent = '✏️ Modifier le profil';
      profileActionBtn.classList.add('friend');
      profileActionBtn.dataset.userid = '';
    }

    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(window.firebaseDB, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = data.stats || { games: 0, wins: 0, ratio: 0 };

          const elGames = document.getElementById('stat-games');
          const elWins  = document.getElementById('stat-wins');
          const elRatio = document.getElementById('stat-ratio');
          if (elGames) elGames.textContent = stats.games || 0;
          if (elWins)  elWins.textContent  = stats.wins || 0;
          if (elRatio) elRatio.textContent = (stats.ratio || 0) + ' %';
        }
      } catch (err) {
        showMessage('❌ Erreur de chargement du profil');
      }
    }

    goToScreen(profileScreen);
    return;
  }

  let targetUser = null;
  try {
    const usersSnap = await getDocs(collection(window.firebaseDB, 'users'));
    usersSnap.forEach(d => {
      const data = d.data();
      if (data.pseudo === pseudo) {
        targetUser = { id: d.id, ...data };
      }
    });
  } catch (err) {
    console.warn(err);
  }

  if (!targetUser) {
    if (profileStatus) profileStatus.innerHTML = 'Utilisateur introuvable';
    if (profileActionBtn) profileActionBtn.textContent = '-';
    goToScreen(profileScreen);
    return;
  }

  let status = 'none';

  if (currentUser) {
    try {
      const friendshipsSnap = await getDocs(collection(window.firebaseDB, 'friendships'));
      friendshipsSnap.forEach(d => {
        const data = d.data();
        if (data.users && data.users.includes(currentUser.uid) && data.users.includes(targetUser.id)) {
          status = 'friend';
        }
      });

      if (status === 'none') {
        const reqSnap = await getDocs(collection(window.firebaseDB, 'friendRequests'));
        reqSnap.forEach(d => {
          const data = d.data();
          if (data.from === currentUser.uid && data.to === targetUser.id) status = 'sent';
          if (data.to === currentUser.uid && data.from === targetUser.id) status = 'received';
        });
      }
    } catch (err) {
      console.warn(err);
    }
  }

  const friendStatus = getFriendStatus(targetUser);
  const { label, cls } = getFriendStatusLabel(friendStatus);
  if (profileStatus) {
    profileStatus.innerHTML = `<span class="status-dot ${cls}"></span> ${label}`;
  }

  if (profileActionBtn) {
    profileActionBtn.dataset.userid = targetUser.id;
    profileActionBtn.classList.remove('friend');

    if (status === 'friend') {
      profileActionBtn.textContent = '✓ Ami';
      profileActionBtn.classList.add('friend');
      profileActionBtn.disabled = true;
    } else if (status === 'sent') {
      profileActionBtn.textContent = '⏳ En attente';
      profileActionBtn.classList.add('friend');
      profileActionBtn.disabled = true;
    } else if (status === 'received') {
      profileActionBtn.textContent = '✅ Accepter la demande';
      profileActionBtn.disabled = false;
    } else {
      profileActionBtn.textContent = '+ Ajouter en ami';
      profileActionBtn.disabled = false;
    }
  }

  const stats = targetUser.stats || { games: 0, wins: 0, ratio: 0 };
  const elGames = document.getElementById('stat-games');
  const elWins  = document.getElementById('stat-wins');
  const elRatio = document.getElementById('stat-ratio');
  if (elGames) elGames.textContent = stats.games || 0;
  if (elWins)  elWins.textContent  = stats.wins || 0;
  if (elRatio) elRatio.textContent = (stats.ratio || 0) + ' %';

  goToScreen(profileScreen);
}

safeOn(profileActionBtn, 'click', async () => {
  const currentUser = window.firebaseAuth?.currentUser;
  if (!currentUser) return;

  const targetId = profileActionBtn.dataset.userid;
  if (!targetId) return;

  const { doc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } = await getFirestoreFns();

  if (profileActionBtn.textContent.includes('Accepter')) {
    try {
      const friendshipId = [currentUser.uid, targetId].sort().join('_');
      await setDoc(doc(window.firebaseDB, 'friendships', friendshipId), {
        users: [currentUser.uid, targetId],
        createdAt: serverTimestamp(),
      });
      const reqId = `${targetId}_${currentUser.uid}`;
      await deleteDoc(doc(window.firebaseDB, 'friendRequests', reqId));

      showMessage('✅ Vous êtes maintenant amis !');
      profileActionBtn.textContent = '✓ Ami';
      profileActionBtn.classList.add('friend');
      profileActionBtn.disabled = true;
    } catch (err) {
      showMessage('❌ ' + (err.code || err.message));
    }
    return;
  }

  if (profileActionBtn.textContent.includes('Ajouter')) {
    const friendshipsSnap = await getDocs(collection(window.firebaseDB, 'friendships'));
    const myFriendsCount = friendshipsSnap.docs.filter(d =>
      d.data().users && d.data().users.includes(currentUser.uid)
    ).length;

    if (myFriendsCount >= 50) {
      showMessage('🐺 Ta meute est complète (50/50) !');
      return;
    }

    try {
      const reqId = `${currentUser.uid}_${targetId}`;
      await setDoc(doc(window.firebaseDB, 'friendRequests', reqId), {
        from: currentUser.uid,
        fromPseudo: currentUser.displayName,
        to: targetId,
        toPseudo: profilePseudo.textContent,
        createdAt: serverTimestamp(),
      });
      showMessage('✅ Demande envoyée à ' + profilePseudo.textContent);
      profileActionBtn.textContent = '⏳ En attente';
      profileActionBtn.classList.add('friend');
      profileActionBtn.disabled = true;
    } catch (err) {
      showMessage('❌ ' + (err.code || err.message));
    }
    return;
  }

  if (profileActionBtn.textContent.includes('Modifier')) {
    showMessage('✏️ Fonctionnalité à venir');
  }
});

// ===================== LIEN D'INVITATION AMI =====================
function checkInviteLink() {
  const params = new URLSearchParams(window.location.search);
  const invitePseudo = params.get('invite');

  if (invitePseudo) {
    sessionStorage.setItem('pendingInvite', invitePseudo);

    if (window.firebaseAuth?.currentUser) {
      setTimeout(() => openProfile(invitePseudo), 500);
      sessionStorage.removeItem('pendingInvite');
    }
  }
}

setTimeout(checkInviteLink, 1000);

// ═══════════════════════════════════════════════════════════
// SYSTÈME DE PARTIES MULTIJOUEUR
// ═══════════════════════════════════════════════════════════

const createGamePopup   = document.getElementById('create-game-popup');
const btnCreateGame     = document.getElementById('btn-create-game');
const cgCancel          = document.getElementById('cg-cancel');
const cgCreate          = document.getElementById('cg-create');
const cgVillageName     = document.getElementById('cg-village-name');
const cgMaxPlayers      = document.getElementById('cg-max-players');
const cgType            = document.getElementById('cg-type');
const cgCodeWrapper     = document.getElementById('cg-code-wrapper');
const cgCode            = document.getElementById('cg-code');
const cgShowCode        = document.getElementById('cg-show-code');
const cgShowLink        = document.getElementById('cg-show-link');

const glShareBar        = document.getElementById('gl-share-bar');
const glShareCodeWrap   = document.getElementById('gl-share-code-wrapper');
const glShareCode       = document.getElementById('gl-share-code');
const glCopyCode        = document.getElementById('gl-copy-code');
const glShareLinkWrap   = document.getElementById('gl-share-link-wrapper');
const glCopyLink        = document.getElementById('gl-copy-link');

const btnBackGameLobby  = document.getElementById('btn-back-game-lobby');
const btnLeaveGame      = document.getElementById('btn-leave-game');
const btnInviteGame     = document.getElementById('btn-invite-game');
const glVillageName     = document.getElementById('gl-village-name');
const glPlayersCount    = document.getElementById('gl-players-count');
const enterCodePopup = document.getElementById('enter-code-popup');
const ecCode         = document.getElementById('ec-code');
const ecCancel       = document.getElementById('ec-cancel');
const ecJoin         = document.getElementById('ec-join');
let pendingPrivateGameId = null;

let currentGameId = null;
let currentGameData = null;
let gameUnsubscribe = null;
let currentPlayerSlots = {};

// ─── Positions pour PC (ancien système en arc) ───
const POSITIONS_16_PC = [
  { x: 22, y: 81 }, { x: 30, y: 78 }, { x: 38, y: 76 }, { x: 46, y: 75 },
  { x: 54, y: 75 }, { x: 62, y: 76 }, { x: 70, y: 78 }, { x: 78, y: 81 },
  { x: 18, y: 103 }, { x: 27, y: 99 }, { x: 36, y: 97 }, { x: 45, y: 96 },
  { x: 55, y: 96 }, { x: 64, y: 97 }, { x: 73, y: 99 }, { x: 82, y: 103 },
];

// ─── Positions pour MOBILE (2 rangées de 8, dans l'herbe) ───
const POSITIONS_16_MOBILE = [
  // Rangée 1 (y = 38%)
  { x: 8,  y: 38 }, { x: 20, y: 38 }, { x: 32, y: 38 }, { x: 44, y: 38 },
  { x: 56, y: 38 }, { x: 68, y: 38 }, { x: 80, y: 38 }, { x: 92, y: 38 },
  // Rangée 2 (y = 58%)
  { x: 8,  y: 58 }, { x: 20, y: 58 }, { x: 32, y: 58 }, { x: 44, y: 58 },
  { x: 56, y: 58 }, { x: 68, y: 58 }, { x: 80, y: 58 }, { x: 92, y: 58 },
];

safeOn(cgType, 'change', () => {
  if (!cgCodeWrapper) return;
  if (cgType.value === 'private') {
    cgCodeWrapper.classList.remove('hidden');
  } else {
    cgCodeWrapper.classList.add('hidden');
    if (cgCode) cgCode.value = '';
  }
});

safeOn(btnCreateGame, 'click', () => {
  if (!createGamePopup) return;
  createGamePopup.classList.remove('hidden');
  if (cgVillageName) {
    cgVillageName.value = '';
    cgVillageName.focus();
  }
  if (cgCode) cgCode.value = '';
  if (cgCodeWrapper) cgCodeWrapper.classList.add('hidden');
});

safeOn(cgCancel, 'click', () => {
  if (createGamePopup) createGamePopup.classList.add('hidden');
});

safeOn(ecCancel, 'click', () => {
  if (enterCodePopup) enterCodePopup.classList.add('hidden');
  pendingPrivateGameId = null;
});

safeOn(ecJoin, 'click', async () => {
  const code = ecCode?.value.trim();
  if (!code) {
    showMessage('❌ Entre un code.');
    return;
  }

  if (!pendingPrivateGameId) {
    showMessage('❌ Erreur : partie inconnue.');
    return;
  }

  const { doc, getDoc } = await getFirestoreFns();

  try {
    const gameDoc = await getDoc(doc(window.firebaseDB, 'games', pendingPrivateGameId));
    if (!gameDoc.exists()) {
      showMessage('❌ Partie introuvable.');
      if (enterCodePopup) enterCodePopup.classList.add('hidden');
      return;
    }

    const data = gameDoc.data();
    if (data.code !== code) {
      showMessage('❌ Code incorrect.');
      return;
    }

    if (enterCodePopup) enterCodePopup.classList.add('hidden');
    const gameId = pendingPrivateGameId;
    pendingPrivateGameId = null;
    await joinGame(gameId);

  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
});

safeOn(ecCode, 'keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    ecJoin?.click();
  }
});

safeOn(cgCreate, 'click', async () => {
  const villageName = cgVillageName?.value.trim();
  const maxPlayers = parseInt(cgMaxPlayers?.value, 10);
  const type = cgType?.value;
  const code = cgCode?.value.trim() || '';
  const showCode = cgShowCode?.checked ?? true;
  const showLink = cgShowLink?.checked ?? true;

  if (!villageName) {
    showMessage('❌ Donne un nom au village.');
    return;
  }

  if (type === 'private') {
    if (!code) {
      showMessage('❌ Donne un code à la partie.');
      return;
    }
    if (code.length < 1 || code.length > 6) {
      showMessage('❌ Le code doit faire 1 à 6 caractères.');
      return;
    }
    if (code.includes(' ')) {
      showMessage('❌ Le code ne peut pas contenir d\'espaces.');
      return;
    }
  }

  const user = window.firebaseAuth?.currentUser;
  if (!user) {
    showMessage('❌ Tu dois être connecté.');
    return;
  }

  const { collection, addDoc, serverTimestamp } = await getFirestoreFns();

  try {
    const gameRef = await addDoc(collection(window.firebaseDB, 'games'), {
      villageName: villageName,
      maxPlayers: maxPlayers,
      type: type,
      code: type === 'private' ? code : '',
      showCode: showCode,
      showLink: showLink,
      hostId: user.uid,
      hostPseudo: user.displayName,
      players: [user.uid],
      playersPseudo: [user.displayName],
      playerSlots: { [user.uid]: 0 },
      joinedOrder: [user.uid],
      createdAt: serverTimestamp(),
      status: 'waiting',
      messages: [],
      composition: [],
      compositionValidee: false,
      positionsSeed: Math.floor(Math.random() * 100000),
    });

    currentGameId = gameRef.id;
    updatePresence('waiting', currentGameId);
    showMessage('✅ Partie créée !');

    if (createGamePopup) createGamePopup.classList.add('hidden');
    goToScreen(gameLobbyScreen);

    watchGame(currentGameId);

  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
});

function checkGameLink() {
  const params = new URLSearchParams(window.location.search);
  const urlGameId = params.get('game');

  if (urlGameId) {
    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.setItem('pendingGameId', urlGameId);
  }

  const pendingGameId = sessionStorage.getItem('pendingGameId');

  if (pendingGameId) {
    const user = window.firebaseAuth?.currentUser;
    if (user) {
      sessionStorage.removeItem('pendingGameId');
      setTimeout(() => joinGame(pendingGameId), 500);
    }
  }
}

setTimeout(checkGameLink, 1200);

async function joinGame(gameId) {
  const user = window.firebaseAuth?.currentUser;
  if (!user) {
    showMessage('❌ Connecte-toi d\'abord.');
    return;
  }

  const { doc, getDoc, updateDoc, arrayUnion } = await getFirestoreFns();

  try {
    const gameDoc = await getDoc(doc(window.firebaseDB, 'games', gameId));
    if (!gameDoc.exists()) {
      showMessage('❌ Partie introuvable.');
      return;
    }

    const data = gameDoc.data();

    if (data.players.includes(user.uid)) {
      currentGameId = gameId;
      updatePresence('waiting', gameId);
      goToScreen(gameLobbyScreen);
      watchGame(gameId);
      return;
    }

    if (data.players.length >= data.maxPlayers) {
      showMessage('❌ Partie complète.');
      return;
    }

    if (data.status !== 'waiting') {
      showMessage('❌ Partie déjà lancée.');
      return;
    }

    const used = new Set(Object.values(data.playerSlots || {}));
    let freeSlot = 0;
    while (used.has(freeSlot)) freeSlot++;

    await updateDoc(doc(window.firebaseDB, 'games', gameId), {
      players: arrayUnion(user.uid),
      playersPseudo: arrayUnion(user.displayName),
      joinedOrder: arrayUnion(user.uid),
      [`playerSlots.${user.uid}`]: freeSlot,
    });

    currentGameId = gameId;
    updatePresence('waiting', gameId);
    showMessage('✅ Tu as rejoint la partie !');
    goToScreen(gameLobbyScreen);
    watchGame(gameId);

  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

async function watchGame(gameId) {
  const { doc, onSnapshot } = await getFirestoreFns();

  if (gameUnsubscribe) {
    gameUnsubscribe();
    gameUnsubscribe = null;
  }

  gameUnsubscribe = onSnapshot(doc(window.firebaseDB, 'games', gameId), (snap) => {
    if (!snap.exists()) {
      showMessage('🚪 La partie a été fermée.');
      currentGameId = null;
      currentGameData = null;
      if (gameUnsubscribe) {
        gameUnsubscribe();
        gameUnsubscribe = null;
      }
      updatePresence('online', null);
      goToScreen(publicGamesScreen);
      return;
    }

    const data = snap.data();
    currentGameData = data;
    currentPlayerSlots = data.playerSlots || {};

    if (data.status === 'waiting') updatePresence('waiting', gameId);
    if (data.status === 'playing') updatePresence('playing', gameId);

    renderGameLobby(data);
  });
}

function renderGameLobby(data) {
  if (glVillageName) glVillageName.textContent = data.villageName || 'Village';
  if (glPlayersCount) glPlayersCount.textContent = `👥 ${data.players.length}/${data.maxPlayers}`;

  renderShareBar(data);

  const playersData = data.players.map((uid, i) => ({
    uid,
    pseudo: data.playersPseudo[i],
  }));
  updatePlayersSlots(data.maxPlayers, playersData, data.playerSlots || {});

  renderChat(data.messages || []);

  if (typeof majBoutonLancer === 'function') majBoutonLancer();
  if (typeof majBoutonsMaxPlayers === 'function') majBoutonsMaxPlayers();
}

function renderShareBar(data) {
  if (!glShareBar) return;

  const isPrivate = data.type === 'private';
  const showCode = isPrivate && data.showCode && data.code;
  const showLink = data.showLink;

  if (!showCode && !showLink) {
    glShareBar.classList.add('hidden');
    if (btnInviteGame) btnInviteGame.classList.add('hidden');
    return;
  }

  glShareBar.classList.remove('hidden');

  if (showCode && glShareCodeWrap && glShareCode) {
    glShareCodeWrap.classList.remove('hidden');
    glShareCode.textContent = data.code;
  } else if (glShareCodeWrap) {
    glShareCodeWrap.classList.add('hidden');
  }

  if (showLink && glShareLinkWrap) {
    glShareLinkWrap.classList.remove('hidden');
  } else if (glShareLinkWrap) {
    glShareLinkWrap.classList.add('hidden');
  }

  if (btnInviteGame) {
    if (showCode || showLink) {
      btnInviteGame.classList.remove('hidden');
    } else {
      btnInviteGame.classList.add('hidden');
    }
  }
}

safeOn(glCopyCode, 'click', async () => {
  if (!currentGameData?.code) return;
  try {
    await navigator.clipboard.writeText(currentGameData.code);
    showMessage('🔑 Code copié : ' + currentGameData.code);
  } catch {
    showMessage('❌ Impossible de copier');
  }
});

safeOn(glCopyLink, 'click', async () => {
  if (!currentGameId) return;
  const link = `${window.location.origin}/?game=${currentGameId}`;
  try {
    await navigator.clipboard.writeText(link);
    showMessage('🔗 Lien copié !');
  } catch {
    showMessage('❌ Impossible de copier');
  }
});

safeOn(btnInviteGame, 'click', async () => {
  if (!currentGameData) return;
  const link = `${window.location.origin}/?game=${currentGameId}`;
  const code = currentGameData.code;

  const parts = [];
  if (currentGameData.showLink) parts.push(link);
  if (currentGameData.type === 'private' && currentGameData.showCode && code) {
    parts.push('Code : ' + code);
  }

  try {
    await navigator.clipboard.writeText(parts.join('\n'));
    showMessage('📋 Copié !');
  } catch {
    showMessage('❌ Impossible de copier');
  }
});

function updatePlayersSlots(maxPlayers, playersData, playerSlots) {
  const user = window.firebaseAuth?.currentUser;
  const currentUid = user?.uid;

  const slotsContainer = document.getElementById('gl-players-slots');
  if (!slotsContainer) return;
  slotsContainer.innerHTML = '';

  const CHARACTER_IMG = 'https://i.postimg.cc/1z7KrFfP/images-4-removebg-preview.png';

  const isMobile = document.body.classList.contains('is-mobile');
  const positionsBase = isMobile ? POSITIONS_16_MOBILE : POSITIONS_16_PC;

  const seed = currentGameData?.positionsSeed || 0;
  const positionsMelangees = melangerAvecSeed([...positionsBase], seed);

  const slotOccupants = {};
  playersData.forEach((p) => {
    const idx = playerSlots[p.uid];
    if (idx !== undefined) slotOccupants[idx] = p;
  });

  const hostUid = currentGameData?.hostId;

  for (let i = 0; i < maxPlayers; i++) {
    const pos = positionsMelangees[i];
    if (!pos) continue;

    const slot = document.createElement('div');
    slot.className = 'gl-slot';
    slot.style.left = pos.x + '%';
    slot.style.top  = pos.y + '%';

    const occupant = slotOccupants[i];

    if (occupant) {
      const isMe = occupant.uid === currentUid;
      const isHost = occupant.uid === hostUid;

      slot.classList.add('occupied');
      if (isMe) slot.classList.add('me');
      if (isHost) slot.classList.add('host');

      slot.innerHTML = `
        <div class="gl-slot-avatar">
          <img src="${occupant.avatar || CHARACTER_IMG}" alt="${occupant.pseudo}" />
        </div>
        <div class="gl-slot-pseudo">${occupant.pseudo}${isMe ? ' (toi)' : ''}</div>
      `;
    } else {
      slot.classList.add('empty');
      slot.innerHTML = `
        <div class="gl-slot-avatar">
          <img src="${CHARACTER_IMG}" alt="" />
        </div>
        <div class="gl-slot-pseudo"></div>
      `;
    }

    slot.addEventListener('click', () => {
      if (occupant && occupant.uid === currentUid) return;
      moveMyCharacterToSlot(i);
    });

    slotsContainer.appendChild(slot);
  }
}

function melangerAvecSeed(array, seed) {
  const copie = [...array];
  let s = seed || 1;

  function random() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }

  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }

  return copie;
}

async function moveMyCharacterToSlot(targetSlotIndex) {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;
  if (!currentGameId) return;

  const { doc, updateDoc } = await getFirestoreFns();
  const playerSlots = { ...currentPlayerSlots };
  const myCurrentSlot = playerSlots[user.uid];

  if (myCurrentSlot === targetSlotIndex) return;

  let otherUid = null;
  for (const [uid, slot] of Object.entries(playerSlots)) {
    if (slot === targetSlotIndex && uid !== user.uid) {
      otherUid = uid;
      break;
    }
  }

  const newSlots = { ...playerSlots };

  if (otherUid) {
    newSlots[user.uid] = targetSlotIndex;
    newSlots[otherUid] = myCurrentSlot;
  } else {
    newSlots[user.uid] = targetSlotIndex;
  }

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      playerSlots: newSlots,
    });
    showMessage('✅ Tu as changé de place');
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

const glChatMessages = document.getElementById('gl-chat-messages');
const glChatInput    = document.getElementById('gl-chat-input');
const glChatSend     = document.getElementById('gl-chat-send');

function renderChat(messages) {
  if (!glChatMessages) return;

  const wasAtBottom =
    glChatMessages.scrollHeight - glChatMessages.scrollTop - glChatMessages.clientHeight < 40;

  glChatMessages.innerHTML = messages.map(m => `
    <div class="gl-chat-msg">
      <span class="gl-chat-author">${m.pseudo} :</span>${m.text}
    </div>
  `).join('');

  if (wasAtBottom) {
    glChatMessages.scrollTop = glChatMessages.scrollHeight;
  }
}

async function sendChatMessage() {
  const text = glChatInput?.value.trim();
  if (!text) return;
  if (!currentGameId) return;

  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  const { doc, updateDoc, arrayUnion } = await getFirestoreFns();

  glChatInput.value = '';

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      messages: arrayUnion({
        uid: user.uid,
        pseudo: user.displayName,
        text: text,
        at: Date.now(),
      }),
    });
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

safeOn(glChatSend, 'click', sendChatMessage);
safeOn(glChatInput, 'keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChatMessage();
  }
});

let publicGamesUnsubscribe = null;
let privateGamesUnsubscribe = null;

async function loadGames() {
  if (!gamesList) return;

  const { collection, onSnapshot, query, where } = await getFirestoreFns();

  if (publicGamesUnsubscribe) {
    publicGamesUnsubscribe();
    publicGamesUnsubscribe = null;
  }
  if (privateGamesUnsubscribe) {
    privateGamesUnsubscribe();
    privateGamesUnsubscribe = null;
  }

  const typeFilter = currentGamesTab === 'public' ? 'public' : 'private';

  const q = query(
    collection(window.firebaseDB, 'games'),
    where('type', '==', typeFilter),
    where('status', '==', 'waiting')
  );

  const handler = (snap) => {
    const games = [];
    const now = Date.now();
    const MAX_AGE_MS = 2 * 60 * 60 * 1000;

    snap.forEach(d => {
      const data = d.data();

      if (!data.players || data.players.length === 0) return;

      const createdAt = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : now;
      if (now - createdAt > MAX_AGE_MS) return;

      if (data.status && data.status !== 'waiting') return;

      games.push({ id: d.id, ...data });
    });

    games.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });

    renderGames(games);
  };

  if (typeFilter === 'public') {
    publicGamesUnsubscribe = onSnapshot(q, handler);
  } else {
    privateGamesUnsubscribe = onSnapshot(q, handler);
  }
}

function loadPublicGames() {
  loadGames();
}

function renderGames(games) {
  if (!gamesList) return;

  const isPrivateTab = currentGamesTab === 'private';

  if (games.length === 0) {
    gamesList.innerHTML = isPrivateTab
      ? '<p class="games-empty">Aucune partie privée disponible...</p>'
      : '<p class="games-empty">Aucune partie publique disponible...</p>';
    return;
  }

  gamesList.innerHTML = games.map(g => {
    const count = g.players.length;
    const max = g.maxPlayers;
    const ratio = count / max;

    let statusClass = 'status-purple';
    let label = '';

    if (count >= max) {
      statusClass = 'status-red';
      label = '🔴 Complète';
    } else if (ratio > 1/4) {
      statusClass = 'status-blue';
      label = '🔵 Rejoignable';
    } else {
      statusClass = 'status-purple';
      label = '🟣 Presque vide';
    }

    const badge = isPrivateTab ? '<span class="game-card-badge">🔒 Privée</span>' : '';

    return `
      <div class="game-card ${statusClass}" data-gameid="${g.id}" ${count >= max ? 'data-full="true"' : ''}>
        ${badge}
        <div class="game-card-header">🏘️ ${g.villageName || 'Village sans nom'}</div>
        <div class="game-card-infos">
          <span>👥 ${count}/${max}</span>
          <span>👑 ${g.hostPseudo || '?'}</span>
          <span>${label}</span>
        </div>
        <button class="game-card-join" ${count >= max ? 'disabled' : ''}>Rejoindre</button>
      </div>
    `;
  }).join('');

  gamesList.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.full === 'true') return;
      const gameId = card.dataset.gameid;

      if (isPrivateTab) {
        pendingPrivateGameId = gameId;
        if (enterCodePopup) {
          enterCodePopup.classList.remove('hidden');
          if (ecCode) {
            ecCode.value = '';
            ecCode.focus();
          }
        }
      } else {
        joinGame(gameId);
      }
    });
  });
}

async function leaveGame() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) {
    goToScreen(publicGamesScreen);
    return;
  }

  if (!currentGameId) {
    goToScreen(publicGamesScreen);
    return;
  }

  const { doc, getDoc, updateDoc, deleteDoc, arrayRemove } = await getFirestoreFns();

  try {
    const gameDoc = await getDoc(doc(window.firebaseDB, 'games', currentGameId));

    if (gameDoc.exists()) {
      const data = gameDoc.data();
      const remainingPlayers = data.players.filter(id => id !== user.uid);

      if (remainingPlayers.length === 0) {
        await deleteDoc(doc(window.firebaseDB, 'games', currentGameId));
        showMessage('🚪 Partie fermée');
      } else {
        const newHostId = remainingPlayers[0];
        const newHostPseudo = data.playersPseudo[data.players.indexOf(newHostId)] || '?';

        const updates = {
          players: arrayRemove(user.uid),
          playersPseudo: arrayRemove(user.displayName),
          joinedOrder: arrayRemove(user.uid),
          [`playerSlots.${user.uid}`]: null,
        };

        if (data.hostId === user.uid) {
          updates.hostId = newHostId;
          updates.hostPseudo = newHostPseudo;
        }

        await updateDoc(doc(window.firebaseDB, 'games', currentGameId), updates);
        showMessage('🚪 Tu as quitté la partie');
      }
    }

    if (gameUnsubscribe) {
      gameUnsubscribe();
      gameUnsubscribe = null;
    }

    updatePresence('online', null);
    currentGameId = null;
    currentGameData = null;
    goToScreen(publicGamesScreen);

  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

safeOn(btnLeaveGame, 'click', leaveGame);
safeOn(btnBackGameLobby, 'click', leaveGame);

// ═══════════════════════════════════════════════════════════
// 🎯 COMPOSITION + LANCEMENT
// ═══════════════════════════════════════════════════════════

const compositionPopup   = document.getElementById('composition-popup');
const compClose          = document.getElementById('comp-close');
const compValidate       = document.getElementById('comp-validate');
const compSelected       = document.getElementById('comp-selected');
const compCountCurrent   = document.getElementById('comp-count-current');
const compCountMax       = document.getElementById('comp-count-max');
const compGridBase       = document.getElementById('comp-grid-base');
const compGridVariants   = document.getElementById('comp-grid-variants');
const compGridNightmares = document.getElementById('comp-grid-nightmares');
const btnStartGame       = document.getElementById('btn-start-game');
const btnComposition     = document.getElementById('btn-composition');
const compAdjointOption  = document.getElementById('comp-adjoint-option');

let compositionLocale = [];

safeOn(btnComposition, 'click', () => {
  const user = window.firebaseAuth?.currentUser;
  if (!user || !currentGameData) return;

  if (currentGameData.hostId !== user.uid) {
    showMessage('❌ Seul l\'hôte peut modifier la composition.');
    return;
  }

  if (!currentGameData.composition || currentGameData.composition.length === 0) {
    const preset = COMPOS_PREDEFINIES[currentGameData.maxPlayers] || [];
    compositionLocale = [...preset];
  } else {
    compositionLocale = currentGameData.composition;
  }

  const sec = currentGameData.secondaires || {};
  choixAnge = sec.ange || 'none';
  choixMaire = sec.maire || 'none';
  choixAdjoint = sec.adjoint || 'non';

  document.querySelectorAll('.comp-radio-group').forEach(group => {
    const option = group.dataset.option;
    group.querySelectorAll('.comp-radio').forEach(b => b.classList.remove('active'));

    let val = 'none';
    if (option === 'ange') val = choixAnge;
    if (option === 'maire') val = choixMaire;
    if (option === 'adjoint') val = choixAdjoint;

    const activeBtn = group.querySelector(`[data-value="${val}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  });

  if (compAdjointOption) {
    compAdjointOption.style.display = (choixMaire === 'maire-2-0') ? 'flex' : 'none';
  }

  if (compCountMax) compCountMax.textContent = currentGameData.maxPlayers;

  renderCompositionPopup();
  if (compositionPopup) compositionPopup.classList.remove('hidden');
});

safeOn(compClose, 'click', () => {
  if (compositionPopup) compositionPopup.classList.add('hidden');
});

function renderCompositionPopup() {
  const max = currentGameData?.maxPlayers || 8;

  if (compCountCurrent) compCountCurrent.textContent = compositionLocale.length;
  if (compCountMax) compCountMax.textContent = max;

  renderSelectedChips();
  renderRoleGrid(compGridBase, ROLES_BASE);
  renderRoleGrid(compGridVariants, ROLES_VARIANTES);
  renderRoleGrid(compGridNightmares, ROLES_NIGHTMARES);
}

function renderSelectedChips() {
  if (!compSelected) return;

  if (compositionLocale.length === 0) {
    compSelected.innerHTML = '<p class="comp-empty-selected">Aucun rôle sélectionné pour le moment.</p>';
    return;
  }

  const counts = {};
  compositionLocale.forEach(id => {
    counts[id] = (counts[id] || 0) + 1;
  });

  let html = '';
  for (const [id, count] of Object.entries(counts)) {
    const role = getRoleById(id);
    if (!role) continue;

    html += `
      <div class="comp-selected-chip" data-roleid="${id}" title="${role.nom} (cliquer pour retirer)">
        <div class="chip-icon role-icon-${role.id}"></div>
        ${count > 1 ? `<span class="chip-count">×${count}</span>` : ''}
      </div>
    `;
  }

  compSelected.innerHTML = html;

  compSelected.querySelectorAll('.comp-selected-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.roleid;
      retirerRoleDeComposition(id);
    });
  });
}

function renderRoleGrid(container, roles) {
  if (!container) return;

  container.innerHTML = roles.map(role => {
    const count = compositionLocale.filter(id => id === role.id).length;
    return `
      <div class="comp-role" data-roleid="${role.id}">
        <div class="comp-role-icon role-icon-${role.id}">
          <span class="comp-role-help" title="${role.description}">?</span>
        </div>
        ${count > 0 ? `<span class="comp-role-count" data-roleid="${role.id}">×${count}</span>` : ''}
        <button class="comp-role-add" data-roleid="${role.id}">+</button>
        <div class="comp-role-name">${role.nom}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.comp-role-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      ajouterRoleAComposition(btn.dataset.roleid);
    });
  });
}

async function ajouterRoleAComposition(roleId) {
  const role = getRoleById(roleId);
  if (!role) return;

  if (compositionLocale.length >= 16) {
    showMessage('❌ Maximum 16 joueurs.');
    return;
  }

  if (role.estUnique && compositionLocale.includes(roleId)) {
    showMessage(`❌ ${role.nom} est unique, tu ne peux pas l'ajouter 2 fois.`);
    return;
  }

  compositionLocale.push(roleId);
  await majMaxPlayers(compositionLocale.length);
  renderCompositionPopup();
}

async function retirerRoleDeComposition(roleId) {
  const index = compositionLocale.lastIndexOf(roleId);
  if (index === -1) return;

  const nouvelleTaille = compositionLocale.length - 1;

  if (nouvelleTaille < 5) {
    showMessage('❌ Minimum 5 joueurs.');
    return;
  }

  const joueursActuels = currentGameData?.players?.length || 1;
  if (nouvelleTaille < joueursActuels) {
    showMessage(`❌ Impossible de retirer : il y a déjà ${joueursActuels} joueur(s) dans la partie.`);
    return;
  }

  compositionLocale.splice(index, 1);
  await majMaxPlayers(compositionLocale.length);
  renderCompositionPopup();
}

async function majMaxPlayers(nouveauMax) {
  if (!currentGameId) return;

  const { doc, updateDoc } = await getFirestoreFns();

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      maxPlayers: nouveauMax,
      composition: compositionLocale,
      compositionValidee: false,
    });
  } catch (err) {
    console.warn('Erreur majMaxPlayers:', err);
  }
}

safeOn(compValidate, 'click', async () => {
  if (compositionLocale.length < 5) {
    showMessage('❌ Il faut au moins 5 rôles.');
    return;
  }

  const { doc, updateDoc } = await getFirestoreFns();

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      composition: compositionLocale,
      maxPlayers: compositionLocale.length,
      compositionValidee: true,
      secondaires: {
        ange: choixAnge,
        maire: choixMaire,
        adjoint: choixMaire === 'maire-2-0' ? choixAdjoint : 'non',
      },
    });

    showMessage('✅ Composition validée !');
    if (compositionPopup) compositionPopup.classList.add('hidden');
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
});

function majBoutonLancer() {
  if (!btnStartGame || !currentGameData) return;

  const user = window.firebaseAuth?.currentUser;
  const isHost = user && currentGameData.hostId === user.uid;
  const compoValidee = currentGameData.compositionValidee === true;
  const joueursPleins = currentGameData.players.length === currentGameData.maxPlayers;

  if (isHost && compoValidee) {
    btnStartGame.classList.remove('hidden');
    btnStartGame.disabled = !joueursPleins;
    btnStartGame.textContent = joueursPleins
      ? '▶️ Lancer la partie'
      : `⏳ En attente (${currentGameData.players.length}/${currentGameData.maxPlayers})`;
  } else {
    btnStartGame.classList.add('hidden');
  }
}

async function lancerPartie() {
  const user = window.firebaseAuth?.currentUser;
  if (!user || !currentGameData) return;
  if (currentGameData.hostId !== user.uid) return;

  if (!currentGameData.composition || currentGameData.composition.length === 0) {
    showMessage('❌ La composition n\'est pas validée.');
    return;
  }
  if (currentGameData.players.length !== currentGameData.maxPlayers) {
    showMessage('❌ La partie n\'est pas complète.');
    return;
  }

  const rolesMelanges = [...currentGameData.composition];
  for (let i = rolesMelanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesMelanges[i], rolesMelanges[j]] = [rolesMelanges[j], rolesMelanges[i]];
  }

  const joueurs = currentGameData.players;
  const rolesJoueurs = {};
  joueurs.forEach((uid, index) => {
    rolesJoueurs[uid] = rolesMelanges[index];
  });

  const { doc, updateDoc } = await getFirestoreFns();

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      status: 'playing',
      phase: 'avant-crepuscule',
      tour: 1,
      rolesJoueurs: rolesJoueurs,
      joueursVivants: joueurs,
      joueursMorts: [],
      startedAt: Date.now(),
    });

    showMessage('🎮 La partie commence !');
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

safeOn(btnStartGame, 'click', lancerPartie);

// ═══════════════════════════════════════════════════════════
// 🎯 RÔLES SECONDAIRES - Boutons radio
// ═══════════════════════════════════════════════════════════

document.querySelectorAll('.comp-radio-group').forEach(group => {
  const option = group.dataset.option;

  group.querySelectorAll('.comp-radio').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.comp-radio').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const value = btn.dataset.value;

      if (option === 'ange') {
        choixAnge = value;
      } else if (option === 'maire') {
        choixMaire = value;
        if (value === 'maire-2-0') {
          if (compAdjointOption) compAdjointOption.style.display = 'flex';
        } else {
          if (compAdjointOption) compAdjointOption.style.display = 'none';
          choixAdjoint = 'non';
          const adjointGroup = document.querySelector('[data-option="adjoint"]');
          if (adjointGroup) {
            adjointGroup.querySelectorAll('.comp-radio').forEach(b => b.classList.remove('active'));
            adjointGroup.querySelector('[data-value="non"]')?.classList.add('active');
          }
        }
      } else if (option === 'adjoint') {
        choixAdjoint = value;
      }
    });
  });

  const noneBtn = group.querySelector('[data-value="none"]')
              || group.querySelector('[data-value="non"]');
  if (noneBtn) noneBtn.classList.add('active');
});

// ═══════════════════════════════════════════════════════════
// ➕➖ CHANGER LE NOMBRE DE JOUEURS
// ═══════════════════════════════════════════════════════════

const btnMinusPlayers = document.getElementById('btn-minus-players');
const btnPlusPlayers  = document.getElementById('btn-plus-players');

safeOn(btnMinusPlayers, 'click', () => changerMaxPlayers(-1));
safeOn(btnPlusPlayers,  'click', () => changerMaxPlayers(+1));

async function changerMaxPlayers(delta) {
  const user = window.firebaseAuth?.currentUser;
  if (!user || !currentGameData) return;

  if (currentGameData.hostId !== user.uid) {
    showMessage('❌ Seul l\'hôte peut modifier le nombre de joueurs.');
    return;
  }

  const nouveauMax = currentGameData.maxPlayers + delta;

  if (nouveauMax < 5) {
    showMessage('❌ Minimum 5 joueurs.');
    return;
  }
  if (nouveauMax > 16) {
    showMessage('❌ Maximum 16 joueurs.');
    return;
  }

  if (nouveauMax < currentGameData.players.length) {
    showMessage('❌ Il y a déjà ' + currentGameData.players.length + ' joueurs dans la partie.');
    return;
  }

  const { doc, updateDoc } = await getFirestoreFns();

  try {
    const nouvelleCompo = COMPOS_PREDEFINIES[nouveauMax] || [];

    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      maxPlayers: nouveauMax,
      composition: nouvelleCompo,
      compositionValidee: false,
    });

    showMessage('✅ Nombre de joueurs : ' + nouveauMax);
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

function majBoutonsMaxPlayers() {
  if (!btnMinusPlayers || !btnPlusPlayers || !currentGameData) return;

  const user = window.firebaseAuth?.currentUser;
  const isHost = user && currentGameData.hostId === user.uid;
  const partieEnAttente = currentGameData.status === 'waiting';

  if (isHost && partieEnAttente) {
    btnMinusPlayers.classList.remove('hidden');
    btnPlusPlayers.classList.remove('hidden');
  } else {
    btnMinusPlayers.classList.add('hidden');
    btnPlusPlayers.classList.add('hidden');
  }
}
// ═══════════════════════════════════════════════════════════
// 💬 MOBILE : Bulle chat + Chat plein écran
// ═══════════════════════════════════════════════════════════

const mobileChatBubble   = document.getElementById('mobile-chat-bubble');
const mobileChatOverlay  = document.getElementById('mobile-chat-overlay');
const mobileChatClose    = document.getElementById('mobile-chat-close');
const mobileChatMessages = document.getElementById('mobile-chat-messages');
const mobileChatInput    = document.getElementById('mobile-chat-input');
const mobileChatSend     = document.getElementById('mobile-chat-send');
const mobileChatVillage  = document.getElementById('mobile-chat-village');
const mobileChatCount    = document.getElementById('mobile-chat-count');
const mobileBtnMinus     = document.getElementById('mobile-btn-minus');
const mobileBtnPlus      = document.getElementById('mobile-btn-plus');
const mobileChatComp     = document.getElementById('mobile-chat-comp');

function openMobileChat() {
  if (!mobileChatOverlay) return;
  document.body.classList.add('chat-open');
  mobileChatOverlay.classList.remove('hidden');
  renderMobileChat();
  setTimeout(() => mobileChatInput?.focus(), 100);
}

function closeMobileChat() {
  if (!mobileChatOverlay) return;
  document.body.classList.remove('chat-open');
  mobileChatOverlay.classList.add('hidden');
}

function renderMobileChat() {
  if (!currentGameData) return;

  if (mobileChatVillage) {
    mobileChatVillage.textContent = currentGameData.villageName || 'Village';
  }
  if (mobileChatCount) {
    mobileChatCount.textContent = `👥 ${currentGameData.players.length}/${currentGameData.maxPlayers}`;
  }

  if (mobileChatMessages) {
    const messages = currentGameData.messages || [];
    mobileChatMessages.innerHTML = messages.map(m => `
      <div class="gl-chat-msg">
        <span class="gl-chat-author">${m.pseudo} :</span>${m.text}
      </div>
    `).join('');
    mobileChatMessages.scrollTop = mobileChatMessages.scrollHeight;
  }
}

// Bulle → ouvre le chat
safeOn(mobileChatBubble, 'click', openMobileChat);

// ✖ → ferme
safeOn(mobileChatClose, 'click', closeMobileChat);

// Envoi de message (réutilise la logique existante)
async function sendMobileChatMessage() {
  const text = mobileChatInput?.value.trim();
  if (!text) return;
  if (!currentGameId) return;

  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  const { doc, updateDoc, arrayUnion } = await getFirestoreFns();

  mobileChatInput.value = '';

  try {
    await updateDoc(doc(window.firebaseDB, 'games', currentGameId), {
      messages: arrayUnion({
        uid: user.uid,
        pseudo: user.displayName,
        text: text,
        at: Date.now(),
      }),
    });
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

safeOn(mobileChatSend, 'click', sendMobileChatMessage);
safeOn(mobileChatInput, 'keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMobileChatMessage();
  }
});

// Boutons +/− (réutilisent changerMaxPlayers)
safeOn(mobileBtnMinus, 'click', () => changerMaxPlayers(-1));
safeOn(mobileBtnPlus,  'click', () => changerMaxPlayers(+1));

// Composition
safeOn(mobileChatComp, 'click', () => {
  closeMobileChat();
  setTimeout(() => btnComposition?.click(), 150);
});

// ═══════════════════════════════════════════════════════════
// 🔄 Afficher/masquer la bulle selon l'écran actif (mobile)
// ═══════════════════════════════════════════════════════════

function updateMobileBubbleVisibility() {
  if (!mobileChatBubble) return;

  const isMobile = document.body.classList.contains('is-mobile');
  if (!isMobile) return;

  const activeScreen = document.querySelector('.screen:not(.hidden)');
  if (!activeScreen) {
    mobileChatBubble.classList.add('hidden');
    return;
  }

  if (activeScreen.id === 'game-lobby-screen' && currentGameData) {
    mobileChatBubble.classList.remove('hidden');
  } else {
    mobileChatBubble.classList.add('hidden');
    closeMobileChat();
  }
}

// Patch : appeler updateMobileBubbleVisibility quand on change d'écran
const _origGoToScreen = goToScreen;
goToScreen = function(screen) {
  _origGoToScreen(screen);
  updateMobileBubbleVisibility();
};

// Patch : mettre à jour la bulle/chat quand les données du lobby changent
const _origRenderGameLobby = renderGameLobby;
renderGameLobby = function(data) {
  _origRenderGameLobby(data);
  updateMobileBubbleVisibility();
  if (document.body.classList.contains('chat-open')) {
    renderMobileChat();
  }
};