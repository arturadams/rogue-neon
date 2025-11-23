const BOSS_MARKER_PERCENTAGES = [25, 50, 75, 100];
const SPEED_OPTIONS = [1, 2, 3];
const OVERLAY_IDS = ['scanline', 'vignette-curse'];
const TEXT_START_TITLE = 'NEON TAJ';
const TEXT_START_SUBTITLE = 'ROGUE PROTOCOL';
const TEXT_START_INFO =
  'WASD to Move • COLLECT ORBS for XP<br>Spells CAST AUTOMATICALLY<br>Max 4 Weapons - Choose Wisely!';
const CLASS_HUD_PANEL = 'hud-panel';
const CLASS_MODAL = 'modal';
const CLASS_CARD_CONTAINER = 'card-container';

function createDivWithClasses(id, className) {
  const el = document.createElement('div');
  if (id) el.id = id;
  if (className) el.className = className;
  return el;
}

function createButton({ id, className, text, onClick, display }) {
  const button = document.createElement('button');
  if (id) button.id = id;
  if (className) button.className = className;
  button.textContent = text;
  if (display) button.style.display = display;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

function createProgressContainer() {
  const container = createDivWithClasses('progress-container');
  const fill = createDivWithClasses('progress-fill');
  container.appendChild(fill);

  BOSS_MARKER_PERCENTAGES.forEach((value) => {
    const marker = createDivWithClasses('', 'boss-marker' + (value === 100 ? ' final' : ''));
    marker.style.left = `${value}%`;
    container.appendChild(marker);
  });

  const label = createDivWithClasses('progress-label');
  label.textContent = 'SYSTEM INTEGRITY PROTOCOL';
  container.appendChild(label);
  return container;
}

function createSpeedControls() {
  const speedControls = createDivWithClasses('speed-controls', CLASS_HUD_PANEL);
  SPEED_OPTIONS.forEach((value) => {
    const button = createButton({
      className: 'speed-btn' + (value === 1 ? ' active' : ''),
      text: `${value}x`,
      onClick: () => setSpeed(value)
    });
    speedControls.appendChild(button);
  });
  return speedControls;
}

function createDataButton() {
  return createButton({
    id: 'data-btn',
    className: `${CLASS_HUD_PANEL} data-btn`,
    text: 'STATUS / PAUSE',
    display: 'none',
    onClick: () => openPauseMenu()
  });
}

function createStatsPanel() {
  const panel = createDivWithClasses('stats-panel', CLASS_HUD_PANEL);
  panel.style.display = 'none';

  const integrityLabel = createDivWithClasses('', 'stat-label');
  integrityLabel.innerHTML = '<span>INTEGRITY</span> <span id="hp-text">100/100</span>';
  panel.appendChild(integrityLabel);

  const hpBar = createDivWithClasses('', 'bar-container');
  hpBar.appendChild(createDivWithClasses('hp-bar', 'bar-fill'));
  panel.appendChild(hpBar);

  const syncLabel = createDivWithClasses('', 'stat-label');
  syncLabel.innerHTML = '<span>SYNC LEVEL <span id="lvl-text" class="text-warning">1</span></span>';
  panel.appendChild(syncLabel);

  const xpBar = createDivWithClasses('', 'bar-container');
  const xpFill = createDivWithClasses('xp-bar', 'bar-fill');
  xpFill.style.width = '0%';
  xpBar.appendChild(xpFill);
  panel.appendChild(xpBar);

  const waveText = createDivWithClasses('', 'small-text text-muted');
  waveText.innerHTML = 'WAVE: <span id="wave-text" class="text-light">1</span> / <span id="max-wave-text">20</span>';
  panel.appendChild(waveText);

  const goldText = createDivWithClasses('', 'small-text text-gold mt-4');
  goldText.innerHTML = 'GOLD: <span id="gold-text">0</span>';
  panel.appendChild(goldText);

  return panel;
}

function createSpellDock() {
  const dock = createDivWithClasses('spell-dock', CLASS_HUD_PANEL);
  dock.style.display = 'none';
  return dock;
}

function createInventoryPanel() {
  const inventory = createDivWithClasses('inventory-panel', CLASS_HUD_PANEL);
  inventory.style.display = 'none';
  const label = createDivWithClasses('', 'inventory-label');
  label.textContent = 'MODULES';
  inventory.appendChild(label);
  inventory.appendChild(createDivWithClasses('passive-list', ''));
  inventory.lastElementChild.id = 'passive-list';
  return inventory;
}

function createStartScreen() {
  const screen = createDivWithClasses('start-screen', 'screen');
  const title = document.createElement('h1');
  title.className = 'start-title';
  title.textContent = TEXT_START_TITLE;
  screen.appendChild(title);

  const subtitle = document.createElement('h2');
  subtitle.className = 'start-subtitle';
  subtitle.textContent = TEXT_START_SUBTITLE;
  screen.appendChild(subtitle);

  const actions = createDivWithClasses('', 'start-actions');
  actions.appendChild(createButton({ className: 'btn', text: 'INITIALIZE SYSTEM', onClick: () => startGame() }));
  actions.appendChild(createButton({ className: 'btn btn-secondary', text: 'DATABASE', onClick: () => openDatabase() }));
  screen.appendChild(actions);

  const info = createDivWithClasses('', 'start-info');
  info.innerHTML = TEXT_START_INFO;
  screen.appendChild(info);
  return screen;
}

function createStarterModal() {
  const modal = createDivWithClasses('starter-modal', CLASS_MODAL);
  const title = document.createElement('h2');
  title.className = 'text-accent';
  title.textContent = 'SELECT PRIMARY WEAPON';
  modal.appendChild(title);
  modal.appendChild(createDivWithClasses('starter-cards', CLASS_CARD_CONTAINER));
  modal.lastElementChild.id = 'starter-cards';
  return modal;
}

function createLevelupModal() {
  const modal = createDivWithClasses('levelup-modal', CLASS_MODAL);
  modal.id = 'levelup-modal';
  const title = document.createElement('h2');
  title.id = 'levelup-title';
  title.textContent = 'SYSTEM UPGRADE';
  modal.appendChild(title);

  const subtitle = createDivWithClasses('', 'modal-subtitle');
  subtitle.textContent = 'SELECT A PROTOCOL TO INSTALL';
  modal.appendChild(subtitle);

  const cards = createDivWithClasses('upgrade-cards', CLASS_CARD_CONTAINER);
  modal.appendChild(cards);

  const rerollContainer = createDivWithClasses('', 'reroll-container');
  rerollContainer.appendChild(createButton({ id: 'reroll-btn', className: 'reroll-btn', text: 'REROLL (2)', onClick: () => doReroll() }));
  modal.appendChild(rerollContainer);
  return modal;
}

function createItemModal() {
  const modal = createDivWithClasses('item-modal', CLASS_MODAL);

  const subtitle = createDivWithClasses('', 'modal-subtitle');
  subtitle.style.letterSpacing = '2px';
  subtitle.textContent = 'HARDWARE FOUND';
  modal.appendChild(subtitle);

  const icon = createDivWithClasses('item-icon-display');
  icon.id = 'item-icon-display';
  icon.textContent = '🎁';
  modal.appendChild(icon);

  const title = createDivWithClasses('item-title');
  title.id = 'item-title';
  title.textContent = 'UNKNOWN ITEM';
  modal.appendChild(title);

  const rarity = createDivWithClasses('item-rarity');
  rarity.id = 'item-rarity';
  rarity.textContent = 'COMMON';
  modal.appendChild(rarity);

  const desc = createDivWithClasses('item-desc');
  desc.id = 'item-desc';
  desc.textContent = 'Description goes here.';
  modal.appendChild(desc);

  modal.appendChild(createButton({ className: 'btn', text: 'INTEGRATE', onClick: () => closeItemModal() }));
  return modal;
}

function createDatabaseModal() {
  const modal = createDivWithClasses('database-modal', CLASS_MODAL);
  const header = createDivWithClasses('', 'modal-header');

  const title = document.createElement('h2');
  title.className = 'text-accent';
  title.id = 'db-title';
  title.textContent = 'SYSTEM DATABASE';
  header.appendChild(title);

  header.appendChild(createButton({ className: 'modal-close', text: 'CLOSE', onClick: () => closeDatabase() }));
  modal.appendChild(header);

  modal.appendChild(createDivWithClasses('db-content', 'db-grid'));
  modal.lastElementChild.id = 'db-content';
  return modal;
}

function createGameoverModal() {
  const modal = createDivWithClasses('gameover-modal', CLASS_MODAL);
  modal.id = 'gameover-modal';

  const title = document.createElement('h2');
  title.id = 'go-title';
  title.textContent = 'SYSTEM FAILURE';
  modal.appendChild(title);

  const stats = document.createElement('p');
  stats.innerHTML = 'WAVES SURVIVED: <span id="final-wave" class="text-accent">0</span>';
  modal.appendChild(stats);

  modal.appendChild(createButton({ className: 'btn', text: 'REBOOT', onClick: () => location.reload() }));
  return modal;
}

function createUiLayer() {
  const uiLayer = createDivWithClasses('ui-layer');
  uiLayer.id = 'ui-layer';
  uiLayer.append(
    createProgressContainer(),
    createSpeedControls(),
    createDataButton(),
    createStatsPanel(),
    createSpellDock(),
    createInventoryPanel(),
    createStartScreen(),
    createStarterModal(),
    createLevelupModal(),
    createItemModal(),
    createDatabaseModal(),
    createGameoverModal()
  );
  return uiLayer;
}

function createOverlay(id) {
  const overlay = createDivWithClasses(id);
  overlay.id = id;
  return overlay;
}

export function buildUi(root = document.body) {
  const fragment = document.createDocumentFragment();
  OVERLAY_IDS.forEach((id) => fragment.appendChild(createOverlay(id)));
  fragment.appendChild(createUiLayer());
  root.appendChild(fragment);
}
