// ===== DEBUG VISUEL =====
window.onerror = function(msg) {
  const el = document.getElementById('debug-message');
  if (el) {
    el.textContent = '❌ ERREUR : ' + msg;
    el.style.display = 'block';
  }
};

function showMessage(text) {
  const el = document.getElementById('debug-message');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 3000);
}

// ===== FLAG ANTI-REDIRECTION =====
let blockAutoRedirect = false;

// ===== RÉCUPÉRATION DES ÉCRANS =====
const introScreen       = document.getElementById('intro-screen');
const authScreen        = document.getElementById('auth-screen');
const modeScreen        = document.getElementById('mode-screen');
const lobbyScreen       = document.getElementById('lobby-screen');
const publicGamesScreen = document.getElementById('public-games-screen');
const friendsScreen     = document.getElementById('friends-screen');
const profileScreen     = document.getElementById('profile-screen');

const btnContinue     = document.getElementById('btn-continue');
const btnBackMode     = document.getElementById('btn-back-mode');
const btnBackGames    = document.getElementById('btn-back-games');
const btnRefreshGames = document.getElementById('btn-refresh-games');
const gamesList       = document.getElementById('games-list');

// ===================== BARRE D'ONGLETS GLOBALE =====================
const globalTabBar  = document.getElementById('global-tab-bar');
const globalTabBtns = globalTabBar.querySelectorAll('.tab-btn');

globalTabBar.classList.add('hidden');

function updateTabBarVisibility() {
  const screensWithTabBar = [
    'lobby-screen',
    'public-games-screen',
    'friends-screen',
    'profile-screen',
  ];

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

// ===== FONCTION POUR CHANGER D'ÉCRAN =====
function goToScreen(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  screen.classList.remove('hidden');
  updateTabBarVisibility();
}

// ===== BRANCHEMENT DES ONGLETS GLOBAUX =====
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
btnContinue.addEventListener('click', () => {
  goToScreen(authScreen);
});

// ===== RETOUR : MODE → AUTH =====
btnBackMode.addEventListener('click', () => {
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
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    } else {
      formLogin.classList.add('hidden');
      formRegister.classList.remove('hidden');
    }
  });
});

// ===== POPUP COMMING SOON =====
const popup = document.getElementById('coming-soon-popup');
const btnPopupBack = document.getElementById('popup-return');

btnPopupBack.addEventListener('click', () => {
  popup.classList.add('hidden');
});

// ===== ATTENDRE FIREBASE =====
async function waitForFirebase() {
  while (!window.firebaseAuth) {
    await new Promise((r) => setTimeout(r, 50));
  }
  return window.firebaseAuth;
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
    } else {
      showMessage('👤 Aucun utilisateur connecté');
    }
  });

  // ===== CONNEXION =====
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

  // ===== INSCRIPTION =====
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

      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');

      await setDoc(doc(window.firebaseDB, 'users', userCredential.user.uid), {
        pseudo: username,
        createdAt: serverTimestamp(),
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

initFirebase();

// ===== MODE NORMAL → LOBBY =====
const normalModeCard = document.querySelector('.mode-card[data-mode="normal"] .mode-play');
if (normalModeCard) {
  normalModeCard.addEventListener('click', () => {
    goToScreen(lobbyScreen);
    const canvas = document.getElementById('shader-canvas-lobby');
    if (canvas) initShaderCanvas(canvas);
  });
}

// ===== MODE BOSS → popup COMMING SOON =====
const bossModeCard = document.querySelector('.mode-card[data-mode="boss"] .mode-play');
if (bossModeCard) {
  bossModeCard.addEventListener('click', () => {
    popup.classList.remove('hidden');
  });
}

// ===== PARTIES : Retour → Lobby =====
btnBackGames.addEventListener('click', () => {
  goToScreen(lobbyScreen);
});

// ===== PARTIES : Rafraîchir =====
btnRefreshGames.addEventListener('click', () => {
  btnRefreshGames.classList.add('spinning');
  setTimeout(() => btnRefreshGames.classList.remove('spinning'), 800);
  loadPublicGames();
});

// ===== CHARGEMENT DES PARTIES =====
async function loadPublicGames() {
  const games = [];

  if (games.length === 0) {
    gamesList.innerHTML = '<p class="games-empty">Aucune partie disponible pour le moment...</p>';
    return;
  }

  gamesList.innerHTML = games.map(g => `
    <div class="game-card">
      <div class="game-card-header">🏘️ ${g.villageName}</div>
      <div class="game-card-infos">
        <span>👥 ${g.players}/${g.maxPlayers} joueurs</span>
        <span>👑 [Hôte] ${g.hostName}</span>
      </div>
      <button class="game-card-join">Rejoindre</button>
    </div>
  `).join('');
}

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

// ===================== ÉCRAN AMIS (FIRESTORE) =====================
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

let firestoreFns = null;
async function getFirestoreFns() {
  if (!firestoreFns) {
    firestoreFns = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');
  }
  return firestoreFns;
}

// ===== Retour =====
btnBackFriends.addEventListener('click', () => {
  goToScreen(lobbyScreen);
});

// ===== Onglets pilules =====
const friendsTabs = document.querySelectorAll('.friends-tab');
friendsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    friendsTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    Object.values(friendsPanels).forEach((p) => p.classList.add('hidden'));
    const target = friendsPanels[tab.dataset.friendsTab];
    if (target) {
      target.classList.remove('hidden');
      loadFriendsTab(tab.dataset.friendsTab);
    }
  });
});

// ===== Charger une section =====
async function loadFriendsTab(tabName) {
  showMessage('🔍 Tab: ' + tabName + ' | User: ' + user.uid.substring(0, 8));
  try {
    const user = window.firebaseAuth?.currentUser;
    if (!user) return;

    const { collection, query, where, getDocs, doc, getDoc } = await getFirestoreFns();

    if (tabName === 'list') {
      const q = query(collection(window.firebaseDB, 'friendships'), where('users', 'array-contains', user.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        friendsPanels.list.innerHTML = '<p class="friends-empty">Aucun ami pour le moment...</p>';
        return;
      }

      let html = '';
      for (const d of snap.docs) {
        const data = d.data();
        const otherId = data.users.find(id => id !== user.uid);
        const otherDoc = await getDoc(doc(window.firebaseDB, 'users', otherId));
        if (otherDoc.exists()) {
          const other = otherDoc.data();
          html += renderFriendCard(otherId, other.pseudo, 'friend');
        }
      }
      friendsPanels.list.innerHTML = html || '<p class="friends-empty">Aucun ami pour le moment...</p>';

    } else if (tabName === 'received') {
      const q = query(collection(window.firebaseDB, 'friendRequests'), where('to', '==', user.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        friendsPanels.received.innerHTML = '<p class="friends-empty">Aucune demande reçue.</p>';
        return;
      }

      let html = '';
      for (const d of snap.docs) {
        const data = d.data();
        html += renderFriendCard(data.from, data.fromPseudo, 'received', d.id);
      }
      friendsPanels.received.innerHTML = html;

    } else if (tabName === 'sent') {
      const q = query(collection(window.firebaseDB, 'friendRequests'), where('from', '==', user.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        friendsPanels.sent.innerHTML = '<p class="friends-empty">Aucune demande envoyée.</p>';
        return;
      }

      let html = '';
      for (const d of snap.docs) {
        const data = d.data();
        html += renderFriendCard(data.to, data.toPseudo, 'sent', d.id);
      }
      friendsPanels.sent.innerHTML = html;

    } else if (tabName === 'suggestions') {
      const snap = await getDocs(collection(window.firebaseDB, 'users'));
      let html = '';
      snap.forEach(d => {
        if (d.id !== user.uid) {
          const data = d.data();
          html += renderFriendCard(d.id, data.pseudo, 'add');
        }
      });
      friendsPanels.suggestions.innerHTML = html || '<p class="friends-empty">Aucune suggestion.</p>';
    }

    attachFriendCardActions();
  } catch (err) {
    showMessage('❌ ' + (err.code || err.message));
  }
}

// ===== Rendu d'une carte =====
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

// ===== Brancher les boutons des cartes =====
function attachFriendCardActions() {
  document.querySelectorAll('.friend-card .action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.friend-card');
      const userId = card.dataset.userid;
      const pseudo = card.dataset.pseudo;
      const requestId = card.dataset.requestid;
      const action = btn.dataset.action;

      const user = window.firebaseAuth?.currentUser;
      if (!user) return;

      const { doc, setDoc, deleteDoc, serverTimestamp } = await getFirestoreFns();

      if (action === 'add') {
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

// ===== Recherche =====
friendsSearch.addEventListener('input', async (e) => {
  const query_text = e.target.value.trim().toLowerCase();

  if (query_text.length < 3) {
    friendsResults.classList.add('hidden');
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

// ===== Copier le lien =====
btnCopyInvite.addEventListener('click', async () => {
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

btnBackProfile.addEventListener('click', () => {
  goToScreen(lobbyScreen);
});

async function openProfile(pseudo, isSelf = false) {
  profilePseudo.textContent = pseudo;

  if (isSelf) {
    profileStatus.innerHTML = '<span class="status-dot online"></span> Toi';
    profileActionBtn.textContent = '✏️ Modifier le profil';
    profileActionBtn.classList.add('friend');

    const currentUser = window.firebaseAuth?.currentUser;
    if (currentUser) {
      const { doc, getDoc } = await getFirestoreFns();

      try {
        const userDoc = await getDoc(doc(window.firebaseDB, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = data.stats || { games: 0, wins: 0, ratio: 0 };

          document.getElementById('stat-games').textContent = stats.games || 0;
          document.getElementById('stat-wins').textContent  = stats.wins || 0;
          document.getElementById('stat-ratio').textContent = (stats.ratio || 0) + ' %';
        }
      } catch (err) {
        showMessage('❌ Erreur de chargement du profil');
      }
    }
  } else {
    profileStatus.innerHTML = '<span class="status-dot online"></span> En ligne';
    profileActionBtn.textContent = '+ Ajouter en ami';
    profileActionBtn.classList.remove('friend');

    document.getElementById('stat-games').textContent = 0;
    document.getElementById('stat-wins').textContent  = 0;
    document.getElementById('stat-ratio').textContent = '0 %';
  }

  goToScreen(profileScreen);
}

profileActionBtn.addEventListener('click', () => {
  if (profileActionBtn.textContent.includes('Ajouter')) {
    showMessage('✅ Demande envoyée à ' + profilePseudo.textContent);
    profileActionBtn.textContent = '⏳ En attente';
    profileActionBtn.classList.add('friend');
  } else if (profileActionBtn.textContent.includes('Modifier')) {
    showMessage('✏️ Fonctionnalité à venir');
  }
});

// ===================== DÉTECTION DU LIEN D'INVITATION =====================
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