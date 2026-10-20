export type SkillNodeId =
  | 'barbara'
  | 'dawn'
  | 'bub'
  | 'lucille'
  | 'dixon'
  | 'rick'
  | 'dog'
  | 'good_night'
  | 'brecken'
  | 'keep_light'
  | 'explosive_parkour'
  | 'camera_on'
  | 'adrenaline'
  | 'crownd'
  | 'silent_wreck'
  | 'carnage_spikes';

export type DogModId = 'kiel' | 'warta' | 'trop';
export type LevelId = 1 | 2 | 3;
export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  desc: string;
  zombieHpMult: number;
  zombieDmgMult: number;
  playerDmgMult: number;
  startAmmoMult: number;
  ammoDropChanceMult: number;
  medkitHealMult: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'ŁATWY',
    desc: 'Obrażenia gracza -15%, skromny zapas amunicji na start, ciasny start od pierwszej ulicy.',
    zombieHpMult: 1.05,
    zombieDmgMult: 1.05,
    playerDmgMult: 0.85,
    startAmmoMult: 0.65,
    ammoDropChanceMult: 0.7,
    medkitHealMult: 1.0
  },
  normal: {
    id: 'normal',
    name: 'NORMALNY (DOMYŚLNY)',
    desc: 'Zombie 1.5× HP i 1.35× obrażeń. Gracz 0.72× obrażeń, mniej naboi na start, rzadkie dropy.',
    zombieHpMult: 1.5,
    zombieDmgMult: 1.35,
    playerDmgMult: 0.72,
    startAmmoMult: 0.45,
    ammoDropChanceMult: 0.48,
    medkitHealMult: 0.9
  },
  hard: {
    id: 'hard',
    name: 'TRUDNY',
    desc: 'Zombie 1.95× HP i 1.65× obrażeń. Gracz 0.58× obrażeń, garść naboi, słabsze apteczki.',
    zombieHpMult: 1.95,
    zombieDmgMult: 1.65,
    playerDmgMult: 0.58,
    startAmmoMult: 0.25,
    ammoDropChanceMult: 0.35,
    medkitHealMult: 0.55
  }
};

export interface DogModDef {
  id: DogModId;
  name: string;
  desc: string;
}

export const DOG_MODS: DogModDef[] = [
  {
    id: 'kiel',
    name: 'Kieł',
    desc: 'Rzuca się na najbliższego zombie przed graczem. Walker i Runner giną od razu, Tank i boss dostają ugryzienie i odrzut.'
  },
  {
    id: 'warta',
    name: 'Warta',
    desc: 'Rzuca się na zombie najbliżej gracza w zasięgu ciosu. Zabija Walkera, Runnera i Explodera przed wybuchem, Tanka i bossa odpycha.'
  },
  {
    id: 'trop',
    name: 'Trop',
    desc: 'Ściąga z drogi zombie stojącego najbliżej linii do bramy. Walker i Runner giną, Tank jest odepchnięty w bok.'
  }
];

export type SkillBranchId = 'romero' | 'twd' | 'dying_light' | 'rec_l4d';

export interface SkillNodeDef {
  id: SkillNodeId;
  branch: SkillBranchId;
  name: string;
  icon: string;
  cost: number;
  requires?: SkillNodeId;
  effect: string;
}

export interface SkillBranchDef {
  id: SkillBranchId;
  title: string;
  nodes: SkillNodeDef[];
}

export type PlayerSkinId = 'kurier' | 'rick_cut' | 'brecken_scarf' | 'angela_cam';
export type ZombieSkinId = 'port' | 'romero' | 'volatile_uv' | 'rec';

export interface ShopSkinDef<T extends string> {
  id: T;
  name: string;
  cost: number;
  desc: string;
}

export interface HighScoreEntry {
  label: string;
  completed: boolean;
  realTimeSeconds: number;
  stageReached: number;
  kills: number;
  runCoins: number;
  timestamp: number;
}

export const SKILL_BRANCHES: SkillBranchDef[] = [
  {
    id: 'romero',
    title: 'Romero',
    nodes: [
      {
        id: 'barbara',
        branch: 'romero',
        name: 'Barbara',
        icon: '👁',
        cost: 450,
        effect: '+8% szansy na trafienie krytyczne.'
      },
      {
        id: 'dawn',
        branch: 'romero',
        name: 'Świt',
        icon: '☀',
        cost: 700,
        requires: 'barbara',
        effect: 'Na etapach 1–2 cięcia zadają +20% obrażeń.'
      },
      {
        id: 'bub',
        branch: 'romero',
        name: 'Bub',
        icon: '💀',
        cost: 900,
        requires: 'dawn',
        effect: 'Krytyk odrzuca mocniej.'
      }
    ]
  },
  {
    id: 'twd',
    title: 'The Walking Dead',
    nodes: [
      {
        id: 'lucille',
        branch: 'twd',
        name: 'Lucille',
        icon: '🏏',
        cost: 450,
        effect: 'Rzeź ma większy odrzut.'
      },
      {
        id: 'dixon',
        branch: 'twd',
        name: 'Szpital Dixona',
        icon: '🏥',
        cost: 700,
        requires: 'lucille',
        effect: 'Apteczki leczą +15 HP.'
      },
      {
        id: 'rick',
        branch: 'twd',
        name: 'Rick',
        icon: '🤠',
        cost: 900,
        requires: 'dixon',
        effect: '+12 amunicji na start rundy i strzały lekko mocniejsze.'
      },
      {
        id: 'dog',
        branch: 'twd',
        name: 'Pies',
        icon: '🐕',
        cost: 1000,
        requires: 'rick',
        effect: 'Pies przy nodze (Kieł, Warta, Trop — automat co 8 s).'
      }
    ]
  },
  {
    id: 'dying_light',
    title: 'Dying Light',
    nodes: [
      {
        id: 'good_night',
        branch: 'dying_light',
        name: 'Good night',
        icon: '🔦',
        cost: 450,
        effect: 'Latarka UV oślepia i spowalnia Volatile.'
      },
      {
        id: 'brecken',
        branch: 'dying_light',
        name: 'Brecken',
        icon: '🧣',
        cost: 700,
        requires: 'good_night',
        effect: 'Dash ma krótszy cooldown i tańszą staminę.'
      },
      {
        id: 'keep_light',
        branch: 'dying_light',
        name: 'Zostaw światło',
        icon: '💡',
        cost: 800,
        requires: 'brecken',
        effect: 'Latarnia gaśnie 1 s później, latarka spowalnia Runnerów z tyłu.'
      },
      {
        id: 'explosive_parkour',
        branch: 'dying_light',
        name: 'Wybuchowy parkour',
        icon: '💨',
        cost: 900,
        requires: 'brecken',
        effect: 'Dash zostawia falę uderzeniową.'
      }
    ]
  },
  {
    id: 'rec_l4d',
    title: 'REC / Left 4 Dead',
    nodes: [
      {
        id: 'camera_on',
        branch: 'rec_l4d',
        name: 'Nie wyłączaj kamery',
        icon: '📹',
        cost: 450,
        effect: 'Szerszy stożek latarki i mniejszy drain staminy na etapie 3.'
      },
      {
        id: 'adrenaline',
        branch: 'rec_l4d',
        name: 'Adrenalina',
        icon: '💉',
        cost: 700,
        requires: 'camera_on',
        effect: 'Pasek special ładuje się około 25% szybciej.'
      },
      {
        id: 'crownd',
        branch: 'rec_l4d',
        name: 'Cr0wnd',
        icon: '🎸',
        cost: 900,
        requires: 'adrenaline',
        effect: 'Cięcia mocniej odrzucają.'
      },
      {
        id: 'silent_wreck',
        branch: 'rec_l4d',
        name: 'Cichy wrak',
        icon: '🚗',
        cost: 800,
        requires: 'crownd',
        effect: 'Dash przez wrak na etapie 2 nie ściąga Runnerów.'
      },
      {
        id: 'carnage_spikes',
        branch: 'rec_l4d',
        name: 'Rzeź na kolce',
        icon: '⚠',
        cost: 1100,
        requires: 'crownd',
        effect: 'Rzeź ściąga trafionych na najbliższe kolce.'
      }
    ]
  }
];

export const PLAYER_SKINS: ShopSkinDef<PlayerSkinId>[] = [
  {
    id: 'kurier',
    name: 'Kurier',
    cost: 0,
    desc: 'Domyślny pancerz kuriera Starego Portu.'
  },
  {
    id: 'rick_cut',
    name: 'Rick z ostrzyżeniem',
    cost: 40,
    desc: 'Jaśniejsza kurtka i ciemny daszek.'
  },
  {
    id: 'brecken_scarf',
    name: 'Brecken',
    cost: 70,
    desc: 'Pomarańczowy szalik przy kapturze.'
  },
  {
    id: 'angela_cam',
    name: 'Ángela',
    cost: 70,
    desc: 'Biała koszula i czerwony akcent kamery na ramieniu.'
  }
];

export const ZOMBIE_SKINS: ShopSkinDef<ZombieSkinId>[] = [
  {
    id: 'port',
    name: 'Port',
    cost: 0,
    desc: 'Domyślny wygląd zarażonych z portu.'
  },
  {
    id: 'romero',
    name: 'Romero',
    cost: 50,
    desc: 'Szare ciało, mleczne oczy.'
  },
  {
    id: 'volatile_uv',
    name: 'Volatile UV',
    cost: 80,
    desc: 'Mocniejsze czerwone oczy także w dzień.'
  },
  {
    id: 'rec',
    name: 'REC',
    cost: 80,
    desc: 'Bledsze ciało i zielonkawy poblask.'
  }
];

const STORAGE_KEY_PROGRESSION = 'deadlight_rzeź_progression_v2';
const STORAGE_KEY_HIGHSCORES = 'deadlight_rzeź_highscores_v2';
const STORAGE_KEY_HIGHSCORES_L2 = 'deadlight_rzeź_highscores_l2_v2';
const STORAGE_KEY_HIGHSCORES_L3 = 'deadlight_rzeź_highscores_l3_v2';
const STORAGE_KEY_HIGHSCORES_SURVIVAL = 'deadlight_rzeź_highscores_survival_v1';
const STORAGE_KEY_INTRO_SEEN = 'deadlight_rzeź_intro_seen_v2';
const STORAGE_KEY_TUTORIAL_DONE = 'deadlight_rzeź_tutorial_done_v1';
const STORAGE_KEY_PLAYER_ID = 'deadlight_rzeź_player_id_v1';
const STORAGE_KEY_VHS = 'deadlight_rzeź_vhs_v1';

export interface SurvivalHighScoreEntry {
  wave: number;
  points: number;
  kills: number;
  runCoins: number;
  timestamp: number;
}

interface SavedProgressionData {
  treeXp: number;
  coins: number;
  unlockedNodes: SkillNodeId[];
  ownedPlayerSkins: PlayerSkinId[];
  selectedPlayerSkin: PlayerSkinId;
  ownedZombieSkins: ZombieSkinId[];
  selectedZombieSkin: ZombieSkinId;
  selectedDogMod?: DogModId;
  selectedDifficulty?: DifficultyId;
}

/**
 * Compares two run records according to the rules:
 * 1. Completed round beats incomplete round
 * 2. Among completed: shorter real time wins
 * 3. Among incomplete: longer survival time wins
 * 4. Tie-breaker: more kills, then more coins
 * Returns < 0 if `a` is better than `b`, > 0 if `b` is better than `a`, 0 if tied.
 */
export function compareRuns(
  a: Pick<HighScoreEntry, 'completed' | 'realTimeSeconds' | 'kills' | 'runCoins'>,
  b: Pick<HighScoreEntry, 'completed' | 'realTimeSeconds' | 'kills' | 'runCoins'>
): number {
  if (a.completed !== b.completed) {
    return a.completed ? -1 : 1;
  }
  const timeDiff = Math.abs(a.realTimeSeconds - b.realTimeSeconds);
  if (timeDiff >= 0.05) {
    if (a.completed) {
      // Shorter real time wins
      return a.realTimeSeconds < b.realTimeSeconds ? -1 : 1;
    } else {
      // Longer survival time wins
      return a.realTimeSeconds > b.realTimeSeconds ? -1 : 1;
    }
  }
  if (a.kills !== b.kills) {
    return b.kills - a.kills;
  }
  if (a.runCoins !== b.runCoins) {
    return b.runCoins - a.runCoins;
  }
  return 0;
}

export class UpgradeSystem {
  public treeXp = 0;
  public coins = 0;
  public unlockedNodes: Set<SkillNodeId> = new Set();
  public ownedPlayerSkins: Set<PlayerSkinId> = new Set(['kurier']);
  public selectedPlayerSkin: PlayerSkinId = 'kurier';
  public ownedZombieSkins: Set<ZombieSkinId> = new Set(['port']);
  public selectedZombieSkin: ZombieSkinId = 'port';
  public selectedDogMod: DogModId = 'kiel';
  public selectedDifficulty: DifficultyId = 'normal';
  public highScoresByLevel: Record<LevelId, HighScoreEntry[]> = {
    1: [],
    2: [],
    3: []
  };
  public survivalHighScores: SurvivalHighScoreEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public get highScores(): HighScoreEntry[] {
    return this.highScoresByLevel[1];
  }

  public getHighScores(level: LevelId): HighScoreEntry[] {
    return this.highScoresByLevel[level];
  }

  public getBestLevelPoints(level: LevelId): number {
    let best = 0;
    for (const entry of this.highScoresByLevel[level]) {
      const pts = entry.kills * 10 + entry.runCoins;
      if (pts > best) best = pts;
    }
    return best;
  }

  public getBestSurvivalPoints(): number {
    let best = 0;
    for (const entry of this.survivalHighScores) {
      if (entry.points > best) best = entry.points;
    }
    return best;
  }

  private loadFromStorage(): void {
    try {
      const rawProg = localStorage.getItem(STORAGE_KEY_PROGRESSION);
      if (rawProg) {
        const parsed = JSON.parse(rawProg) as Partial<SavedProgressionData>;
        this.treeXp = typeof parsed.treeXp === 'number' ? Math.max(0, Math.floor(parsed.treeXp)) : 0;
        this.coins = typeof parsed.coins === 'number' ? Math.max(0, Math.floor(parsed.coins)) : 0;
        if (Array.isArray(parsed.unlockedNodes)) {
          this.unlockedNodes = new Set(parsed.unlockedNodes);
        }
        if (Array.isArray(parsed.ownedPlayerSkins)) {
          this.ownedPlayerSkins = new Set(['kurier', ...parsed.ownedPlayerSkins]);
        }
        if (parsed.selectedPlayerSkin && this.ownedPlayerSkins.has(parsed.selectedPlayerSkin)) {
          this.selectedPlayerSkin = parsed.selectedPlayerSkin;
        }
        if (Array.isArray(parsed.ownedZombieSkins)) {
          this.ownedZombieSkins = new Set(['port', ...parsed.ownedZombieSkins]);
        }
        if (parsed.selectedZombieSkin && this.ownedZombieSkins.has(parsed.selectedZombieSkin)) {
          this.selectedZombieSkin = parsed.selectedZombieSkin;
        }
        if (
          parsed.selectedDogMod === 'kiel' ||
          parsed.selectedDogMod === 'warta' ||
          parsed.selectedDogMod === 'trop'
        ) {
          this.selectedDogMod = parsed.selectedDogMod;
        }
        if (
          parsed.selectedDifficulty === 'easy' ||
          parsed.selectedDifficulty === 'normal' ||
          parsed.selectedDifficulty === 'hard'
        ) {
          this.selectedDifficulty = parsed.selectedDifficulty;
        }
      }
    } catch {
      // Ignore storage errors
    }

    try {
      const rawScores1 = localStorage.getItem(STORAGE_KEY_HIGHSCORES);
      if (rawScores1) {
        const parsed = JSON.parse(rawScores1);
        if (Array.isArray(parsed)) {
          this.highScoresByLevel[1] = parsed.slice(0, 10);
          this.highScoresByLevel[1].sort(compareRuns);
        }
      }
    } catch {
      this.highScoresByLevel[1] = [];
    }

    try {
      const rawScores2 = localStorage.getItem(STORAGE_KEY_HIGHSCORES_L2);
      if (rawScores2) {
        const parsed = JSON.parse(rawScores2);
        if (Array.isArray(parsed)) {
          this.highScoresByLevel[2] = parsed.slice(0, 10);
          this.highScoresByLevel[2].sort(compareRuns);
        }
      }
    } catch {
      this.highScoresByLevel[2] = [];
    }

    try {
      const rawScores3 = localStorage.getItem(STORAGE_KEY_HIGHSCORES_L3);
      if (rawScores3) {
        const parsed = JSON.parse(rawScores3);
        if (Array.isArray(parsed)) {
          this.highScoresByLevel[3] = parsed.slice(0, 10);
          this.highScoresByLevel[3].sort(compareRuns);
        }
      }
    } catch {
      this.highScoresByLevel[3] = [];
    }

    try {
      const rawSurv = localStorage.getItem(STORAGE_KEY_HIGHSCORES_SURVIVAL);
      if (rawSurv) {
        const parsed = JSON.parse(rawSurv);
        if (Array.isArray(parsed)) {
          this.survivalHighScores = parsed.slice(0, 10);
          this.survivalHighScores.sort((a, b) => b.wave - a.wave || b.points - a.points);
        }
      }
    } catch {
      this.survivalHighScores = [];
    }
  }

  public saveProgression(): void {
    try {
      const data: SavedProgressionData = {
        treeXp: this.treeXp,
        coins: this.coins,
        unlockedNodes: Array.from(this.unlockedNodes),
        ownedPlayerSkins: Array.from(this.ownedPlayerSkins),
        selectedPlayerSkin: this.selectedPlayerSkin,
        ownedZombieSkins: Array.from(this.ownedZombieSkins),
        selectedZombieSkin: this.selectedZombieSkin,
        selectedDogMod: this.selectedDogMod,
        selectedDifficulty: this.selectedDifficulty
      };
      localStorage.setItem(STORAGE_KEY_PROGRESSION, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  public setDifficulty(diff: DifficultyId): void {
    this.selectedDifficulty = diff;
    this.saveProgression();
  }

  public getDifficultyConfig(): DifficultyConfig {
    return DIFFICULTY_CONFIGS[this.selectedDifficulty];
  }

  public setDogMod(modId: DogModId): void {
    this.selectedDogMod = modId;
    this.saveProgression();
  }

  public isVhsEnabled(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_VHS) !== '0';
    } catch {
      return true;
    }
  }

  public setVhsEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY_VHS, enabled ? '1' : '0');
    } catch {
      // Ignore
    }
  }

  public hasSeenIntro(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_INTRO_SEEN) === '1';
    } catch {
      return false;
    }
  }

  public markIntroSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY_INTRO_SEEN, '1');
    } catch {
      // Ignore
    }
  }

  public hasSeenTutorial(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_TUTORIAL_DONE) === '1';
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TUTORIAL_DONE, '1');
    } catch {
      // Ignore
    }
  }

  public recordSurvivalHighScore(entry: SurvivalHighScoreEntry): void {
    const list = [...this.survivalHighScores, entry];
    list.sort((a, b) => b.wave - a.wave || b.points - a.points);
    this.survivalHighScores = list.slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY_HIGHSCORES_SURVIVAL, JSON.stringify(this.survivalHighScores));
    } catch {
      // Ignore
    }
  }

  public addTreeXp(amount: number): void {
    if (amount <= 0) return;
    this.treeXp += Math.round(amount);
    this.saveProgression();
  }

  public addCoins(amount: number): void {
    if (amount <= 0) return;
    this.coins += Math.round(amount);
    this.saveProgression();
  }

  public hasNode(id: SkillNodeId): boolean {
    return this.unlockedNodes.has(id);
  }

  public canUnlockNode(node: SkillNodeDef): boolean {
    if (this.unlockedNodes.has(node.id)) return false;
    if (node.requires && !this.unlockedNodes.has(node.requires)) return false;
    return this.treeXp >= node.cost;
  }

  public isNodeLockedByPrereq(node: SkillNodeDef): boolean {
    if (!node.requires) return false;
    return !this.unlockedNodes.has(node.requires);
  }

  public unlockNode(nodeId: SkillNodeId): boolean {
    for (const branch of SKILL_BRANCHES) {
      for (const node of branch.nodes) {
        if (node.id === nodeId) {
          if (!this.canUnlockNode(node)) return false;
          this.treeXp -= node.cost;
          this.unlockedNodes.add(node.id);
          this.saveProgression();
          return true;
        }
      }
    }
    return false;
  }

  public buyOrEquipPlayerSkin(skinId: PlayerSkinId): { changed: boolean; bought: boolean } {
    const def = PLAYER_SKINS.find((s) => s.id === skinId);
    if (!def) return { changed: false, bought: false };

    if (this.ownedPlayerSkins.has(skinId)) {
      this.selectedPlayerSkin = skinId;
      this.saveProgression();
      return { changed: true, bought: false };
    }

    if (this.coins < def.cost) return { changed: false, bought: false };
    this.coins -= def.cost;
    this.ownedPlayerSkins.add(skinId);
    this.selectedPlayerSkin = skinId;
    this.saveProgression();
    return { changed: true, bought: true };
  }

  public buyOrEquipZombieSkin(skinId: ZombieSkinId): { changed: boolean; bought: boolean } {
    const def = ZOMBIE_SKINS.find((s) => s.id === skinId);
    if (!def) return { changed: false, bought: false };

    if (this.ownedZombieSkins.has(skinId)) {
      this.selectedZombieSkin = skinId;
      this.saveProgression();
      return { changed: true, bought: false };
    }

    if (this.coins < def.cost) return { changed: false, bought: false };
    this.coins -= def.cost;
    this.ownedZombieSkins.add(skinId);
    this.selectedZombieSkin = skinId;
    this.saveProgression();
    return { changed: true, bought: true };
  }

  /**
   * Attempts to record a run into Top 10 High Scores for the specified level.
   * Only inserts if Top 10 has < 10 entries or the new entry beats the worst entry.
   */
  public recordHighScore(entry: HighScoreEntry, level: LevelId = 1): boolean {
    const list = [...this.highScoresByLevel[level]];
    if (list.length < 10) {
      list.push(entry);
      list.sort(compareRuns);
      this.highScoresByLevel[level] = list;
      this.saveHighScores(level);
      return true;
    }

    const worst = list[list.length - 1];
    if (compareRuns(entry, worst) < 0) {
      list.push(entry);
      list.sort(compareRuns);
      this.highScoresByLevel[level] = list.slice(0, 10);
      this.saveHighScores(level);
      return true;
    }
    return false;
  }

  private saveHighScores(level: LevelId): void {
    try {
      const key =
        level === 3
          ? STORAGE_KEY_HIGHSCORES_L3
          : level === 2
          ? STORAGE_KEY_HIGHSCORES_L2
          : STORAGE_KEY_HIGHSCORES;
      localStorage.setItem(key, JSON.stringify(this.highScoresByLevel[level]));
    } catch {
      // Ignore
    }
  }

  public getOrCreatePlayerId(): string {
    try {
      const existing = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
      if (existing && existing.length >= 8) {
        return existing;
      }
      const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, generated);
      return generated;
    } catch {
      return 'anon-fallback-id';
    }
  }

  public async claimDailyRewardOnline(): Promise<
    | { status: 'claimed'; coins: number; streak: number }
    | { status: 'already_claimed'; streak: number }
    | { status: 'offline' }
  > {
    const id = this.getOrCreatePlayerId();
    try {
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        return { status: 'offline' };
      }

      const data = (await response.json()) as {
        coins?: unknown;
        streak?: unknown;
        alreadyClaimed?: unknown;
      };

      if (typeof data.streak !== 'number' || typeof data.alreadyClaimed !== 'boolean') {
        return { status: 'offline' };
      }

      if (data.alreadyClaimed) {
        return { status: 'already_claimed', streak: data.streak };
      }

      const grantedCoins = typeof data.coins === 'number' ? Math.max(0, Math.floor(data.coins)) : 0;
      if (grantedCoins > 0) {
        this.addCoins(grantedCoins);
      }
      return { status: 'claimed', coins: grantedCoins, streak: data.streak };
    } catch {
      return { status: 'offline' };
    }
  }
}
