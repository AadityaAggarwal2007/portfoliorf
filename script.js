const board = document.getElementById('game-board');
const gameStatus = document.getElementById('game-status');
const gameMessage = document.getElementById('game-message');
const startButton = document.getElementById('start-game');
const xpProgress = document.getElementById('xp-progress');
const xpBarFill = document.getElementById('xp-bar-fill');
const missionTitle = document.getElementById('mission-title');
const missionCopy = document.getElementById('mission-copy');
const questNodes = document.querySelectorAll('.quest-node');
const archiveCards = document.querySelectorAll('.archive-card');
const tokens = document.querySelectorAll('.quest-token');

const boardWidth = 9;
const boardHeight = 7;
const walls = [
  { x: 3, y: 2 },
  { x: 5, y: 2 },
  { x: 2, y: 4 },
  { x: 6, y: 5 },
];

const state = {
  started: false,
  x: 0,
  y: 0,
  collected: new Set(),
};

function isWall(x, y) {
  return walls.some((wall) => wall.x === x && wall.y === y);
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

function activateArchiveCard(sectionId) {
  archiveCards.forEach((card) => {
    card.classList.toggle('active-card', card.id === sectionId);
  });
}

function updateProgress() {
  const remaining = tokens.length - state.collected.size;
  const percent = Math.round((state.collected.size / tokens.length) * 100);
  const isComplete = remaining === 0;

  if (gameStatus) {
    gameStatus.textContent = isComplete
      ? 'Objective complete: all mission hubs reached'
      : `Objective: collect all 4 mission hubs (${remaining} left)`;
  }

  if (xpProgress) xpProgress.textContent = `${percent}%`;
  if (xpBarFill) xpBarFill.style.width = `${percent}%`;

  if (isComplete) {
    if (missionTitle) missionTitle.textContent = 'Profile unlocked';
    if (missionCopy) missionCopy.textContent = 'The portfolio is fully unlocked and ready for the next strategic opportunity.';
    if (gameMessage) gameMessage.textContent = 'All mission hubs collected. Profile unlocked — contact Nishika for opportunities.';
    return;
  }

  if (gameMessage) {
    gameMessage.textContent = 'Use arrow keys or WASD to move through the map and unlock every mission node.';
  }
}

function pickupToken() {
  tokens.forEach((token) => {
    const tokenType = token.dataset.token;
    if (state.collected.has(tokenType)) return;

    const x = Number(token.dataset.x || token.style.getPropertyValue('--x'));
    const y = Number(token.dataset.y || token.style.getPropertyValue('--y'));

    if (state.x === x && state.y === y) {
      state.collected.add(tokenType);
      token.classList.add('collected');
      const sectionId = token.dataset.section || 'summary';
      activateArchiveCard(sectionId);
      const name = token.dataset.name || tokenType;
      if (gameMessage) {
        gameMessage.textContent = `${name} unlocked. Keep moving to the next mission.`;
      }
      const sectionTitle = questNodes[
        [...questNodes].findIndex((node) => node.dataset.section === sectionId)
      ];
      if (sectionTitle) {
        questNodes.forEach((node) => node.classList.toggle('active', node === sectionTitle));
        setQuestMission(sectionTitle.dataset.title || 'Turn data into action.', sectionTitle.dataset.copy || 'Translate business questions...');
      }
    }
  });

  updateProgress();
}

function movePlayer(dx, dy) {
  if (!state.started) return;

  const nextX = state.x + dx;
  const nextY = state.y + dy;

  if (nextX < 0 || nextX >= boardWidth || nextY < 0 || nextY >= boardHeight) {
    if (gameMessage) gameMessage.textContent = 'You are at the edge of the map.';
    return;
  }

  if (isWall(nextX, nextY)) {
    if (gameMessage) gameMessage.textContent = 'Blocked by a wall. Try another route.';
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

  tokens.forEach((token) => token.classList.remove('collected'));
  questNodes.forEach((node) => node.classList.toggle('active', node.dataset.section === 'summary'));
  activateArchiveCard('summary');
  setQuestMission('Turn data into action.', 'Translate business questions, stakeholder needs, and user behavior into dashboards, stories, and decisions that move teams forward.');
  updatePlayerPosition();
  updateProgress();
}

questNodes.forEach((button) => {
  button.addEventListener('click', () => {
    questNodes.forEach((node) => node.classList.remove('active'));
    button.classList.add('active');
    activateArchiveCard(button.dataset.section || 'summary');
    setQuestMission(
      button.dataset.title || 'Turn data into action.',
      button.dataset.copy || 'Translate business questions, stakeholder needs, and user behavior into dashboards, stories, and decisions that move teams forward.'
    );
  });
});

startButton?.addEventListener('click', resetGame);

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') movePlayer(0, -1);
  if (key === 'arrowdown' || key === 's') movePlayer(0, 1);
  if (key === 'arrowleft' || key === 'a') movePlayer(-1, 0);
  if (key === 'arrowright' || key === 'd') movePlayer(1, 0);
});

updatePlayerPosition();
updateProgress();
resetGame();

