// DOM Elements
const board = document.getElementById('game-board');
const gameStatus = document.getElementById('game-status');
const gameMessage = document.getElementById('game-message');
const startButton = document.getElementById('start-game');
const bannerReplayBtn = document.getElementById('banner-replay-btn');
const completionBanner = document.getElementById('completion-banner');
const statusPill = document.getElementById('mission-status-pill');
const xpProgress = document.getElementById('xp-progress');
const xpBarFill = document.getElementById('xp-bar-fill');
const missionTitle = document.getElementById('mission-title');
const missionCopy = document.getElementById('mission-copy');
const questNodes = document.querySelectorAll('.quest-node');
const archiveCards = document.querySelectorAll('.archive-card');
const tokens = document.querySelectorAll('.quest-token');
const dpadButtons = document.querySelectorAll('.dpad-btn');

// Board Boundaries & Barriers
const boardWidth = 9;
const boardHeight = 7;
const walls = [
  { x: 3, y: 2 },
  { x: 5, y: 2 },
  { x: 2, y: 4 },
  { x: 6, y: 5 },
];

// Game State
const state = {
  started: false,
  x: 0,
  y: 0,
  collected: new Set(),
};

function isWall(x, y) {
  return walls.some((wall) => wall.x === x && wall.y === y);
}

// The barriers block movement, so draw them instead of leaving them invisible.
function renderWalls() {
  if (!board || board.querySelector('.wall')) return;
  walls.forEach((wall) => {
    const el = document.createElement('div');
    el.className = 'wall';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--x', wall.x);
    el.style.setProperty('--y', wall.y);
    board.appendChild(el);
  });
}

// Tokens and the player are placed on a --cell grid step. On narrow screens a
// fixed 40px step pushes the right-hand columns (EXP sits at x=8) outside the
// board, so scale the step down to whatever keeps all 9 columns visible.
function syncCellSize() {
  if (!board) return;
  const width = board.clientWidth;
  const height = board.clientHeight;
  if (!width || !height) return;
  // A token is 1.3 cells wide and sits 0.25 of a cell into its column, so the
  // last column needs (boardWidth - 1) + 1.55 cells of room, not boardWidth.
  const spanX = boardWidth + 0.55;
  const spanY = boardHeight + 0.55;
  const cell = Math.min(40, width / spanX, height / spanY);
  board.style.setProperty('--cell', `${cell}px`);
}

function updatePlayerPosition() {
  const player = document.getElementById('player');
  if (!player) return;
  player.style.setProperty('--x', state.x);
  player.style.setProperty('--y', state.y);
}

function setQuestMission(title, copy) {
  if (missionTitle) missionTitle.textContent = title;
  if (missionCopy) missionCopy.textContent = copy;
}

function activateArchiveCard(sectionId, { scroll = false } = {}) {
  archiveCards.forEach((card) => {
    const isActive = card.id === sectionId;
    card.classList.toggle('active-card', isActive);
    if (isActive && scroll) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function updateProgress({ keepMessage = false } = {}) {
  const remaining = tokens.length - state.collected.size;
  const percent = Math.round((state.collected.size / tokens.length) * 100);
  const isComplete = remaining === 0;

  if (gameStatus) {
    gameStatus.textContent = isComplete
      ? 'Objective complete: all 4 mission hubs collected!'
      : `Objective: collect all 4 mission hubs (${remaining} left)`;
  }

  if (xpProgress) xpProgress.textContent = `${percent}%`;
  if (xpBarFill) xpBarFill.style.width = `${percent}%`;

  if (isComplete) {
    if (statusPill) {
      statusPill.textContent = '★ PROFILE UNLOCKED';
      statusPill.style.background = 'rgba(209, 178, 109, 0.3)';
      statusPill.style.color = '#f7f3ee';
    }
    if (missionTitle) missionTitle.textContent = 'Profile fully unlocked!';
    if (missionCopy) missionCopy.textContent = 'Nishika Aggarwal is ready for business analyst, BI reporting, and data-driven roles. Immediate joiner.';
    if (gameMessage) gameMessage.textContent = 'All 4 mission hubs collected! Nishika Aggarwal profile unlocked.';
    
    // Show celebratory banner & launch confetti
    if (completionBanner) completionBanner.classList.add('show');
    triggerConfetti();
    return;
  } else {
    if (statusPill) {
      statusPill.textContent = 'Mission active';
      statusPill.style.background = '';
      statusPill.style.color = '';
    }
    if (completionBanner) completionBanner.classList.remove('show');
  }

  if (gameMessage && !keepMessage) {
    gameMessage.textContent = 'Use arrow keys, WASD, or the touch D-Pad below to move through the map.';
  }
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function pickupToken() {
  let unlocked = false;

  tokens.forEach((token) => {
    const tokenType = token.dataset.token;
    if (state.collected.has(tokenType)) return;

    const x = Number(token.dataset.x || token.style.getPropertyValue('--x'));
    const y = Number(token.dataset.y || token.style.getPropertyValue('--y'));

    if (state.x === x && state.y === y) {
      state.collected.add(tokenType);
      unlocked = true;
      
      // Live animation trigger
      token.classList.add('just-collected');
      setTimeout(() => {
        token.classList.add('collected');
        token.classList.remove('just-collected');
      }, 400);

      const sectionId = token.dataset.section || 'summary';
      activateArchiveCard(sectionId);
      const name = token.dataset.name || tokenType;
      
      if (gameMessage) {
        gameMessage.textContent = `★ ${name} Hub unlocked! Explore the interactive details below.`;
      }
      
      const sectionNode = [...questNodes].find((node) => node.dataset.section === sectionId);
      if (sectionNode) {
        questNodes.forEach((node) => node.classList.toggle('active', node === sectionNode));
        setQuestMission(
          sectionNode.dataset.title || 'Turn data into action.',
          sectionNode.dataset.copy || 'Computer Science Engineering graduate with hands-on experience in data analysis.'
        );
      }
    }
  });

  updateProgress({ keepMessage: unlocked });
}

function movePlayer(dx, dy) {
  if (!state.started) return;

  const nextX = state.x + dx;
  const nextY = state.y + dy;

  if (nextX < 0 || nextX >= boardWidth || nextY < 0 || nextY >= boardHeight) {
    if (gameMessage) gameMessage.textContent = 'Map boundary reached.';
    return;
  }

  if (isWall(nextX, nextY)) {
    if (gameMessage) gameMessage.textContent = 'Blocked by barrier. Route around it!';
    return;
  }

  state.x = nextX;
  state.y = nextY;
  updatePlayerPosition();
  pickupToken();
}

function resetGame() {
  state.started = true;
  state.x = 0;
  state.y = 0;
  state.collected.clear();

  tokens.forEach((token) => {
    token.classList.remove('collected', 'just-collected');
  });
  
  if (completionBanner) completionBanner.classList.remove('show');
  questNodes.forEach((node) => node.classList.toggle('active', node.dataset.section === 'summary'));
  activateArchiveCard('summary');
  syncCellSize();
  setQuestMission(
    'Turn data into action.',
    'Computer Science Engineering graduate (2026 batch, DIT University) with hands-on experience in data analysis, SQL, Power BI, and Python.'
  );
  
  updatePlayerPosition();
  updateProgress();
}

// Event Listeners for Quest Selector Side Buttons
questNodes.forEach((button) => {
  button.addEventListener('click', () => {
    questNodes.forEach((node) => node.classList.remove('active'));
    button.classList.add('active');
    activateArchiveCard(button.dataset.section || 'summary', { scroll: true });
    setQuestMission(
      button.dataset.title || 'Turn data into action.',
      button.dataset.copy || 'Translate business questions into data-driven decisions.'
    );
  });
});

// Event Listeners for Interactive Node Payoffs (Tabs & Selectors)

// 1. Summary Card Tabs
const summaryPills = document.querySelectorAll('.payoff-pill');
const summaryTabContent = document.getElementById('summary-tab-content');
summaryPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    summaryPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    const tabType = pill.dataset.tab;
    if (tabType === 'summary-core' && summaryTabContent) {
      summaryTabContent.innerHTML = `<p>Diagnosed an 80% drop-off rate through root-cause and gap analysis in an analyst role at Jewelmond Precious Pvt. Ltd., driving a 40%+ improvement in target metric. Comfortable working across data-heavy, cross-functional environments, using AI tools daily to accelerate reporting workflows. <strong>Immediate joiner.</strong></p>`;
    } else if (tabType === 'summary-highlights' && summaryTabContent) {
      summaryTabContent.innerHTML = `<p>⚡ <strong>Key Highlights:</strong><br>• DIT University CSE Graduate (CGPA 8.3/10)<br>• Oracle Cloud Infrastructure (OCI) Certified<br>• Advanced SQL, Python & Power BI Specialist<br>• Experienced in cross-functional AI automation (ChatGPT, Copilot, Claude)</p>`;
    }
  });
});

// 2. Tab groups inside the archive cards (projects, roles, focus areas)
function wireTabGroup(tabSelector, panelSelector, datasetKey) {
  const tabs = document.querySelectorAll(tabSelector);
  const panels = document.querySelectorAll(panelSelector);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(tab.dataset[datasetKey]);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

wireTabGroup('.proj-tab', '.project-details', 'proj');
wireTabGroup('.role-tab', '.role-details', 'role');
wireTabGroup('.focus-tab', '.focus-details', 'focus');

// Mobile D-Pad Controls
dpadButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const dir = btn.dataset.dir;
    if (dir === 'up') movePlayer(0, -1);
    if (dir === 'down') movePlayer(0, 1);
    if (dir === 'left') movePlayer(-1, 0);
    if (dir === 'right') movePlayer(1, 0);
  });
});

// Restart Game Triggers
startButton?.addEventListener('click', resetGame);
bannerReplayBtn?.addEventListener('click', resetGame);

// Keyboard Navigation (WASD / Arrows)
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    // Prevent default scrolling when using arrow keys inside game
    if (document.activeElement === board || document.activeElement === document.body) {
      event.preventDefault();
    }
  }
  if (key === 'arrowup' || key === 'w') movePlayer(0, -1);
  if (key === 'arrowdown' || key === 's') movePlayer(0, 1);
  if (key === 'arrowleft' || key === 'a') movePlayer(-1, 0);
  if (key === 'arrowright' || key === 'd') movePlayer(1, 0);
});

// Initialize on Load
renderWalls();
syncCellSize();
window.addEventListener('resize', syncCellSize);
resetGame();
