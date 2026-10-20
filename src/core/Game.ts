import * as THREE from 'three';
import { InputManager } from './InputManager';
import { IsometricCamera } from './IsometricCamera';
import { PostProcessing } from './PostProcessing';
import { HitStopManager } from './HitStopManager';
import { CityWorld } from '../world/CityWorld';
import { DayNightCycle } from '../world/DayNightCycle';
import { Player } from '../entities/Player';
import { Dog } from '../entities/Dog';
import { Zombie } from '../entities/Zombie';
import { LootManager, LootDrop } from '../entities/Loot';
import { CombatSystem } from '../combat/CombatSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { WaveManager } from '../systems/WaveManager';
import {
  DifficultyId,
  DogModId,
  HighScoreEntry,
  LevelId,
  PlayerSkinId,
  SkillNodeId,
  UpgradeSystem,
  ZombieSkinId
} from '../systems/UpgradeSystem';
import { UIManager, PlayerRunSummary } from '../systems/UIManager';

function normalizeAngle(rad: number): number {
  while (rad > Math.PI) rad -= Math.PI * 2;
  while (rad < -Math.PI) rad += Math.PI * 2;
  return rad;
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private isoCamera: IsometricCamera;
  private postProcessing: PostProcessing;
  private input: InputManager;
  private hitStop: HitStopManager;

  private world: CityWorld;
  private dayNight: DayNightCycle;
  private player: Player;
  private dog: Dog;
  private loot: LootManager;
  private particles: ParticleSystem;
  private sound: SoundSystem;
  private waves: WaveManager;
  private upgrades: UpgradeSystem;
  private ui: UIManager;
  private combat: CombatSystem;

  private clock = new THREE.Clock();
  private elapsedTime = 0;
  private damageFlash = 0;
  private afterimageCooldown = 0;

  // Game states
  public state:
    | 'menu'
    | 'level_select'
    | 'difficulty_select'
    | 'dog_mod'
    | 'intro'
    | 'credits'
    | 'playing'
    | 'paused'
    | 'options'
    | 'tree'
    | 'shop'
    | 'p2_handoff'
    | 'gameover' = 'menu';

  private treeReturnState: 'menu' | 'paused' = 'menu';
  private dogModReturnState: 'menu' | 'paused' = 'menu';
  private optionsReturnState: 'menu' | 'paused' = 'menu';

  // Single 2:00 (120s) timer for the entire 3-stage round
  private readonly roundDuration = 120;
  private roundTimeRemaining = 120;
  private halfMinuteWarned = false;
  private currentLevel: LevelId = 1;
  private currentStreet = 1;
  private stageElapsed = 0;
  private runCoinsCollected = 0;

  // 1P vs 2P Hot-Seat Duel tracking
  private isTwoPlayer = false;
  private pendingTwoPlayer = false;
  private pendingLevel: LevelId = 1;
  private activePlayerNum: 1 | 2 = 1;
  private player1Summary: PlayerRunSummary | null = null;

  // Short-combo & Epic Kill Badge tracking
  private lastKillTimestamp = -10;
  private shortComboStreak = 0;
  private lastBarrelBadgeTime = -10;

  // Video Intro state (/movies/video01.mp4)
  private introVideoEl = document.getElementById('intro-video') as HTMLVideoElement;
  private introElapsed = 0;
  private introAfterAction: 'menu' | 'stage1' = 'menu';

  // Gamepad menu navigation index
  private padMenuIndex = 0;
  private dailyRewardChecked = false;
  private pendingDailyToast: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.isoCamera = new IsometricCamera();
    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.isoCamera.camera);
    this.input = new InputManager(canvas);
    this.hitStop = new HitStopManager();

    this.sound = new SoundSystem();
    this.particles = new ParticleSystem(this.scene);
    this.world = new CityWorld(this.scene);
    this.dayNight = new DayNightCycle(this.scene);
    this.player = new Player(this.scene);
    this.dog = new Dog(this.scene);
    this.loot = new LootManager(this.scene);
    this.waves = new WaveManager(this.scene);
    this.upgrades = new UpgradeSystem();
    this.ui = new UIManager(this.isoCamera);

    this.player.reset(this.upgrades);
    this.dog.resetForRound(
      this.upgrades.hasNode('dog'),
      this.upgrades.selectedDogMod,
      this.player.position
    );

    this.combat = new CombatSystem(
      this.player,
      this.world,
      this.particles,
      this.sound,
      this.hitStop,
      this.isoCamera,
      this.ui,
      (zombie, cause) => this.handleZombieKilled(zombie, cause)
    );

    this.setupMenus();
    this.checkOnlineDailyReward();

    // First-time visit starts video Intro automatically before Menu; subsequent visits go straight to Menu
    if (!this.upgrades.hasSeenIntro()) {
      this.upgrades.markIntroSeen();
      this.playIntroVideo('menu');
    } else {
      this.returnToMainMenu();
    }

    this.postProcessing.setVhsEnabled(this.upgrades.isVhsEnabled());

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private setupMenus(): void {
    const btn1P = document.getElementById('btn-1p')!;
    const btn2P = document.getElementById('btn-2p')!;
    const btnMenuTree = document.getElementById('btn-menu-tree')!;
    const btnMenuShop = document.getElementById('btn-menu-shop')!;
    const btnMenuDog = document.getElementById('btn-menu-dog')!;
    const btnOptions = document.getElementById('btn-options')!;
    const btnVhsToggle = document.getElementById('btn-vhs-toggle')!;
    const btnOptionsBack = document.getElementById('btn-options-back')!;
    const btnIntro = document.getElementById('btn-intro')!;
    const btnCredits = document.getElementById('btn-credits')!;
    const btnCreditsBack = document.getElementById('btn-credits-back')!;

    const btnHsLvl1 = document.getElementById('btn-hs-lvl1')!;
    const btnHsLvl2 = document.getElementById('btn-hs-lvl2')!;
    const btnHsLvl3 = document.getElementById('btn-hs-lvl3')!;

    const btnSelectLevel1 = document.getElementById('btn-select-level-1')!;
    const btnSelectLevel2 = document.getElementById('btn-select-level-2')!;
    const btnSelectLevel3 = document.getElementById('btn-select-level-3')!;
    const btnLevelSelectBack = document.getElementById('btn-level-select-back')!;

    const btnDiffEasy = document.getElementById('btn-diff-easy')!;
    const btnDiffNormal = document.getElementById('btn-diff-normal')!;
    const btnDiffHard = document.getElementById('btn-diff-hard')!;
    const btnDiffBack = document.getElementById('btn-diff-back')!;

    const btnDogModBack = document.getElementById('btn-dog-mod-back')!;

    const btnPauseResume = document.getElementById('btn-pause-resume')!;
    const btnPauseTree = document.getElementById('btn-pause-tree')!;
    const btnPauseDog = document.getElementById('btn-pause-dog')!;
    const btnPauseOptions = document.getElementById('btn-pause-options')!;
    const btnPauseMenu = document.getElementById('btn-pause-menu')!;

    const btnTreeBack = document.getElementById('btn-tree-back')!;
    const btnShopBack = document.getElementById('btn-shop-back')!;

    const btnStartP2 = document.getElementById('btn-start-p2')!;
    const restartBtn = document.getElementById('restart-btn')!;
    const menuReturnBtn = document.getElementById('menu-return-btn')!;
    const introOverlay = document.getElementById('intro-overlay')!;

    btn1P.addEventListener('click', () => {
      this.sound.init();
      this.openLevelSelect(false);
    });

    btn2P.addEventListener('click', () => {
      this.sound.init();
      this.openLevelSelect(true);
    });

    btnSelectLevel1.addEventListener('click', () => {
      this.sound.init();
      this.openDifficultySelect(1);
    });

    btnSelectLevel2.addEventListener('click', () => {
      this.sound.init();
      this.openDifficultySelect(2);
    });

    btnSelectLevel3.addEventListener('click', () => {
      this.sound.init();
      this.openDifficultySelect(3);
    });

    btnLevelSelectBack.addEventListener('click', () => {
      this.ui.hideLevelSelectModal();
      this.state = 'menu';
      this.padMenuIndex = 0;
      this.ui.showMainMenu(this.upgrades);
      this.syncPadMenuHighlight();
    });

    const selectDiffAndStart = (diff: DifficultyId) => {
      this.sound.init();
      this.upgrades.setDifficulty(diff);
      this.ui.hideDifficultySelectModal();
      this.startMatch(this.pendingTwoPlayer, this.pendingLevel);
    };

    btnDiffEasy.addEventListener('click', () => selectDiffAndStart('easy'));
    btnDiffNormal.addEventListener('click', () => selectDiffAndStart('normal'));
    btnDiffHard.addEventListener('click', () => selectDiffAndStart('hard'));

    btnDiffBack.addEventListener('click', () => {
      this.ui.hideDifficultySelectModal();
      this.openLevelSelect(this.pendingTwoPlayer);
    });

    btnHsLvl1.addEventListener('click', () => {
      this.ui.setHighScoreTab(1, this.upgrades);
    });

    btnHsLvl2.addEventListener('click', () => {
      this.ui.setHighScoreTab(2, this.upgrades);
    });

    btnHsLvl3.addEventListener('click', () => {
      this.ui.setHighScoreTab(3, this.upgrades);
    });

    btnMenuTree.addEventListener('click', () => {
      this.sound.init();
      this.openTreeModal('menu');
    });

    btnMenuShop.addEventListener('click', () => {
      this.sound.init();
      this.openShopModal();
    });

    btnOptions.addEventListener('click', () => {
      this.openOptions('menu');
    });

    btnPauseOptions.addEventListener('click', () => {
      this.openOptions('paused');
    });

    btnVhsToggle.addEventListener('click', () => {
      const next = !this.upgrades.isVhsEnabled();
      this.upgrades.setVhsEnabled(next);
      this.postProcessing.setVhsEnabled(next);
      this.ui.showOptions(next);
    });

    btnOptionsBack.addEventListener('click', () => {
      this.closeOptions();
    });

    btnMenuDog.addEventListener('click', () => {
      this.sound.init();
      this.openDogModModal('menu');
    });

    btnIntro.addEventListener('click', () => {
      this.sound.init();
      this.playIntroVideo('menu');
    });

    btnCredits.addEventListener('click', () => {
      this.state = 'credits';
      this.ui.showCredits();
    });

    btnCreditsBack.addEventListener('click', () => {
      this.state = 'menu';
      this.ui.hideCredits();
    });

    btnPauseResume.addEventListener('click', () => {
      this.resumeFromPause();
    });

    btnPauseTree.addEventListener('click', () => {
      this.openTreeModal('paused');
    });

    btnPauseDog.addEventListener('click', () => {
      this.openDogModModal('paused');
    });

    btnPauseMenu.addEventListener('click', () => {
      this.returnToMainMenu();
    });

    btnTreeBack.addEventListener('click', () => {
      this.closeTreeModal();
    });

    btnShopBack.addEventListener('click', () => {
      this.closeShopModal();
    });

    btnDogModBack.addEventListener('click', () => {
      this.closeDogModModal();
    });

    btnStartP2.addEventListener('click', () => {
      this.sound.init();
      this.ui.hidePlayer2Handoff();
      this.activePlayerNum = 2;
      this.startPlayerRound();
    });

    restartBtn.addEventListener('click', () => {
      this.ui.hideGameOver();
      this.startMatch(this.isTwoPlayer, this.currentLevel);
    });

    menuReturnBtn.addEventListener('click', () => {
      this.returnToMainMenu();
    });

    // End or error on video element finishes intro cleanly without blocking
    this.introVideoEl.addEventListener('ended', () => {
      if (this.state === 'intro') {
        this.finishIntro();
      }
    });

    this.introVideoEl.addEventListener('error', () => {
      if (this.state === 'intro') {
        this.finishIntro();
      }
    });

    // Skip intro on click or any key (including Esc)
    introOverlay.addEventListener('click', () => {
      if (this.state === 'intro' && this.introElapsed > 0.08) {
        this.finishIntro();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.state === 'intro' && this.introElapsed > 0.08) {
        this.finishIntro();
        return;
      }

      if (e.code === 'Escape') {
        if (this.state === 'playing') {
          this.pauseGame();
        } else if (this.state === 'paused') {
          this.resumeFromPause();
        } else if (this.state === 'tree') {
          this.closeTreeModal();
        } else if (this.state === 'shop') {
          this.closeShopModal();
        } else if (this.state === 'dog_mod') {
          this.closeDogModModal();
        } else if (this.state === 'options') {
          this.closeOptions();
        } else if (this.state === 'difficulty_select') {
          this.ui.hideDifficultySelectModal();
          this.openLevelSelect(this.pendingTwoPlayer);
        } else if (this.state === 'level_select') {
          this.ui.hideLevelSelectModal();
          this.state = 'menu';
          this.ui.showMainMenu(this.upgrades);
        }
        return;
      }

      // Nawigacja klawiaturą (Góra/Dół + Enter) w wyborze poziomu, trudności i menu — tak samo jak padem
      if (
        this.state === 'level_select' ||
        this.state === 'difficulty_select' ||
        this.state === 'menu' ||
        this.state === 'paused' ||
        this.state === 'options' ||
        this.state === 'gameover'
      ) {
        const buttons = this.getNavigableButtonsForState();
        if (buttons.length > 0) {
          if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            this.padMenuIndex = (this.padMenuIndex - 1 + buttons.length) % buttons.length;
            this.syncPadMenuHighlight(true);
          } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            this.padMenuIndex = (this.padMenuIndex + 1) % buttons.length;
            this.syncPadMenuHighlight(true);
          } else if (e.code === 'Enter') {
            e.preventDefault();
            this.padMenuIndex =
              ((this.padMenuIndex % buttons.length) + buttons.length) % buttons.length;
            buttons[this.padMenuIndex].click();
          }
        }
      }
    });
  }

  private checkOnlineDailyReward(): void {
    if (this.dailyRewardChecked) return;
    this.dailyRewardChecked = true;

    this.upgrades.claimDailyRewardOnline().then((result) => {
      let toastMsg: string | null = null;
      if (result.status === 'claimed') {
        this.ui.refreshMainMenuData(this.upgrades);
        toastMsg = `Dzień ${result.streak}: +${result.coins} monet`;
      } else if (result.status === 'offline') {
        toastMsg = 'Nagroda do odebrania po połączeniu';
      }

      if (toastMsg) {
        if (this.state === 'intro') {
          this.pendingDailyToast = toastMsg;
        } else {
          this.ui.showBanner(toastMsg, '', 3.5);
        }
      }
    });
  }

  private getNavigableButtonsForState(): HTMLButtonElement[] {
    let ids: string[] = [];
    if (this.state === 'menu') {
      ids = [
        'btn-1p',
        'btn-2p',
        'btn-menu-tree',
        'btn-menu-shop',
        'btn-menu-dog',
        'btn-options',
        'btn-intro',
        'btn-credits'
      ];
    } else if (this.state === 'level_select') {
      ids = [
        'btn-select-level-1',
        'btn-select-level-2',
        'btn-select-level-3',
        'btn-level-select-back'
      ];
    } else if (this.state === 'difficulty_select') {
      ids = ['btn-diff-easy', 'btn-diff-normal', 'btn-diff-hard', 'btn-diff-back'];
    } else if (this.state === 'paused') {
      ids = ['btn-pause-resume', 'btn-pause-tree', 'btn-pause-dog', 'btn-pause-options', 'btn-pause-menu'];
    } else if (this.state === 'options') {
      ids = ['btn-vhs-toggle', 'btn-options-back'];
    } else if (this.state === 'gameover') {
      ids = ['restart-btn', 'menu-return-btn'];
    } else if (this.state === 'p2_handoff') {
      ids = ['btn-start-p2'];
    } else if (this.state === 'credits') {
      ids = ['btn-credits-back'];
    }

    return ids
      .map((id) => document.getElementById(id) as HTMLButtonElement | null)
      .filter((btn): btn is HTMLButtonElement => Boolean(btn && !btn.classList.contains('hidden')));
  }

  private syncPadMenuHighlight(forceShow = false): void {
    document
      .querySelectorAll('.pad-focus')
      .forEach((el) => el.classList.remove('pad-focus'));

    const showFocus =
      forceShow ||
      this.input.gamepadConnected ||
      this.state === 'level_select' ||
      this.state === 'difficulty_select';
    if (!showFocus) return;
    const buttons = this.getNavigableButtonsForState();
    if (buttons.length === 0) return;

    this.padMenuIndex =
      ((this.padMenuIndex % buttons.length) + buttons.length) % buttons.length;
    buttons[this.padMenuIndex].classList.add('pad-focus');
  }

  private handleGamepadUiNavigation(): void {
    if (this.state === 'intro') {
      if (
        this.introElapsed > 0.08 &&
        (this.input.consumeJustPressed('PadA') || this.input.consumeJustPressed('PadStart'))
      ) {
        this.finishIntro();
      }
      return;
    }

    if (this.input.consumeJustPressed('PadStart')) {
      if (this.state === 'playing') {
        this.pauseGame();
        return;
      } else if (this.state === 'paused') {
        this.resumeFromPause();
        return;
      } else if (this.state === 'options') {
        this.closeOptions();
        return;
      } else if (this.state === 'difficulty_select') {
        this.ui.hideDifficultySelectModal();
        this.openLevelSelect(this.pendingTwoPlayer);
        return;
      } else if (this.state === 'level_select') {
        this.ui.hideLevelSelectModal();
        this.state = 'menu';
        this.padMenuIndex = 0;
        this.ui.showMainMenu(this.upgrades);
        this.syncPadMenuHighlight();
        return;
      }
    }

    if (this.state === 'playing') return;

    const buttons = this.getNavigableButtonsForState();
    if (buttons.length === 0) return;

    if (this.input.consumeJustPressed('PadUp')) {
      this.padMenuIndex = (this.padMenuIndex - 1 + buttons.length) % buttons.length;
      this.syncPadMenuHighlight();
    } else if (this.input.consumeJustPressed('PadDown')) {
      this.padMenuIndex = (this.padMenuIndex + 1) % buttons.length;
      this.syncPadMenuHighlight();
    } else if (this.input.consumeJustPressed('PadA')) {
      this.padMenuIndex =
        ((this.padMenuIndex % buttons.length) + buttons.length) % buttons.length;
      buttons[this.padMenuIndex].click();
      this.syncPadMenuHighlight();
    }
  }

  private openLevelSelect(twoPlayer: boolean): void {
    this.pendingTwoPlayer = twoPlayer;
    this.state = 'level_select';
    this.padMenuIndex = 0;
    this.ui.showLevelSelectModal(twoPlayer);
    this.syncPadMenuHighlight(true);
  }

  private openDifficultySelect(level: LevelId): void {
    this.pendingLevel = level;
    this.state = 'difficulty_select';
    const savedDiff = this.upgrades.selectedDifficulty;
    this.padMenuIndex = savedDiff === 'easy' ? 0 : savedDiff === 'normal' ? 1 : 2;
    this.ui.showDifficultySelectModal(level, savedDiff);
    this.syncPadMenuHighlight(true);
  }

  private pauseGame(): void {
    this.state = 'paused';
    this.padMenuIndex = 0;
    this.ui.showPauseModal(this.roundTimeRemaining, this.currentStreet, this.upgrades);
    this.syncPadMenuHighlight();
  }

  private resumeFromPause(): void {
    this.ui.hidePauseModal();
    this.state = 'playing';
    this.input.endFrame();
  }

  private openOptions(fromState: 'menu' | 'paused'): void {
    this.optionsReturnState = fromState;
    if (fromState === 'menu') {
      this.ui.hideMainMenu();
    } else {
      this.ui.hidePauseModal();
    }
    this.state = 'options';
    this.padMenuIndex = 0;
    this.ui.showOptions(this.upgrades.isVhsEnabled());
    this.syncPadMenuHighlight(true);
  }

  private closeOptions(): void {
    this.ui.hideOptions();
    this.padMenuIndex = 0;
    if (this.optionsReturnState === 'paused') {
      this.state = 'paused';
      this.ui.showPauseModal(this.roundTimeRemaining, this.currentStreet, this.upgrades);
      this.syncPadMenuHighlight();
      return;
    }
    this.state = 'menu';
    this.ui.showMainMenu(this.upgrades);
    this.syncPadMenuHighlight();
  }

  private openDogModModal(fromState: 'menu' | 'paused'): void {
    this.dogModReturnState = fromState;
    if (fromState === 'menu') {
      this.ui.hideMainMenu();
    } else {
      this.ui.hidePauseModal();
    }
    this.state = 'dog_mod';

    const handleSelectMod = (modId: DogModId) => {
      this.upgrades.setDogMod(modId);
      this.sound.playPickup(true);
      this.dog.syncWithUpgrades(
        this.upgrades.hasNode('dog'),
        this.upgrades.selectedDogMod,
        this.player.position
      );
      this.ui.renderDogModModal(this.upgrades, handleSelectMod);
      this.ui.refreshMainMenuData(this.upgrades);
    };

    this.ui.showDogModModal(this.upgrades, handleSelectMod);
  }

  private closeDogModModal(): void {
    this.ui.hideDogModModal();
    if (this.dogModReturnState === 'paused') {
      this.state = 'paused';
      this.ui.showPauseModal(this.roundTimeRemaining, this.currentStreet, this.upgrades);
    } else {
      this.state = 'menu';
      this.ui.showMainMenu(this.upgrades);
    }
  }

  private openTreeModal(fromState: 'menu' | 'paused'): void {
    this.treeReturnState = fromState;
    if (fromState === 'menu') {
      this.ui.hideMainMenu();
    } else {
      this.ui.hidePauseModal();
    }
    this.state = 'tree';

    const handleUnlock = (nodeId: SkillNodeId) => {
      if (this.upgrades.unlockNode(nodeId)) {
        this.sound.playLevelUp();
        this.player.applySkillTree(this.upgrades, false);
        this.dog.syncWithUpgrades(
          this.upgrades.hasNode('dog'),
          this.upgrades.selectedDogMod,
          this.player.position
        );
        this.ui.renderTreeModal(this.upgrades, handleUnlock);
        this.ui.refreshMainMenuData(this.upgrades);
      }
    };

    this.ui.showTreeModal(this.upgrades, handleUnlock);
  }

  private closeTreeModal(): void {
    this.ui.hideTreeModal();
    if (this.treeReturnState === 'paused') {
      this.state = 'paused';
      this.ui.showPauseModal(this.roundTimeRemaining, this.currentStreet, this.upgrades);
    } else {
      this.state = 'menu';
      this.ui.showMainMenu(this.upgrades);
    }
  }

  private openShopModal(): void {
    this.ui.hideMainMenu();
    this.state = 'shop';

    const handlePlayerSkin = (skinId: PlayerSkinId) => {
      const res = this.upgrades.buyOrEquipPlayerSkin(skinId);
      if (res.changed) {
        this.sound.playPickup(res.bought);
        this.ui.renderShopModal(this.upgrades, handlePlayerSkin, handleZombieSkin);
        this.ui.refreshMainMenuData(this.upgrades);
      }
    };

    const handleZombieSkin = (skinId: ZombieSkinId) => {
      const res = this.upgrades.buyOrEquipZombieSkin(skinId);
      if (res.changed) {
        this.sound.playPickup(res.bought);
        this.ui.renderShopModal(this.upgrades, handlePlayerSkin, handleZombieSkin);
        this.ui.refreshMainMenuData(this.upgrades);
      }
    };

    this.ui.showShopModal(this.upgrades, handlePlayerSkin, handleZombieSkin);
  }

  private closeShopModal(): void {
    this.ui.hideShopModal();
    this.state = 'menu';
    this.ui.showMainMenu(this.upgrades);
  }

  private playIntroVideo(
    afterAction: 'menu' | 'stage1',
    videoSrc = '/movies/video01.mp4'
  ): void {
    this.state = 'intro';
    this.introAfterAction = afterAction;
    this.introElapsed = 0;
    this.upgrades.markIntroSeen();
    this.ui.showIntroOverlay();

    try {
      this.introVideoEl.muted = true;
      this.introVideoEl.defaultMuted = true;
      this.introVideoEl.volume = 0;
      this.introVideoEl.controls = false;
      if (this.introVideoEl.getAttribute('src') !== videoSrc) {
        this.introVideoEl.setAttribute('src', videoSrc);
        this.introVideoEl.load();
      }
      this.introVideoEl.currentTime = 0;
      const playPromise = this.introVideoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (this.state === 'intro') {
            this.finishIntro();
          }
        });
      }
    } catch {
      this.finishIntro();
    }
  }

  private finishIntro(): void {
    try {
      this.introVideoEl.pause();
    } catch {
      // Ignore
    }
    this.upgrades.markIntroSeen();
    this.ui.hideIntroOverlay();
    this.input.endFrame();

    if (this.introAfterAction === 'stage1') {
      this.startPlayerRound();
    } else {
      this.returnToMainMenu();
    }
  }

  private returnToMainMenu(): void {
    this.state = 'menu';
    this.padMenuIndex = 0;
    this.waves.clearZombies();
    this.loot.clearAll();
    this.particles.clearAll();
    this.world.loadStreet(1, this.currentLevel);
    this.dayNight.setStreetEnvironment(1, 0, this.currentLevel);
    this.player.reset(this.upgrades);
    this.player.placeAtStreetStart(this.world.playerSpawnPoint);
    this.dog.resetForRound(
      this.upgrades.hasNode('dog'),
      this.upgrades.selectedDogMod,
      this.player.position
    );
    this.ui.setHighScoreTab(this.currentLevel, this.upgrades);
    this.ui.setHudVisible(true);
    this.ui.showMainMenu(this.upgrades);
    this.syncPadMenuHighlight();

    if (this.pendingDailyToast) {
      const msg = this.pendingDailyToast;
      this.pendingDailyToast = null;
      this.ui.showBanner(msg, '', 3.5);
    }
  }

  private startMatch(twoPlayer: boolean, level: LevelId = 1): void {
    this.isTwoPlayer = twoPlayer;
    this.currentLevel = level;
    this.activePlayerNum = 1;
    this.player1Summary = null;
    this.ui.hideMainMenu();
    this.ui.setHighScoreTab(level, this.upgrades);
    // Przerywnik rozdziału zależny od wybranego poziomu (video01 przed P1, video02 przed P2, video03 przed P3).
    // Brak pliku nie blokuje startu, a Gracz 2 w pojedynku nie ogląda przerywnika drugi raz.
    const chapterVideo =
      level === 3
        ? '/movies/video03.mp4'
        : level === 2
        ? '/movies/video02.mp4'
        : '/movies/video01.mp4';
    this.playIntroVideo('stage1', chapterVideo);
  }

  private startPlayerRound(): void {
    // Wybrany wygląd i trudność wchodzą od startu rundy
    this.waves.activeZombieSkin = this.upgrades.selectedZombieSkin;
    this.waves.activeDifficulty = this.upgrades.selectedDifficulty;
    this.combat.activeDifficulty = this.upgrades.selectedDifficulty;
    this.player.reset(this.upgrades);
    this.particles.clearAll();
    this.ui.clearEpicBadges();
    this.lastKillTimestamp = -10;
    this.shortComboStreak = 0;
    this.lastBarrelBadgeTime = -10;

    // Jeden wspólny licznik 2:00 (120 s) na całą rundę 3 etapów
    this.roundTimeRemaining = this.roundDuration;
    this.halfMinuteWarned = false;
    this.runCoinsCollected = 0;

    this.loadStage(1);
    this.dog.resetForRound(
      this.upgrades.hasNode('dog'),
      this.upgrades.selectedDogMod,
      this.player.position
    );
    this.ui.setHudVisible(true);
    this.state = 'playing';
  }

  private loadStage(stageIndex: number): void {
    // Uwaga: przejście przez bramę NIE resetuje roundTimeRemaining ani NIE dodaje sekund!
    this.currentStreet = stageIndex;
    this.stageElapsed = 0;

    this.world.loadStreet(stageIndex, this.currentLevel);
    this.dayNight.setStreetEnvironment(stageIndex, 0, this.currentLevel);
    this.player.placeAtStreetStart(this.world.playerSpawnPoint);
    this.dog.placeAtPlayer(this.player.position);
    this.loot.spawnStreetSupplies(stageIndex, this.currentLevel);
    this.waves.loadStreetEncounters(stageIndex, this.currentLevel);

    if (this.currentLevel === 3) {
      if (stageIndex === 1) {
        this.ui.showBanner(
          'ETAP 1 / 3 — TUNEL DWORCA',
          'Brama za drugim zakrętem. Latarka wskazuje drogę między plamami światła!'
        );
      } else if (stageIndex === 2) {
        this.ui.showBanner(
          'ETAP 2 / 3 — TORY KOLEJOWE',
          'Szybka droga biegnie środkowym torem — przeskakuj wagony [Spacja / A]!'
        );
      } else {
        this.sound.playNightHorn();
        this.ui.showBanner(
          'ETAP 3 / 3 — HALA DWORCA',
          'Boss stoi na środku hali! Pokonaj go, aby otworzyć bramę na końcu!'
        );
      }
      return;
    }

    if (this.currentLevel === 2) {
      if (stageIndex === 1) {
        this.ui.showBanner(
          'ETAP 1 / 3 — PARKING POD SZPITALEM',
          'Brama jest z boku za dwoma zakrętami. Użyj latarki i omiń zatoki!'
        );
      } else if (stageIndex === 2) {
        this.ui.showBanner(
          'ETAP 2 / 3 — ODDZIAŁ SZPITALA',
          'Czas leci dalej! Sprintuj środkiem przez trzy progi drzwi!'
        );
      } else {
        this.sound.playNightHorn();
        this.ui.showBanner(
          'ETAP 3 / 3 — LĄDOWISKO NA DACHU',
          'Pokonaj Bossa przy bramie celu przed upływem czasu!'
        );
      }
      return;
    }

    if (stageIndex === 1) {
      this.ui.showBanner(
        'ETAP 1 / 3 — KORDON DZIENNY',
        'Jeden licznik 2:00 na całą rundę. Przebij się do bramy na północy!'
      );
    } else if (stageIndex === 2) {
      this.ui.showBanner(
        'ETAP 2 / 3 — WYGASZANE LATARNIE',
        'Czas leci dalej! Przeskakuj wraki (Spacja) i idź do kolejnej bramy!'
      );
    } else {
      this.sound.playNightHorn();
      this.ui.showBanner(
        'ETAP 3 / 3 — DEAD NET LABS (NOC)',
        'Pokonaj Bossa i wejdź w bramę celu przed upływem czasu!'
      );
    }
  }

  private onGateEntered(): void {
    if (this.currentStreet < 3) {
      // Etap 1 i 2: brama przełącza na następną ulicę bez resetu i bez dodawania czasu
      this.loadStage(this.currentStreet + 1);
      return;
    }

    // Etap 3: brama celu otwarta po śmierci bossa -> jedyny warunek zaliczenia rundy!
    this.finishPlayerRun('completed');
  }

  private finishPlayerRun(reason: 'completed' | 'timeout' | 'dead'): void {
    const completed = reason === 'completed';
    // Prawdziwy czas od startu rundy do śmierci albo do bramy celu (bez doliczania pełnych 120s za etap)
    const realTimeSeconds = Math.max(
      0,
      Math.min(this.roundDuration, this.roundDuration - this.roundTimeRemaining)
    );

    const summary: PlayerRunSummary = {
      playerNumber: this.activePlayerNum,
      completed,
      realTimeSeconds,
      stageReached: this.currentStreet,
      kills: this.player.kills,
      runCoins: this.runCoinsCollected
    };

    const hsEntry: HighScoreEntry = {
      label: this.isTwoPlayer ? `Gracz ${this.activePlayerNum}` : 'Kurier',
      completed,
      realTimeSeconds,
      stageReached: this.currentStreet,
      kills: this.player.kills,
      runCoins: this.runCoinsCollected,
      timestamp: Date.now()
    };
    // Zapisuje do Top 10 osobno dla wybranego poziomu (1 albo 2)
    this.upgrades.recordHighScore(hsEntry, this.currentLevel);

    if (this.isTwoPlayer && this.activePlayerNum === 1) {
      this.player1Summary = summary;
      this.state = 'p2_handoff';
      this.ui.showPlayer2Handoff(summary);
    } else if (this.isTwoPlayer && this.activePlayerNum === 2 && this.player1Summary) {
      this.state = 'gameover';
      this.ui.showDuelSummary(this.player1Summary, summary);
    } else {
      this.state = 'gameover';
      this.ui.showSinglePlayerSummary(summary, reason);
    }
  }

  private handleZombieKilled(zombie: Zombie, cause: string): void {
    this.player.kills++;
    this.ui.addKillCombo();

    // Krótkie kombo do odznaki SERIA (trzecie zabójstwo w krótkim odstępie)
    if (this.elapsedTime - this.lastKillTimestamp <= 1.85) {
      this.shortComboStreak++;
    } else {
      this.shortComboStreak = 1;
    }
    this.lastKillTimestamp = this.elapsedTime;

    if (this.shortComboStreak === 3) {
      this.ui.showEpicBadge('SERIA', '⚡');
      this.shortComboStreak = 0;
    }

    // Epickie odznaki zabójstw (prawy górny róg, 1.4 s, stos, bez zatrzymywania gry)
    if (zombie.isBoss) {
      this.ui.showEpicBadge('BOSS', '👑');
    } else if (cause === 'headshot') {
      this.ui.showEpicBadge('HEADSHOT', '🎯');
    } else if (cause === 'spikes') {
      this.ui.showEpicBadge('NA KOLCE', '⚠');
    } else if (cause === 'explosion') {
      if (this.elapsedTime - this.lastBarrelBadgeTime > 0.25) {
        this.lastBarrelBadgeTime = this.elapsedTime;
        this.ui.showEpicBadge('BECZKA', '💥');
      }
    } else if (
      cause === 'dog_kiel' ||
      cause === 'dog_warta' ||
      cause === 'dog_trop'
    ) {
      this.ui.showEpicBadge('PIESEK', '🐕');
    }

    // Zabójstwo: +14 do paska Special (Adrenalina mnoży razy 1.25 wewnątrz addSpecial)
    this.player.addSpecial(14);

    // XP za zabójstwo bez mnożnika nocy powyżej 1.15 i bez premii z komba
    const nightMult = this.dayNight.isNight ? 1.15 : 1.0;
    const killXp = Math.round(zombie.xpValue * nightMult);
    this.upgrades.addTreeXp(killXp);

    this.loot.spawnDropFromZombie(
      zombie.position,
      zombie.isBoss,
      zombie.type === 'tank',
      this.upgrades.selectedDifficulty
    );
  }

  private handleLootCollected(drop: LootDrop): void {
    if (drop.type === 'xp') {
      // Kule XP dają po 8
      this.sound.playPickup(false);
      this.upgrades.addTreeXp(8);
      this.ui.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 1.9, 0)),
        '+8 XP',
        '#6ce5ff',
        false,
        'xp'
      );
    } else if (drop.type === 'coin') {
      this.sound.playPickup(true);
      this.upgrades.addCoins(drop.value);
      this.runCoinsCollected += drop.value;
      this.ui.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        `+${drop.value} 🪙`,
        '#ffd166',
        false,
        'loot'
      );
    } else if (drop.type === 'health') {
      this.sound.playPickup(false);
      const diffCfg = this.upgrades.getDifficultyConfig();
      const healAmount = Math.max(
        5,
        Math.round((drop.value + this.player.medkitBonusHp) * diffCfg.medkitHealMult)
      );
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      this.ui.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        `+${healAmount} HP`,
        '#39ff7a',
        false,
        'heal'
      );
    } else if (drop.type === 'ammo') {
      this.sound.playPickup(false);
      this.player.ammo += drop.value;
      this.ui.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        `+${drop.value} AMMO`,
        '#ffbe0b'
      );
    }
  }

  private damagePlayer(amount: number): void {
    if (this.player.invulnerableTimer > 0 || this.state !== 'playing') return;
    this.player.hp -= amount;
    this.player.invulnerableTimer = 0.45;
    this.damageFlash = 0.85;
    this.isoCamera.addShake(0.45);
    this.sound.playHit(false);

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.finishPlayerRun('dead');
    }
  }

  public start(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      const rawDt = Math.min(this.clock.getDelta(), 0.05);
      this.update(rawDt);
      this.postProcessing.render();
    };
    animate();
  }

  private update(rawDt: number): void {
    this.elapsedTime += rawDt;
    this.input.pollGamepad();
    this.input.updateMouseWorld(this.isoCamera.camera);
    this.ui.tickToastAndPad(rawDt, this.input.gamepadConnected);
    this.handleGamepadUiNavigation();

    if (this.damageFlash > 0) {
      this.damageFlash = Math.max(0, this.damageFlash - rawDt * 2.5);
    }

    // Fullscreen video intro state (/movies/video01.mp4)
    if (this.state === 'intro') {
      this.introElapsed += rawDt;
      this.input.endFrame();
      return;
    }

    // Pause, Tree, Shop, Menu, Handoff, Gameover -> round timer and combat are frozen!
    if (this.state !== 'playing') {
      this.syncPadMenuHighlight();
      this.world.update(rawDt, this.elapsedTime, 0);
      this.particles.update(rawDt);
      this.isoCamera.update(rawDt, this.player.position, this.input.mouseWorld);
      this.postProcessing.update(this.dayNight.nightFactor, this.damageFlash);
      this.input.endFrame();
      return;
    }

    const dt = this.hitStop.getEffectiveDelta(rawDt);

    // Jeden wspólny licznik 2:00 (120 s) na całą rundę
    this.roundTimeRemaining = Math.max(0, this.roundTimeRemaining - dt);
    this.stageElapsed += dt;

    // Przy 0:30 jednorazowy napis: „Pół minuty. Biegnij do bramy.” (bez zatrzymywania gry)
    if (this.roundTimeRemaining <= 30 && !this.halfMinuteWarned && this.roundTimeRemaining > 0) {
      this.halfMinuteWarned = true;
      this.ui.showBanner('Pół minuty. Biegnij do bramy.', '');
    }

    // Postęp wizualny oświetlenia na bieżącym etapie + gasnące po kolei latarnie i progi drzwiowe na etapie 2
    const stageVisualProgress = Math.min(1, this.stageElapsed / 42);
    this.dayNight.setStreetEnvironment(
      this.currentStreet,
      stageVisualProgress,
      this.currentLevel
    );
    const keepLightDelay = this.currentStreet === 2 && this.player.keepLightStage2 ? 1.0 : 0.0;
    this.world.update(
      dt,
      this.elapsedTime,
      this.player.position.z,
      keepLightDelay,
      (lampZ) => {
        if (this.currentStreet === 2 && this.currentLevel === 1) {
          this.waves.spawnRearRunnersAtLamp(lampZ, this.player.position.z);
        }
      },
      (doorRunners) => {
        // Na etapie 2 poziomu 2 (Oddział) Runnerzy wychodzą z nisz za plecami gracza po minięciu progu drzwi
        this.waves.spawnDoorThresholdRunners(doorRunners);
      }
    );

    // Czas 0:00 w dowolnym etapie = porażka
    if (this.roundTimeRemaining <= 0) {
      this.finishPlayerRun('timeout');
      this.input.endFrame();
      return;
    }

    // Player Dash / Parkour Vault input (Spacja)
    if (this.input.consumeJustPressed('Space')) {
      const moveVec = this.input.getMoveVector();
      const dashOrigin = this.player.position.clone();
      if (this.player.startDash(moveVec, this.currentStreet)) {
        this.sound.playDash();
        // Dash: +8 do paska special
        this.player.addSpecial(8);

        // Węzeł „Wybuchowy parkour”: Dash zostawia falę uderzeniową
        if (this.player.explosiveDash) {
          this.particles.spawnShockwaveRing(dashOrigin, 3.6, 0x00e5ff, 0.32);
          this.particles.spawnExplosion(dashOrigin, 0x00e5ff, 3.2);
          for (const z of this.waves.zombies) {
            if (z.isDead) continue;
            const toZ = new THREE.Vector3().subVectors(z.position, dashOrigin);
            toZ.y = 0;
            if (toZ.length() < 3.6) {
              const dir = toZ.lengthSq() > 0.001 ? toZ.normalize() : new THREE.Vector3(0, 0, -1);
              this.combat.damageZombie(z, 55, dir, 18, false, this.waves.zombies);
            }
          }
        }
      }
    }

    // Special „Rzeź” (E albo F) — działa tylko przy pełnym pasku 100/100 i zużywa go do zera
    if (
      this.input.consumeJustPressed('KeyE') ||
      this.input.consumeJustPressed('KeyF')
    ) {
      this.combat.performSpecialCarnage(this.waves.zombies);
    }

    // Player Melee & Ranged combat inputs (LPM or RT on Xbox pad; PPM / Q or LT on Xbox pad)
    if (this.input.isMeleeDown()) {
      this.combat.performMeleeAttack(this.waves.zombies, this.currentStreet);
    }
    if (
      this.input.rightMouseJustPressed ||
      this.input.consumeJustPressed('KeyQ')
    ) {
      this.combat.performRangedAttack(this.waves.zombies);
    }

    // Update Player movement & animations (right stick overrides mouse aim when moved on pad)
    const padAim =
      this.input.gamepadConnected && this.input.gamepadAimActive
        ? this.input.gamepadAimAngle
        : null;
    const playerStatus = this.player.update(
      dt,
      this.input.getMoveVector(),
      this.input.mouseWorld,
      this.world.obstacles,
      this.world.arenaHalfWidth,
      this.world.arenaHalfLength,
      this.dayNight.isNight,
      this.currentStreet,
      padAim
    );

    if (playerStatus.spawnedAfterimage) {
      this.afterimageCooldown -= dt;
      if (this.afterimageCooldown <= 0) {
        this.afterimageCooldown = 0.045;
        this.particles.spawnDashAfterimage(this.player.position, this.player.aimAngle);
      }
    }

    // Na etapie 2 dash przez wrak ściąga dodatkowych Runnerów z zgaszonej strefy (chyba że gracz ma węzeł „Cichy wrak”)
    if (
      this.currentStreet === 2 &&
      playerStatus.vaultedObstacle &&
      !playerStatus.vaultedObstacle.noiseTriggered
    ) {
      playerStatus.vaultedObstacle.noiseTriggered = true;
      if (!this.player.silentWreckStage2) {
        this.waves.spawnWreckNoiseRunners(this.player.position.z);
      }
    }

    // Update Stage Encounters & Zombies
    this.waves.update(
      dt,
      this.player.position,
      this.stageElapsed,
      (title, sub) => this.ui.showBanner(title, sub),
      () => {
        // Boss defeated on Stage 3 -> unlock goal gate!
        this.world.unlockGate();
        this.ui.showBanner(
          'BOSS POKONANY — BRAMA CELU OTWARTA!',
          'Wejdź w bramę celu przed końcem czasu, aby zaliczyć rundę!'
        );
      }
    );

    // Update Dog Companion (autonomous 8s cooldown pounce: Kieł / Warta / Trop)
    this.dog.update(
      dt,
      this.player,
      this.waves.zombies,
      this.world.gatePosition,
      this.combat,
      this.particles,
      this.sound
    );

    // Węzeł „Good night, good luck” (UV) oraz „Zostaw światło” (na etapie 2 stożek latarki trzyma Runnerów z tyłu w spowolnieniu)
    if (this.player.uvFlashlight || (this.currentStreet === 2 && this.player.keepLightStage2)) {
      const coneHalfAngle = this.player.cameraOnPerk ? Math.PI * 0.34 : Math.PI * 0.25;
      for (const z of this.waves.zombies) {
        if (z.isDead) continue;
        const toZ = new THREE.Vector3().subVectors(z.position, this.player.position);
        toZ.y = 0;
        const d = toZ.length();
        if (d <= 15.0) {
          const relYaw = normalizeAngle(Math.atan2(toZ.x, toZ.z) - this.player.aimAngle);
          const inCone = Math.abs(relYaw) <= coneHalfAngle;
          const isRearRunnerStage2 =
            this.currentStreet === 2 &&
            this.player.keepLightStage2 &&
            z.type === 'runner' &&
            z.position.z > this.player.position.z - 0.5;
          if (
            (this.player.uvFlashlight && inCone) ||
            (isRearRunnerStage2 && (inCone || d <= 12.5))
          ) {
            z.blindedTimer = 0.45;
          }
        }
      }
    }

    for (const z of this.waves.zombies) {
      if (z.isDead) continue;
      if (Math.random() < 0.004) {
        this.sound.playZombieGroan(this.dayNight.isNight);
      }

      const zResult = z.update(
        dt,
        this.player.position,
        this.dayNight.isNight,
        this.currentStreet,
        this.world.obstacles,
        this.world.arenaHalfWidth,
        this.world.arenaHalfLength
      );

      if (zResult.burnTickDamage > 0) {
        this.combat.damageZombie(
          z,
          zResult.burnTickDamage,
          new THREE.Vector3(0, 0, 0),
          0,
          false,
          this.waves.zombies,
          'burn'
        );
      }

      if (z.isDead) continue;

      if (zResult.attackedPlayer) {
        this.damagePlayer(z.damage * (this.dayNight.isNight ? 1.25 : 1.0));
      }

      if (zResult.tankShockwave) {
        const ringRadius = z.isBoss ? 5.2 : 4.1;
        this.particles.spawnShockwaveRing(z.position, ringRadius, 0xff2a3f, 0.45);
        this.isoCamera.addShake(z.isBoss ? 0.65 : 0.45);
        this.sound.playHit(true);
        if (this.player.position.distanceTo(z.position) <= ringRadius) {
          this.damagePlayer(z.damage);
        }
      }

      if (zResult.exploderTriggered) {
        this.combat.detonateExploderZombie(z, this.waves.zombies);
        if (this.player.position.distanceTo(z.position) <= 4.3) {
          this.damagePlayer(z.damage);
        }
      }
    }

    // Soft zombie-to-zombie separation
    const zs = this.waves.zombies;
    for (let i = 0; i < zs.length; i++) {
      for (let j = i + 1; j < zs.length; j++) {
        const a = zs[i];
        const b = zs[j];
        if (a.isDead || b.isDead) continue;
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const minDist = a.radius + b.radius;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDist * minDist && dSq > 0.0001) {
          const d = Math.sqrt(dSq);
          const overlap = (minDist - d) * 0.5;
          const nx = dx / d;
          const nz = dz / d;
          a.position.x -= nx * overlap;
          a.position.z -= nz * overlap;
          b.position.x += nx * overlap;
          b.position.z += nz * overlap;
        }
      }
    }

    // Environmental hazards (spikes & barrel collisions)
    this.combat.checkEnvironmentalHazards(this.waves.zombies);

    // Loot collection
    this.loot.update(dt, this.player.position, (drop) => this.handleLootCollected(drop));

    // Check Gate Entry: only entering an unlocked gate advances stage or completes Stage 3
    const distToGate = this.player.position.distanceTo(this.world.gatePosition);
    if (this.state === 'playing' && !this.world.gateLocked && distToGate <= 2.6) {
      this.onGateEntered();
    }

    // Update Particles, Camera, Postprocessing, and UI
    this.particles.update(dt);
    this.isoCamera.update(rawDt, this.player.position, this.input.mouseWorld);
    this.postProcessing.update(this.dayNight.nightFactor, this.damageFlash);
    this.ui.update(
      rawDt,
      this.player,
      this.upgrades,
      this.currentStreet,
      this.roundTimeRemaining,
      distToGate,
      this.world.gateLocked,
      this.dayNight,
      this.damageFlash,
      this.isTwoPlayer,
      this.activePlayerNum,
      this.currentLevel,
      this.input.gamepadConnected
    );

    this.input.endFrame();
  }
}
