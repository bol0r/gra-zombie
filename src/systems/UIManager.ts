import * as THREE from 'three';
import { Player } from '../entities/Player';
import { IsometricCamera } from '../core/IsometricCamera';
import { DayNightCycle } from '../world/DayNightCycle';
import {
  compareRuns,
  DOG_MODS,
  DogModId,
  LevelId,
  PLAYER_SKINS,
  PlayerSkinId,
  SKILL_BRANCHES,
  SkillNodeId,
  UpgradeSystem,
  ZOMBIE_SKINS,
  ZombieSkinId
} from './UpgradeSystem';

interface FloatingTextItem {
  el: HTMLDivElement;
  worldPos: THREE.Vector3;
  life: number;
  maxLife: number;
  vy: number;
}

export interface PlayerRunSummary {
  playerNumber: 1 | 2;
  completed: boolean;
  realTimeSeconds: number;
  stageReached: number;
  kills: number;
  runCoins: number;
}

export function formatSecondsMMSS(totalSec: number): string {
  const clamped = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPreciseTime(totalSec: number): string {
  const clamped = Math.max(0, totalSec);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  const tenths = Math.floor((clamped - Math.floor(clamped)) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}

export class UIManager {
  private floatingContainer: HTMLElement;
  private floatingItems: FloatingTextItem[] = [];

  // HUD Elements
  private hudEl = document.getElementById('hud')!;
  private playerLabelEl = document.getElementById('hud-player-label')!;
  private streetEl = document.getElementById('hud-street')!;
  private streetSubEl = document.getElementById('hud-street-sub')!;
  private hudTreeXpEl = document.getElementById('hud-tree-xp')!;
  private hudCoinsEl = document.getElementById('hud-coins')!;

  private clockPanelEl = document.getElementById('hud-clock-panel')!;
  private dayIconEl = document.getElementById('hud-day-icon')!;
  private dayPhaseEl = document.getElementById('hud-day-phase')!;
  private streetTimerEl = document.getElementById('hud-street-timer')!;
  private dayBarEl = document.getElementById('hud-day-bar')!;
  private nightWarnEl = document.getElementById('hud-night-warning')!;

  private comboPanelEl = document.getElementById('hud-combo-panel')!;
  private comboCountEl = document.getElementById('hud-combo-count')!;
  private comboBarEl = document.getElementById('hud-combo-bar')!;

  private bannerEl = document.getElementById('hud-banner')!;
  private bannerTitleEl = document.getElementById('hud-banner-title')!;
  private bannerSubEl = document.getElementById('hud-banner-sub')!;
  private bannerTimer = 0;

  private hpTextEl = document.getElementById('hud-hp-text')!;
  private hpFillEl = document.getElementById('hud-hp-fill')!;
  private staminaTextEl = document.getElementById('hud-stamina-text')!;
  private staminaFillEl = document.getElementById('hud-stamina-fill')!;
  private specialContainerEl = document.getElementById('hud-special-container')!;
  private specialLabelEl = document.getElementById('hud-special-label')!;
  private specialTextEl = document.getElementById('hud-special-text')!;
  private specialFillEl = document.getElementById('hud-special-fill')!;
  private badgeSpecialEl = document.getElementById('badge-special')!;

  private levelEl = document.getElementById('hud-level')!;
  private killsEl = document.getElementById('hud-kills')!;

  private meleeIconEl = document.getElementById('hud-melee-icon')!;
  private meleeNameEl = document.getElementById('hud-melee-name')!;
  private meleeDescEl = document.getElementById('hud-melee-desc')!;
  private rangedIconEl = document.getElementById('hud-ranged-icon')!;
  private rangedNameEl = document.getElementById('hud-ranged-name')!;
  private ammoTextEl = document.getElementById('hud-ammo-text')!;

  // Overlays
  private startOverlay = document.getElementById('start-overlay')!;
  private menuTreeXpEl = document.getElementById('menu-tree-xp')!;
  private menuCoinsEl = document.getElementById('menu-coins')!;
  private highScoreListEl = document.getElementById('highscore-list')!;
  private btnHsLvl1El = document.getElementById('btn-hs-lvl1')!;
  private btnHsLvl2El = document.getElementById('btn-hs-lvl2')!;
  private btnMenuDogEl = document.getElementById('btn-menu-dog')!;
  private btnPauseDogEl = document.getElementById('btn-pause-dog')!;
  public activeHighScoreLevel: LevelId = 1;

  private levelSelectOverlay = document.getElementById('level-select-overlay')!;
  private levelSelectBadgeEl = document.getElementById('level-select-badge')!;

  private dogModOverlay = document.getElementById('dog-mod-overlay')!;
  private dogModListEl = document.getElementById('dog-mod-list')!;

  private pauseOverlay = document.getElementById('pause-overlay')!;
  private pauseStatusTextEl = document.getElementById('pause-status-text')!;

  private treeOverlay = document.getElementById('tree-overlay')!;
  private treeModalXpEl = document.getElementById('tree-modal-xp')!;
  private treeBranchesGridEl = document.getElementById('tree-branches-grid')!;

  private shopOverlay = document.getElementById('shop-overlay')!;
  private shopModalCoinsEl = document.getElementById('shop-modal-coins')!;
  private shopPlayerListEl = document.getElementById('shop-player-list')!;
  private shopZombieListEl = document.getElementById('shop-zombie-list')!;

  private introOverlay = document.getElementById('intro-overlay')!;
  private creditsOverlay = document.getElementById('credits-overlay')!;
  private p2HandoffOverlay = document.getElementById('p2-handoff-overlay')!;
  private p2HandoffStatsEl = document.getElementById('p2-handoff-stats')!;
  private gameOverOverlay = document.getElementById('gameover-overlay')!;
  private gameOverBadgeEl = document.getElementById('gameover-badge')!;
  private gameOverTitleEl = document.getElementById('gameover-title')!;
  private gameOverStatsEl = document.getElementById('gameover-stats')!;
  private duelScoreboardEl = document.getElementById('duel-scoreboard')!;
  private nightOverlay = document.getElementById('night-overlay')!;
  private damageOverlay = document.getElementById('damage-overlay')!;

  public comboCount = 0;
  public comboTimer = 0;
  private maxComboTime = 4.2;

  constructor(private camera: IsometricCamera) {
    this.floatingContainer = document.getElementById('floating-texts')!;
  }

  public setHudVisible(visible: boolean): void {
    if (visible) {
      this.hudEl.classList.remove('hidden');
    } else {
      this.hudEl.classList.add('hidden');
    }
  }

  public showMainMenu(upgrades: UpgradeSystem): void {
    this.refreshMainMenuData(upgrades);
    this.startOverlay.classList.remove('hidden');
    this.levelSelectOverlay.classList.add('hidden');
    this.dogModOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.treeOverlay.classList.add('hidden');
    this.shopOverlay.classList.add('hidden');
    this.introOverlay.classList.add('hidden');
    this.creditsOverlay.classList.add('hidden');
    this.p2HandoffOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
  }

  public refreshMainMenuData(upgrades: UpgradeSystem): void {
    this.menuTreeXpEl.textContent = String(upgrades.treeXp);
    this.menuCoinsEl.textContent = String(upgrades.coins);
    this.refreshDogButtons(upgrades);
    this.renderHighScores(upgrades);
  }

  public refreshDogButtons(upgrades: UpgradeSystem): void {
    const hasDog = upgrades.hasNode('dog');
    const modDef = DOG_MODS.find((m) => m.id === upgrades.selectedDogMod) ?? DOG_MODS[0];
    const label = `PIES — MODYFIKACJA: ${modDef.name.toUpperCase()}`;
    this.btnMenuDogEl.textContent = label;
    this.btnPauseDogEl.textContent = label;
    this.btnMenuDogEl.classList.toggle('hidden', !hasDog);
    this.btnPauseDogEl.classList.toggle('hidden', !hasDog);
  }

  public setHighScoreTab(level: LevelId, upgrades: UpgradeSystem): void {
    this.activeHighScoreLevel = level;
    this.btnHsLvl1El.classList.toggle('active', level === 1);
    this.btnHsLvl2El.classList.toggle('active', level === 2);
    this.renderHighScores(upgrades);
  }

  private renderHighScores(upgrades: UpgradeSystem): void {
    this.btnHsLvl1El.classList.toggle('active', this.activeHighScoreLevel === 1);
    this.btnHsLvl2El.classList.toggle('active', this.activeHighScoreLevel === 2);
    this.highScoreListEl.innerHTML = '';
    const scores = upgrades.getHighScores(this.activeHighScoreLevel);
    if (scores.length === 0) {
      const lvlName = this.activeHighScoreLevel === 1 ? 'Stary Port' : 'Szpital Dixona';
      this.highScoreListEl.innerHTML = `<div class="hs-empty">Brak wyników (${lvlName}). Rozegraj pierwszą rundę!</div>`;
      return;
    }

    scores.slice(0, 10).forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = `hs-row ${entry.completed ? 'completed' : ''}`;
      const statusText = entry.completed
        ? `UKOŃCZONA (${formatPreciseTime(entry.realTimeSeconds)})`
        : `ETAP ${entry.stageReached}/3 (${formatPreciseTime(entry.realTimeSeconds)})`;
      row.innerHTML = `
        <span class="hs-rank">#${idx + 1}</span>
        <span class="hs-status">${statusText}</span>
        <span class="hs-meta">☠️ ${entry.kills} • 🪙 ${entry.runCoins}</span>
      `;
      this.highScoreListEl.appendChild(row);
    });
  }

  public hideMainMenu(): void {
    this.startOverlay.classList.add('hidden');
  }

  public showLevelSelectModal(twoPlayer: boolean): void {
    this.startOverlay.classList.add('hidden');
    this.levelSelectBadgeEl.textContent = twoPlayer
      ? 'POJEDYNEK (2 GRACZY) • WYBÓR POZIOMU'
      : 'NOWA RZEŹ (1 GRACZ) • WYBÓR POZIOMU';
    this.levelSelectOverlay.classList.remove('hidden');
  }

  public hideLevelSelectModal(): void {
    this.levelSelectOverlay.classList.add('hidden');
  }

  public showDogModModal(
    upgrades: UpgradeSystem,
    onSelectMod: (modId: DogModId) => void
  ): void {
    this.renderDogModModal(upgrades, onSelectMod);
    this.dogModOverlay.classList.remove('hidden');
  }

  public renderDogModModal(
    upgrades: UpgradeSystem,
    onSelectMod: (modId: DogModId) => void
  ): void {
    this.dogModListEl.innerHTML = '';
    for (const mod of DOG_MODS) {
      const active = upgrades.selectedDogMod === mod.id;
      const row = document.createElement('div');
      row.className = `dog-mod-row ${active ? 'equipped' : ''}`;
      row.innerHTML = `
        <div>
          <div class="dog-mod-name">${mod.name}</div>
          <div class="dog-mod-desc">${mod.desc}</div>
        </div>
        <button class="tree-node-btn" ${active ? 'disabled' : ''}>${
        active ? 'WYBRANO' : 'WYBIERZ'
      }</button>
      `;
      const btn = row.querySelector('button')!;
      if (!active) {
        btn.addEventListener('click', () => {
          onSelectMod(mod.id);
        });
      }
      this.dogModListEl.appendChild(row);
    }
  }

  public hideDogModModal(): void {
    this.dogModOverlay.classList.add('hidden');
  }

  public showPauseModal(
    roundTimeRemaining: number,
    stageNumber: number,
    upgrades: UpgradeSystem
  ): void {
    this.refreshDogButtons(upgrades);
    this.pauseStatusTextEl.textContent = `Pozostały czas rundy: ${formatSecondsMMSS(
      roundTimeRemaining
    )} • Etap ${stageNumber}/3`;
    this.pauseOverlay.classList.remove('hidden');
  }

  public hidePauseModal(): void {
    this.pauseOverlay.classList.add('hidden');
  }

  public showTreeModal(
    upgrades: UpgradeSystem,
    onUnlockNode: (nodeId: SkillNodeId) => void
  ): void {
    this.renderTreeModal(upgrades, onUnlockNode);
    this.treeOverlay.classList.remove('hidden');
  }

  public renderTreeModal(
    upgrades: UpgradeSystem,
    onUnlockNode: (nodeId: SkillNodeId) => void
  ): void {
    this.treeModalXpEl.textContent = String(upgrades.treeXp);
    this.treeBranchesGridEl.innerHTML = '';

    for (const branch of SKILL_BRANCHES) {
      const col = document.createElement('div');
      col.className = 'tree-branch-col';

      const title = document.createElement('div');
      title.className = 'tree-branch-title';
      title.textContent = branch.title;
      col.appendChild(title);

      for (const node of branch.nodes) {
        const isUnlocked = upgrades.hasNode(node.id);
        const isPrereqLocked = upgrades.isNodeLockedByPrereq(node);
        const canBuy = upgrades.canUnlockNode(node);

        const card = document.createElement('div');
        card.className = `tree-node-card ${isUnlocked ? 'unlocked' : ''} ${
          isPrereqLocked ? 'locked' : ''
        }`;

        let btnText = `KUP (${node.cost} XP)`;
        if (isUnlocked) {
          btnText = 'KUPIONO';
        } else if (isPrereqLocked) {
          btnText = 'ZABLOKOWANE';
        }

        card.innerHTML = `
          <div class="tree-node-head">
            <span class="tree-node-name">${node.name}</span>
            <span class="tree-node-cost">${node.cost} XP</span>
          </div>
          <div class="tree-node-effect">${node.effect}</div>
          <button class="tree-node-btn" ${!canBuy ? 'disabled' : ''}>${btnText}</button>
        `;

        const btn = card.querySelector('button')!;
        if (canBuy) {
          btn.addEventListener('click', () => {
            onUnlockNode(node.id);
          });
        }

        col.appendChild(card);
      }

      this.treeBranchesGridEl.appendChild(col);
    }
  }

  public hideTreeModal(): void {
    this.treeOverlay.classList.add('hidden');
  }

  public showShopModal(
    upgrades: UpgradeSystem,
    onPlayerSkinAction: (skinId: PlayerSkinId) => void,
    onZombieSkinAction: (skinId: ZombieSkinId) => void
  ): void {
    this.renderShopModal(upgrades, onPlayerSkinAction, onZombieSkinAction);
    this.shopOverlay.classList.remove('hidden');
  }

  public renderShopModal(
    upgrades: UpgradeSystem,
    onPlayerSkinAction: (skinId: PlayerSkinId) => void,
    onZombieSkinAction: (skinId: ZombieSkinId) => void
  ): void {
    this.shopModalCoinsEl.textContent = String(upgrades.coins);
    this.shopPlayerListEl.innerHTML = '';
    this.shopZombieListEl.innerHTML = '';

    for (const skin of PLAYER_SKINS) {
      const owned = upgrades.ownedPlayerSkins.has(skin.id);
      const equipped = upgrades.selectedPlayerSkin === skin.id;
      const canAfford = upgrades.coins >= skin.cost;

      const row = document.createElement('div');
      row.className = `shop-item-row ${equipped ? 'equipped' : ''}`;

      let btnLabel = 'Kup';
      let disabled = false;
      if (equipped) {
        btnLabel = 'Założono';
        disabled = true;
      } else if (owned) {
        btnLabel = 'Załóż';
      } else {
        btnLabel = `Kup (${skin.cost})`;
        disabled = !canAfford;
      }

      row.innerHTML = `
        <div>
          <div class="shop-item-name">${skin.name}</div>
          <div class="shop-item-desc">${skin.desc}</div>
          <div class="shop-item-cost">Cena: ${skin.cost} monet</div>
        </div>
        <button class="tree-node-btn" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
      `;

      const btn = row.querySelector('button')!;
      if (!disabled) {
        btn.addEventListener('click', () => {
          onPlayerSkinAction(skin.id);
        });
      }
      this.shopPlayerListEl.appendChild(row);
    }

    for (const skin of ZOMBIE_SKINS) {
      const owned = upgrades.ownedZombieSkins.has(skin.id);
      const equipped = upgrades.selectedZombieSkin === skin.id;
      const canAfford = upgrades.coins >= skin.cost;

      const row = document.createElement('div');
      row.className = `shop-item-row ${equipped ? 'equipped' : ''}`;

      let btnLabel = 'Kup';
      let disabled = false;
      if (equipped) {
        btnLabel = 'Założono';
        disabled = true;
      } else if (owned) {
        btnLabel = 'Załóż';
      } else {
        btnLabel = `Kup (${skin.cost})`;
        disabled = !canAfford;
      }

      row.innerHTML = `
        <div>
          <div class="shop-item-name">${skin.name}</div>
          <div class="shop-item-desc">${skin.desc}</div>
          <div class="shop-item-cost">Cena: ${skin.cost} monet</div>
        </div>
        <button class="tree-node-btn" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
      `;

      const btn = row.querySelector('button')!;
      if (!disabled) {
        btn.addEventListener('click', () => {
          onZombieSkinAction(skin.id);
        });
      }
      this.shopZombieListEl.appendChild(row);
    }
  }

  public hideShopModal(): void {
    this.shopOverlay.classList.add('hidden');
  }

  public showCredits(): void {
    this.startOverlay.classList.add('hidden');
    this.creditsOverlay.classList.remove('hidden');
  }

  public hideCredits(): void {
    this.creditsOverlay.classList.add('hidden');
    this.startOverlay.classList.remove('hidden');
  }

  public showIntroOverlay(): void {
    this.startOverlay.classList.add('hidden');
    this.introOverlay.classList.remove('hidden');
    this.setHudVisible(false);
  }

  public hideIntroOverlay(): void {
    this.introOverlay.classList.add('hidden');
  }

  public addKillCombo(): void {
    this.comboCount++;
    this.comboTimer = this.maxComboTime;
  }

  public showBanner(title: string, subtitle = '', duration = 3.2): void {
    this.bannerTitleEl.textContent = title;
    this.bannerSubEl.textContent = subtitle;
    this.bannerSubEl.style.display = subtitle ? 'block' : 'none';
    this.bannerEl.classList.remove('hidden');
    this.bannerTimer = duration;
  }

  public spawnFloatingText(
    worldPos: THREE.Vector3,
    text: string,
    color = '#ffffff',
    isCrit = false,
    extraClass = ''
  ): void {
    const el = document.createElement('div');
    el.className = `floating-text ${isCrit ? 'crit' : ''} ${extraClass}`;
    el.textContent = text;
    el.style.color = color;
    this.floatingContainer.appendChild(el);

    const jitterPos = worldPos.clone().add(
      new THREE.Vector3((Math.random() - 0.5) * 0.7, 0, (Math.random() - 0.5) * 0.7)
    );

    this.floatingItems.push({
      el,
      worldPos: jitterPos,
      life: isCrit ? 1.05 : 0.78,
      maxLife: isCrit ? 1.05 : 0.78,
      vy: isCrit ? 2.4 : 1.7
    });
  }

  public showPlayer2Handoff(p1: PlayerRunSummary): void {
    const status = p1.completed
      ? `ukończył rundę (etap 3/3) w czasie ${formatPreciseTime(p1.realTimeSeconds)}`
      : `nie ukończył rundy (etap ${p1.stageReached}/3, przeżył ${formatPreciseTime(
          p1.realTimeSeconds
        )})`;
    this.p2HandoffStatsEl.textContent = `Gracz 1 ${status} • Zabójstwa: ${p1.kills} • Monety rundy: ${p1.runCoins}. Gracz 2 startuje od zera z limitem 2:00!`;
    this.p2HandoffOverlay.classList.remove('hidden');
  }

  public hidePlayer2Handoff(): void {
    this.p2HandoffOverlay.classList.add('hidden');
  }

  public showSinglePlayerSummary(
    summary: PlayerRunSummary,
    reason: 'completed' | 'timeout' | 'dead'
  ): void {
    this.duelScoreboardEl.classList.add('hidden');
    if (reason === 'completed' && summary.completed) {
      this.gameOverBadgeEl.textContent = 'RUNDA ZALICZONA • PRÓBKA WYNIESIONA';
      this.gameOverBadgeEl.classList.remove('danger');
      this.gameOverTitleEl.innerHTML = 'RUNDA <span>UKOŃCZONA</span>';
    } else if (reason === 'timeout') {
      this.gameOverBadgeEl.textContent = 'CZAS 0:00 • PORAŻKA';
      this.gameOverBadgeEl.classList.add('danger');
      this.gameOverTitleEl.innerHTML = 'KONIEC <span>CZASU</span>';
    } else {
      this.gameOverBadgeEl.textContent = 'ŚMIERĆ NA ULICY • PORAŻKA';
      this.gameOverBadgeEl.classList.add('danger');
      this.gameOverTitleEl.innerHTML = 'KONIEC <span>RZEZI</span>';
    }

    this.gameOverStatsEl.textContent = `Prawdziwy czas: ${formatPreciseTime(
      summary.realTimeSeconds
    )} • Etap: ${summary.stageReached}/3 • Zabójstwa: ${summary.kills} • Monety z rundy: ${
      summary.runCoins
    }`;
    this.gameOverOverlay.classList.remove('hidden');
  }

  public showDuelSummary(p1: PlayerRunSummary, p2: PlayerRunSummary): void {
    const cmp = compareRuns(p1, p2);
    const winner: 0 | 1 | 2 = cmp < 0 ? 1 : cmp > 0 ? 2 : 0;

    this.gameOverBadgeEl.textContent = 'WYNIK POJEDYNKU (2 GRACZY)';
    this.gameOverBadgeEl.classList.remove('danger');
    if (winner === 1) {
      this.gameOverTitleEl.innerHTML = 'WYGRYWA <span>GRACZ 1!</span>';
    } else if (winner === 2) {
      this.gameOverTitleEl.innerHTML = 'WYGRYWA <span>GRACZ 2!</span>';
    } else {
      this.gameOverTitleEl.innerHTML = 'IDEALNY <span>REMIS!</span>';
    }

    this.gameOverStatsEl.textContent =
      'Ukończona runda bije nieukończoną • Wśród ukończonych wygrywa krótszy czas • Wśród nieukończonych dłuższe przeżycie • Remis: zabójstwa, potem monety.';

    this.duelScoreboardEl.innerHTML = `
      <div class="duel-player-box ${winner === 1 ? 'winner' : ''}">
        <div class="duel-p-name">GRACZ 1 ${winner === 1 ? '🏆' : ''}</div>
        <div class="duel-p-line">Status: <strong>${
          p1.completed ? 'UKOŃCZONA (3/3)' : `NIEUKOŃCZONA (${p1.stageReached}/3)`
        }</strong></div>
        <div class="duel-p-line">Prawdziwy czas: <strong>${formatPreciseTime(
          p1.realTimeSeconds
        )}</strong></div>
        <div class="duel-p-line">Zabójstwa: <strong>${p1.kills}</strong> • Monety: <strong>${
      p1.runCoins
    }</strong></div>
      </div>
      <div class="duel-player-box ${winner === 2 ? 'winner' : ''}">
        <div class="duel-p-name">GRACZ 2 ${winner === 2 ? '🏆' : ''}</div>
        <div class="duel-p-line">Status: <strong>${
          p2.completed ? 'UKOŃCZONA (3/3)' : `NIEUKOŃCZONA (${p2.stageReached}/3)`
        }</strong></div>
        <div class="duel-p-line">Prawdziwy czas: <strong>${formatPreciseTime(
          p2.realTimeSeconds
        )}</strong></div>
        <div class="duel-p-line">Zabójstwa: <strong>${p2.kills}</strong> • Monety: <strong>${
      p2.runCoins
    }</strong></div>
      </div>
    `;
    this.duelScoreboardEl.classList.remove('hidden');
    this.gameOverOverlay.classList.remove('hidden');
  }

  public hideGameOver(): void {
    this.gameOverOverlay.classList.add('hidden');
  }

  public update(
    dt: number,
    player: Player,
    upgrades: UpgradeSystem,
    stageNumber: number,
    roundTimeRemaining: number,
    distToGate: number,
    gateLocked: boolean,
    dayNight: DayNightCycle,
    damageFlash: number,
    isTwoPlayer: boolean,
    activePlayerNum: 1 | 2,
    level: LevelId = 1
  ): void {
    // Player & Stage header
    this.playerLabelEl.textContent = isTwoPlayer
      ? `POJEDYNEK • GRACZ ${activePlayerNum}`
      : 'KURIER PRÓBEK (1P)';
    this.streetEl.textContent = `ETAP ${stageNumber} / 3`;

    const metersToGate = Math.max(0, Math.round(distToGate));
    const gateStatus = gateLocked
      ? `Do bramy: ${metersToGate} m • Zamknięta (Pokonaj Bossa!)`
      : `Do bramy: ${metersToGate} m`;
    this.streetSubEl.textContent = gateStatus;

    // Persistent currencies on HUD
    this.hudTreeXpEl.textContent = String(upgrades.treeXp);
    this.hudCoinsEl.textContent = String(upgrades.coins);

    // Single Round Timer (2:00 -> 0:00 across all 3 stages)
    this.streetTimerEl.textContent = formatSecondsMMSS(roundTimeRemaining);
    const pctRemaining = Math.max(0, Math.min(100, (roundTimeRemaining / 120) * 100));
    this.dayBarEl.style.width = `${pctRemaining}%`;

    if (level === 2) {
      if (stageNumber === 1) {
        this.clockPanelEl.classList.add('night-mode');
        this.dayIconEl.textContent = '🔦';
        this.dayPhaseEl.textContent = 'ETAP 1/3 • PARKING POD SZPITALEM';
        this.nightOverlay.style.opacity = '0.7';
      } else if (stageNumber === 2) {
        this.clockPanelEl.classList.add('night-mode');
        this.dayIconEl.textContent = '🏥';
        this.dayPhaseEl.textContent = 'ETAP 2/3 • ODDZIAŁ SZPITALA';
        this.nightOverlay.style.opacity = '0.6';
      } else {
        this.clockPanelEl.classList.add('night-mode');
        this.dayIconEl.textContent = '🚁';
        this.dayPhaseEl.textContent = 'ETAP 3/3 • LĄDOWISKO NA DACHU';
        this.nightOverlay.style.opacity = '0.85';
      }
    } else if (stageNumber === 1) {
      this.clockPanelEl.classList.remove('night-mode');
      this.dayIconEl.textContent = '☀️';
      this.dayPhaseEl.textContent = 'ETAP 1/3 • KORDON (DZIEŃ)';
      this.nightOverlay.style.opacity = '0';
    } else if (stageNumber === 2) {
      this.clockPanelEl.classList.toggle('night-mode', dayNight.isNight);
      this.dayIconEl.textContent = '🌆';
      this.dayPhaseEl.textContent = 'ETAP 2/3 • WYGASZANE LATARNIE';
      this.nightOverlay.style.opacity = dayNight.isNight ? '0.65' : '0.25';
    } else {
      this.clockPanelEl.classList.add('night-mode');
      this.dayIconEl.textContent = '🌙';
      this.dayPhaseEl.textContent = 'ETAP 3/3 • DEAD NET LABS (NOC)';
      this.nightOverlay.style.opacity = '1';
    }

    if (dayNight.warningActive) {
      this.nightWarnEl.classList.add('visible');
    } else {
      this.nightWarnEl.classList.remove('visible');
    }

    // Combo update
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      this.comboPanelEl.classList.add('active');
      this.comboCountEl.textContent = `x${this.comboCount}`;
      this.comboBarEl.style.width = `${(this.comboTimer / this.maxComboTime) * 100}%`;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboPanelEl.classList.remove('active');
      }
    }

    // Center Banner timer
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerEl.classList.add('hidden');
      }
    }

    // Player Vitals: HP, Stamina, Special (Rzeź)
    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    this.hpFillEl.style.width = `${hpPct}%`;
    this.hpTextEl.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    const stamPct = Math.max(0, (player.stamina / player.maxStamina) * 100);
    this.staminaFillEl.style.width = `${stamPct}%`;
    this.staminaTextEl.textContent = `${Math.floor(player.stamina)} / ${player.maxStamina}`;

    const specPct = Math.max(0, Math.min(100, (player.special / player.maxSpecial) * 100));
    this.specialFillEl.style.width = `${specPct}%`;
    const isSpecReady = player.isSpecialFull();
    this.specialTextEl.textContent = isSpecReady
      ? 'GOTOWE! [E / F]'
      : `${Math.floor(player.special)} / ${player.maxSpecial}`;
    this.specialLabelEl.textContent = isSpecReady
      ? '⚡ RZEŹ GOTOWA — NACIŚNIJ [E / F]! ⚡'
      : 'SPECIAL — RZEŹ [E / F]';
    this.specialContainerEl.classList.toggle('ready', isSpecReady);
    this.badgeSpecialEl.classList.toggle('ready', isSpecReady);

    this.levelEl.textContent = `${stageNumber}/3`;
    this.killsEl.textContent = `☠️ ${player.kills}`;

    // Weapon slots
    this.meleeIconEl.textContent = player.meleeWeapon.icon;
    this.meleeNameEl.textContent = player.meleeWeapon.name;
    this.meleeDescEl.textContent = player.meleeWeapon.desc;

    this.rangedIconEl.textContent = player.rangedWeapon.icon;
    this.rangedNameEl.textContent = player.rangedWeapon.name;
    this.ammoTextEl.textContent = `AMUNICJA: ${player.ammo}`;

    this.damageOverlay.style.opacity = String(Math.min(0.85, damageFlash));

    // Update Floating Combat Numbers
    for (let i = this.floatingItems.length - 1; i >= 0; i--) {
      const item = this.floatingItems[i];
      item.life -= dt;
      item.worldPos.y += item.vy * dt;
      const screen = this.camera.worldToScreen(item.worldPos);
      const alpha = Math.max(0, item.life / item.maxLife);
      item.el.style.left = `${screen.x}px`;
      item.el.style.top = `${screen.y}px`;
      item.el.style.opacity = String(alpha);

      if (item.life <= 0) {
        item.el.remove();
        this.floatingItems.splice(i, 1);
      }
    }
  }
}
