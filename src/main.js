// ===== FONCTION DEBUG VISUELLE =====
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
const introScreen = document.getElementById('intro-screen');
const authScreen = document.getElementById('auth-screen');
const modeScreen = document.getElementById('mode-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const publicGamesScreen = document.getElementById('public-games-screen');

const btnContinue = document.getElementById('btn-continue');
const btnBackMode = document.getElementById('btn-back-mode');
const btnBackGames = document.getElementById('btn-back-games');
const btnRefreshGames = document.getElementById('btn-refresh-games');
const gamesList = document.getElementById('games-list');

// ===== FONCTION POUR CHANGER D'ÉCRAN =====
function goToScreen(screen) {
  document
    .querySelectorAll('.screen')
    .forEach((s) => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// ===== INTRO → AUTH =====
btnContinue.addEventListener('click', () => {
  goToScreen(authScreen);
});

// ===== RETOUR : MODE → AUTH (sans déconnexion) =====
btnBackMode.addEventListener('click', () => {
  blockAutoRedirect = true;
  goToScreen(authScreen);
});

// ===== GESTION DES ONGLETS AUTH =====
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

// ===== INITIALISATION =====
async function initFirebase() {
  const auth = await waitForFirebase();
  showMessage('✅ Firebase prêt');

  const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
  } = await import(
    'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'
  );

  // ===== DÉTECTION UTILISATEUR CONNECTÉ =====
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showMessage('👤 Connecté : ' + (user.displayName || user.email));

      if (!blockAutoRedirect) {
        goToScreen(modeScreen);
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        fakeEmail,
        password
      );
      await updateProfile(userCredential.user, { displayName: username });
      showMessage('✅ Inscription réussie ! Pseudo : ' + username);
      goToScreen(modeScreen);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        showMessage('❌ Ce pseudo est déjà pris.');
      } else if (err.code === 'auth/weak-password') {
        showMessage('❌ Mot de passe trop faible (6 car. min).');
      } else {
        showMessage('❌ Erreur : ' + (err.code || err.message));
      }
    }
  });
}

initFirebase();

// ===== MODE NORMAL → LOBBY =====
const normalModeCard = document.querySelector(
  '.mode-card[data-mode="normal"] .mode-play'
);
if (normalModeCard) {
  normalModeCard.addEventListener('click', () => {
    goToScreen(lobbyScreen);
  });
}

// ===== MODE BOSS → popup COMMING SOON =====
const bossModeCard = document.querySelector(
  '.mode-card[data-mode="boss"] .mode-play'
);
if (bossModeCard) {
  bossModeCard.addEventListener('click', () => {
    popup.classList.remove('hidden');
  });
}

// ===== LOBBY : clic sur l'onglet "Jouer" → écran Parties =====
const lobbyPlayTab = lobbyScreen.querySelector('.tab-btn[data-tab="play"]');
if (lobbyPlayTab) {
  lobbyPlayTab.addEventListener('click', () => {
    goToScreen(publicGamesScreen);
    loadPublicGames();
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

// ===== CHARGEMENT DES PARTIES PUBLIQUES =====
async function loadPublicGames() {
  const games = []; // ← plus tard : requête Firestore

  if (games.length === 0) {
    gamesList.innerHTML =
      '<p class="games-empty">Aucune partie disponible pour le moment...</p>';
    return;
  }

  gamesList.innerHTML = games
    .map(
      (g) => `
    <div class="game-card">
      <div class="game-card-header">🏘️ ${g.villageName}</div>
      <div class="game-card-infos">
        <span>👥 ${g.players}/${g.maxPlayers} joueurs</span>
        <span>👑 [Hôte] ${g.hostName}</span>
      </div>
      <button class="game-card-join">Rejoindre</button>
    </div>
  `
    )
    .join('');
}
// ===================== SHADER D'ENTRÉE =====================
const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader : effet brouillard + zoom au clic
const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_progress; // 0 → 1 (progression de l'animation)

  // Bruit pseudo-aléatoire
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

    // Effet de brouillard qui défile
    float fog = noise(uv * 4.0 + u_time * 0.3);
    fog += noise(uv * 8.0 - u_time * 0.2) * 0.5;

    // Progression : le brouillard se dissipe
    float intensity = (1.0 - u_progress) * fog;

    // Couleur du brouillard : bleu nuit + doré
    vec3 fogColor = mix(
      vec3(0.05, 0.05, 0.15),   // bleu nuit
      vec3(0.9, 0.6, 0.2),      // doré
      fog * 0.4
    );

    // Alpha du brouillard : diminue avec la progression
    float alpha = intensity * 0.7;

    gl_FragColor = vec4(fogColor, alpha);
  }
`;

// ===== Fonction d'initialisation WebGL =====
function initShaderCanvas(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) return null;

  // Compilation des shaders
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

  // Quad plein écran
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uProgress = gl.getUniformLocation(program, 'u_progress');

  // Resize
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // Boucle de rendu
  let startTime = performance.now();
  let progress = 0;
  let animating = true;

  function render() {
    if (!animating) return;

    const elapsed = (performance.now() - startTime) / 1000;
    progress = Math.min(elapsed / 2.5, 1); // 2.5s d'animation

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

// ===== Déclencher le shader au clic "Jouer" (Mode Normal) =====
if (normalModeCard) {
  normalModeCard.addEventListener('click', () => {
    const canvas = document.getElementById('shader-canvas-lobby');
    if (canvas) initShaderCanvas(canvas);
  });
}

// ===== Déclencher le shader au clic sur l'onglet "Jouer" du lobby =====
if (lobbyPlayTab) {
  lobbyPlayTab.addEventListener('click', () => {
    const canvas = document.getElementById('shader-canvas');
    if (canvas) initShaderCanvas(canvas);
  });
}
// ===================== ÉCRAN AMIS =====================
const friendsScreen = document.getElementById('friends-screen');
const btnBackFriends = document.getElementById('btn-back-friends');
const friendsSearch = document.getElementById('friends-search');
const friendsResults = document.getElementById('friends-search-results');
const btnCopyInvite = document.getElementById('btn-copy-invite');

// ===== Navigation : onglet "Amis" depuis le lobby =====
const lobbyFriendsTab = lobbyScreen.querySelector(
  '.tab-btn[data-tab="friends"]'
);
if (lobbyFriendsTab) {
  lobbyFriendsTab.addEventListener('click', () => {
    goToScreen(friendsScreen);
  });
}

// ===== Retour depuis l'écran Amis =====
btnBackFriends.addEventListener('click', () => {
  goToScreen(lobbyScreen);
});

// ===== Onglets pilules =====
const friendsTabs = document.querySelectorAll('.friends-tab');
const friendsPanels = document.querySelectorAll('.friends-panel');

friendsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    friendsTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    friendsPanels.forEach((p) => p.classList.add('hidden'));
    const target = document.querySelector(
      `[data-friends-panel="${tab.dataset.friendsTab}"]`
    );
    if (target) target.classList.remove('hidden');
  });
});

// ===== Recherche de joueurs (placeholder pour l'instant) =====
friendsSearch.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();

  if (query.length < 3) {
    friendsResults.classList.add('hidden');
    return;
  }

  // Données fictives pour tester l'UI
  const fakeResults = [
    { pseudo: 'loup_alpha', state: 'add' },
    { pseudo: 'loup_beta', state: 'friend' },
    { pseudo: 'loup_gamma', state: 'sent' },
    { pseudo: 'loup_delta', state: 'received' },
  ].filter((u) => u.pseudo.includes(query));

  if (fakeResults.length === 0) {
    friendsResults.innerHTML =
      '<p class="friends-empty">Aucun joueur trouvé.</p>';
  } else {
    friendsResults.innerHTML = fakeResults
      .map((u) => {
        let btn = '';
        if (u.state === 'add')
          btn = '<button class="action-btn accept">+ Ajouter</button>';
        if (u.state === 'friend')
          btn = '<button class="action-btn disabled">✓ Ami</button>';
        if (u.state === 'sent')
          btn = '<button class="action-btn disabled">⏳ Envoyé</button>';
        if (u.state === 'received')
          btn = '<button class="action-btn accept">Accepter</button>';

        return `
        <div class="friend-card">
          <div class="friend-avatar">👤</div>
          <div class="friend-info">
            <span class="friend-pseudo">${u.pseudo}</span>
          </div>
          <div class="friend-actions">${btn}</div>
        </div>
      `;
      })
      .join('');
  }

  friendsResults.classList.remove('hidden');
});

// ===== Copier le lien d'invitation =====
btnCopyInvite.addEventListener('click', async () => {
  const currentUser = window.firebaseAuth?.currentUser;
  const pseudo = currentUser?.displayName || 'joueur';
  const link = `${window.location.origin}/invite/${pseudo}`;

  try {
    await navigator.clipboard.writeText(link);
    showMessage('🔗 Lien copié : ' + link);
  } catch (err) {
    showMessage('❌ Impossible de copier le lien.');
  }
});

// ===================== ÉCRAN PROFIL =====================
const profileScreen = document.getElementById('profile-screen');
const btnBackProfile = document.getElementById('btn-back-profile');
const profilePseudo = document.getElementById('profile-pseudo');
const profileStatus = document.getElementById('profile-status');
const profileActionBtn = document.getElementById('profile-action-btn');

// ===== Navigation : onglet "Profil" depuis le lobby =====
const lobbyProfileTab = lobbyScreen.querySelector('.tab-btn[data-tab="profile"]');
if (lobbyProfileTab) {
  lobbyProfileTab.addEventListener('click', () => {
    openProfile(window.firebaseAuth?.currentUser?.displayName || 'moi', true);
  });
}

// ===== Retour depuis l'écran Profil =====
btnBackProfile.addEventListener('click', () => {
  goToScreen(lobbyScreen);
});

// ===== Ouvrir un profil =====
function openProfile(pseudo, isSelf = false) {
  profilePseudo.textContent = pseudo;

  if (isSelf) {
    profileStatus.innerHTML = '<span class="status-dot online"></span> Toi';
    profileActionBtn.textContent = '✏️ Modifier le profil';
    profileActionBtn.classList.add('friend');
  } else {
    profileStatus.innerHTML = '<span class="status-dot online"></span> En ligne';
    profileActionBtn.textContent = '+ Ajouter en ami';
    profileActionBtn.classList.remove('friend');
  }

  goToScreen(profileScreen);
}

// ===== Action du bouton d'action =====
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
    // Stocke le pseudo pour l'utiliser après connexion
    sessionStorage.setItem('pendingInvite', invitePseudo);

    // Si déjà connecté → ouvrir le profil direct
    if (window.firebaseAuth?.currentUser) {
      setTimeout(() => openProfile(invitePseudo), 500);
      sessionStorage.removeItem('pendingInvite');
    }
  }
}

// Vérifier après l'initialisation Firebase
setTimeout(checkInviteLink, 1000);

// Vérifier à chaque changement d'état (après connexion)
if (window.firebaseAuth) {
  window.firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      const pending = sessionStorage.getItem('pendingInvite');
      if (pending) {
        openProfile(pending);
        sessionStorage.removeItem('pendingInvite');
      }
    }
  });
}