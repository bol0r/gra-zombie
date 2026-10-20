import * as THREE from 'three';
import { ZombieType } from '../entities/Zombie';
import { LevelId } from '../systems/UpgradeSystem';

export interface ObstacleCollider {
  position: THREE.Vector3;
  radius: number;
  vaultable: boolean;
  noiseTriggered?: boolean;
}

export interface ExplosiveBarrel {
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  hp: number;
  exploded: boolean;
  respawnTimer: number;
}

export interface SpikeTrap {
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  cooldown: number;
}

export interface StreetLamp {
  z: number;
  light: THREE.PointLight;
  bulbMat: THREE.MeshStandardMaterial;
  flickerSpeed: number;
  flickerOffset: number;
  isFlickering: boolean;
  extinguishOnPass: boolean;
  passed: boolean;
  extinguishDelayTimer: number;
  extinguished: boolean;
  rearRunnersSpawned: boolean;
}

export interface EncounterSpawnDef {
  type: ZombieType;
  x: number;
  z: number;
  isBoss?: boolean;
}

export interface DoorThresholdDef {
  z: number;
  width: number;
  rearRunners: EncounterSpawnDef[];
}

export interface ActiveThresholdDoor {
  z: number;
  passed: boolean;
  leftLeaf: THREE.Mesh;
  rightLeaf: THREE.Mesh;
  lightMat: THREE.MeshBasicMaterial;
  rearRunners: EncounterSpawnDef[];
}

export interface PillarDef {
  x: number;
  z: number;
  radius?: number;
}

export interface WreckDef {
  x: number;
  z: number;
  rot: number;
  color: number;
  vaultable: boolean;
  radius?: number;
}

export interface BarrelDef {
  x: number;
  z: number;
}

export interface SpikeDef {
  x: number;
  z: number;
  rot: number;
}

export interface LampDef {
  x: number;
  z: number;
  flickers: boolean;
  extinguishOnPass: boolean;
}

export interface GateDef {
  x?: number;
  z: number;
  meshX?: number;
  meshZ: number;
  rotY?: number;
  lockedInitially: boolean;
  isLabsEntrance: boolean;
}

export interface EncounterDef {
  id: string;
  triggerZ: number;
  triggerTime: number;
  bannerText?: string;
  spawns: EncounterSpawnDef[];
}

export interface StageDefinition {
  stage: 1 | 2 | 3;
  halfWidth: number;
  halfLength: number;
  baseWidth: number;
  baseLength: number;
  wallColor: number;
  windowsLit: boolean;
  playerStart?: { x: number; z: number };
  ceilingHeight?: number;
  openRooftop?: boolean;
  pillars?: PillarDef[];
  doors?: DoorThresholdDef[];
  wrecks: WreckDef[];
  barrels: BarrelDef[];
  spikes: SpikeDef[];
  lamps: LampDef[];
  gate: GateDef;
  encounters: EncounterDef[];
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  // ETAP 1: Szeroki dzienny kordon — prosta przejezdna ulica na środku, boczne zasadzki, beczki i kolce jako opcjonalny skrót do monet i Rzezi
  {
    stage: 1,
    halfWidth: 14,
    halfLength: 35,
    baseWidth: 30,
    baseLength: 76,
    wallColor: 0x262b38,
    windowsLit: false,
    wrecks: [
      { x: -6.2, z: 21, rot: 0.28, color: 0x4f2b24, vaultable: true },
      { x: 6.4, z: 13, rot: -0.35, color: 0x2b3c4f, vaultable: true },
      { x: -6.5, z: 2, rot: 0.45, color: 0x3d4430, vaultable: true },
      { x: 6.2, z: -9, rot: -0.25, color: 0x4a2533, vaultable: true },
      { x: -6.0, z: -20, rot: 0.2, color: 0x3a3d45, vaultable: true },
      { x: 6.4, z: -24, rot: -0.4, color: 0x52341e, vaultable: true }
    ],
    spikes: [
      { x: 5.5, z: 22, rot: -0.2 },
      { x: -6.8, z: 10, rot: 0.3 },
      { x: 6.5, z: -2, rot: -0.3 },
      { x: -6.2, z: -14, rot: 0.25 },
      { x: -5.8, z: -26.5, rot: 0.2 }
    ],
    barrels: [
      { x: -4.8, z: 19.5 },
      { x: 5.2, z: 8.5 },
      { x: -5.5, z: -4.5 },
      { x: 5.0, z: -16 },
      { x: -5.2, z: -25.5 },
      { x: 5.2, z: -25.5 }
    ],
    lamps: [
      { x: -11, z: 22, flickers: false, extinguishOnPass: false },
      { x: 11, z: 10, flickers: false, extinguishOnPass: false },
      { x: -11, z: -4, flickers: false, extinguishOnPass: false },
      { x: 11, z: -18, flickers: false, extinguishOnPass: false },
      { x: -11, z: -28, flickers: false, extinguishOnPass: false }
    ],
    gate: {
      z: -33.2,
      meshZ: -34.2,
      lockedInitially: false,
      isLabsEntrance: false
    },
    encounters: [
      {
        id: 's1_side_welcome',
        triggerZ: 31,
        triggerTime: 0.5,
        spawns: [
          { type: 'exploder', x: -5.2, z: 18.2 },
          { type: 'walker', x: -6.8, z: 20.5 },
          { type: 'walker', x: 5.5, z: 21.0 },
          { type: 'walker', x: 7.2, z: 19.5 }
        ]
      },
      {
        id: 's1_spike_tank',
        triggerZ: 19,
        triggerTime: 9,
        bannerText: 'BOCZNA ZASADZKA — OMIŃ DASHEM ALBO ZGARNIJ MONETY PRZY KOLCACH!',
        spawns: [
          { type: 'tank', x: -5.8, z: 10.5 },
          { type: 'exploder', x: 5.6, z: 7.2 },
          { type: 'walker', x: -8.0, z: 11.5 },
          { type: 'walker', x: 7.4, z: 9.5 }
        ]
      },
      {
        id: 's1_side_pockets',
        triggerZ: 6,
        triggerTime: 18,
        spawns: [
          { type: 'runner', x: -11.5, z: 1.5 },
          { type: 'runner', x: 11.5, z: 1.0 },
          { type: 'exploder', x: -6.0, z: -5.5 },
          { type: 'walker', x: 6.2, z: -3.0 },
          { type: 'walker', x: 8.2, z: -4.0 }
        ]
      },
      {
        id: 's1_flank_tanks',
        triggerZ: -8,
        triggerTime: 28,
        spawns: [
          { type: 'tank', x: -5.8, z: -14.5 },
          { type: 'exploder', x: 5.5, z: -17.0 },
          { type: 'walker', x: -8.5, z: -16.0 },
          { type: 'walker', x: 7.8, z: -15.5 },
          { type: 'runner', x: -10.5, z: -24.0 },
          { type: 'runner', x: 10.5, z: -24.0 }
        ]
      }
    ]
  },

  // ETAP 2: Zmierzch i gasnące latarnie — środek tarasują wraki do przeskoczenia dashem (Spacja), z prawej dłuższa odnoga przy ziemi z Exploderem i beczką, brama za ostatnim wrakiem
  {
    stage: 2,
    halfWidth: 11.5,
    halfLength: 35,
    baseWidth: 26,
    baseLength: 76,
    wallColor: 0x1e202b,
    windowsLit: true,
    wrecks: [
      { x: -1.5, z: 21, rot: 0.08, color: 0x2b3c4f, vaultable: true, radius: 1.85 },
      { x: 1.5, z: 21, rot: -0.08, color: 0x3b2d2a, vaultable: true, radius: 1.85 },
      { x: -4.7, z: 21, rot: 0.25, color: 0x22252e, vaultable: false, radius: 1.9 },
      { x: -7.9, z: 21, rot: -0.18, color: 0x1f242d, vaultable: false, radius: 1.9 },
      { x: -10.4, z: 21, rot: 0.1, color: 0x252830, vaultable: false, radius: 1.8 },
      { x: 4.6, z: 21, rot: 0.3, color: 0x232733, vaultable: false, radius: 1.9 },

      { x: 10.0, z: 16.5, rot: -0.25, color: 0x2a262e, vaultable: false, radius: 1.75 },

      { x: -1.5, z: 10.5, rot: -0.06, color: 0x423d2b, vaultable: true, radius: 1.85 },
      { x: 1.5, z: 10.5, rot: 0.06, color: 0x2e383b, vaultable: true, radius: 1.85 },
      { x: -4.7, z: 10.5, rot: -0.22, color: 0x1f2229, vaultable: false, radius: 1.9 },
      { x: -7.9, z: 10.5, rot: 0.15, color: 0x252932, vaultable: false, radius: 1.9 },
      { x: -10.4, z: 10.5, rot: -0.1, color: 0x21252e, vaultable: false, radius: 1.8 },
      { x: 4.6, z: 10.5, rot: -0.28, color: 0x262936, vaultable: false, radius: 1.9 },

      { x: 6.4, z: 5.0, rot: 0.2, color: 0x29242c, vaultable: false, radius: 1.65 },

      { x: -1.5, z: 0.0, rot: 0.05, color: 0x4a3123, vaultable: true, radius: 1.85 },
      { x: 1.5, z: 0.0, rot: -0.05, color: 0x2b3240, vaultable: true, radius: 1.85 },
      { x: -4.7, z: 0.0, rot: 0.18, color: 0x1d2028, vaultable: false, radius: 1.9 },
      { x: -7.9, z: 0.0, rot: -0.2, color: 0x232730, vaultable: false, radius: 1.9 },
      { x: -10.4, z: 0.0, rot: 0.12, color: 0x20242c, vaultable: false, radius: 1.8 },
      { x: 4.6, z: 0.0, rot: 0.22, color: 0x242834, vaultable: false, radius: 1.9 },

      { x: 10.0, z: -5.5, rot: -0.22, color: 0x29252e, vaultable: false, radius: 1.75 },

      { x: -1.5, z: -11.0, rot: -0.07, color: 0x38402e, vaultable: true, radius: 1.85 },
      { x: 1.5, z: -11.0, rot: 0.07, color: 0x452727, vaultable: true, radius: 1.85 },
      { x: -4.7, z: -11.0, rot: -0.2, color: 0x21242d, vaultable: false, radius: 1.9 },
      { x: -7.9, z: -11.0, rot: 0.16, color: 0x1e222a, vaultable: false, radius: 1.9 },
      { x: -10.4, z: -11.0, rot: -0.12, color: 0x232730, vaultable: false, radius: 1.8 },
      { x: 4.6, z: -11.0, rot: -0.25, color: 0x252934, vaultable: false, radius: 1.9 },

      { x: -1.5, z: -23.5, rot: 0.04, color: 0x3b2d2a, vaultable: true, radius: 1.85 },
      { x: 1.5, z: -23.5, rot: -0.04, color: 0x283645, vaultable: true, radius: 1.85 },
      { x: -4.7, z: -23.5, rot: 0.2, color: 0x20232b, vaultable: false, radius: 1.9 },
      { x: -7.9, z: -23.5, rot: -0.15, color: 0x22262f, vaultable: false, radius: 1.9 },
      { x: -10.4, z: -23.5, rot: 0.08, color: 0x1e222a, vaultable: false, radius: 1.8 },
      { x: 4.6, z: -23.5, rot: 0.25, color: 0x242833, vaultable: false, radius: 1.9 }
    ],
    spikes: [
      { x: -6.2, z: 15.5, rot: 0.2 },
      { x: -6.2, z: 5.0, rot: -0.2 },
      { x: -6.2, z: -5.5, rot: 0.2 },
      { x: -6.2, z: -17.5, rot: -0.2 }
    ],
    barrels: [
      { x: 8.2, z: 13.5 },
      { x: 8.6, z: 2.0 },
      { x: 8.2, z: -8.5 },
      { x: 8.5, z: -18.5 }
    ],
    lamps: [
      { x: -9.5, z: 24, flickers: true, extinguishOnPass: true },
      { x: 9.5, z: 14, flickers: true, extinguishOnPass: true },
      { x: -9.5, z: 4, flickers: true, extinguishOnPass: true },
      { x: 9.5, z: -6, flickers: true, extinguishOnPass: true },
      { x: -9.5, z: -16, flickers: true, extinguishOnPass: true },
      { x: 9.5, z: -25, flickers: true, extinguishOnPass: true }
    ],
    gate: {
      z: -33.2,
      meshZ: -34.2,
      lockedInitially: false,
      isLabsEntrance: false
    },
    encounters: [
      {
        id: 's2_detour_exploder_1',
        triggerZ: 31,
        triggerTime: 0.5,
        bannerText: 'ŚRODEK PRZEZ WRAKI [SPACJA] • ODNOGA Z PRAWEJ PRZY ZIEMI',
        spawns: [
          { type: 'exploder', x: 8.2, z: 12.2 },
          { type: 'walker', x: 7.6, z: 14.8 },
          { type: 'walker', x: 9.2, z: 11.0 }
        ]
      },
      {
        id: 's2_detour_exploder_2',
        triggerZ: 12,
        triggerTime: 10,
        spawns: [
          { type: 'exploder', x: 8.6, z: 0.8 },
          { type: 'tank', x: 8.4, z: -2.0 },
          { type: 'walker', x: 7.5, z: 3.0 }
        ]
      },
      {
        id: 's2_detour_exploder_3',
        triggerZ: -2,
        triggerTime: 20,
        spawns: [
          { type: 'exploder', x: 8.2, z: -9.8 },
          { type: 'exploder', x: 8.5, z: -19.5 },
          { type: 'walker', x: 7.8, z: -15.0 }
        ]
      }
    ]
  },

  // ETAP 3: Nocne laboratorium Dead Net Labs z bossem otwierającym bramę celu
  {
    stage: 3,
    halfWidth: 12.5,
    halfLength: 35,
    baseWidth: 28,
    baseLength: 76,
    wallColor: 0x141722,
    windowsLit: true,
    wrecks: [
      { x: -5.8, z: 22, rot: 0.3, color: 0x262f3d, vaultable: true },
      { x: 5.8, z: 16, rot: -0.35, color: 0x3b232b, vaultable: true },
      { x: -6.0, z: 6, rot: 0.22, color: 0x25362f, vaultable: true },
      { x: 6.0, z: -2, rot: -0.25, color: 0x362b3d, vaultable: true },
      { x: -7.5, z: -16, rot: 0.5, color: 0x2b2d38, vaultable: true },
      { x: 7.5, z: -16, rot: -0.5, color: 0x2b2d38, vaultable: true }
    ],
    spikes: [
      { x: -5.8, z: 19, rot: 0.2 },
      { x: -5.8, z: 11, rot: 0.25 },
      { x: 5.8, z: 2, rot: -0.25 },
      { x: -6.2, z: -10, rot: 0.35 },
      { x: 6.2, z: -10, rot: -0.35 },
      { x: -5.8, z: -23, rot: 0.4 },
      { x: 5.8, z: -23, rot: -0.4 }
    ],
    barrels: [
      { x: -4.6, z: 14 },
      { x: 4.6, z: 8 },
      { x: -4.8, z: -4 },
      { x: 4.8, z: -4 },
      { x: -4.8, z: -19 },
      { x: 4.8, z: -19 },
      { x: -3.6, z: -27 },
      { x: 3.6, z: -27 }
    ],
    lamps: [
      { x: -10.5, z: 20, flickers: true, extinguishOnPass: false },
      { x: 10.5, z: 6, flickers: true, extinguishOnPass: false },
      { x: -10.5, z: -12, flickers: true, extinguishOnPass: false },
      { x: 10.5, z: -24, flickers: true, extinguishOnPass: false }
    ],
    gate: {
      z: -33.2,
      meshZ: -34.2,
      lockedInitially: true,
      isLabsEntrance: true
    },
    encounters: [
      {
        id: 's3_volatile_greeting',
        triggerZ: 31,
        triggerTime: 0.5,
        spawns: [
          { type: 'runner', x: -9.5, z: 21.0 },
          { type: 'runner', x: 9.5, z: 21.0 },
          { type: 'walker', x: -5.2, z: 20.0 },
          { type: 'walker', x: 5.2, z: 20.0 },
          { type: 'exploder', x: -4.8, z: 12.5 }
        ]
      },
      {
        id: 's3_fog_stalkers',
        triggerZ: 16,
        triggerTime: 9,
        spawns: [
          { type: 'tank', x: -5.5, z: 9.5 },
          { type: 'exploder', x: 4.8, z: 6.2 },
          { type: 'runner', x: -10.5, z: 8.0 },
          { type: 'runner', x: 10.5, z: 8.0 }
        ]
      },
      {
        id: 's3_cordon_breach',
        triggerZ: 4,
        triggerTime: 18,
        spawns: [
          { type: 'exploder', x: -5.0, z: -5.8 },
          { type: 'exploder', x: 5.0, z: -5.8 },
          { type: 'runner', x: -11.0, z: -2.0 },
          { type: 'runner', x: 11.0, z: -2.0 }
        ]
      },
      {
        id: 's3_dead_net_boss',
        triggerZ: -7,
        triggerTime: 25,
        bannerText: '⚠️ STRAŻNIK DEAD NET LABS — POKONAJ BOSSA ABY OTWORZYĆ BRAMĘ CELU!',
        spawns: [
          { type: 'tank', x: 0.0, z: -23.5, isBoss: true },
          { type: 'exploder', x: -4.8, z: -20.8 },
          { type: 'exploder', x: 4.8, z: -20.8 },
          { type: 'runner', x: -9.5, z: -22.0 },
          { type: 'runner', x: 9.5, z: -22.0 },
          { type: 'walker', x: -3.5, z: -25.5 },
          { type: 'walker', x: 3.5, z: -25.5 }
        ]
      }
    ]
  }
];

// POZIOM 2 — SZPITAL DIXONA (3 etapy na jednym liczniku 2:00: Parking pod szpitalem, Oddział, Lądowisko na dachu)
export const DIXON_STAGE_DEFINITIONS: StageDefinition[] = [
  // Etap 1 — Parking pod szpitalem: ciasny, słupy i wraki robią labirynt, brama z boku za dwoma zakrętami, zombie w ciemnych zatokach do ominięcia
  {
    stage: 1,
    halfWidth: 16.5,
    halfLength: 27,
    baseWidth: 36,
    baseLength: 58,
    wallColor: 0x161922,
    windowsLit: false,
    playerStart: { x: -10.5, z: 22.0 },
    ceilingHeight: 6.4,
    pillars: [
      { x: -5.5, z: 16, radius: 1.1 },
      { x: -5.5, z: 6, radius: 1.1 },
      { x: -13.0, z: -12, radius: 1.1 },
      { x: 0.0, z: -12, radius: 1.1 },
      { x: 6.0, z: -12, radius: 1.1 },
      { x: 6.0, z: 6, radius: 1.1 },
      { x: 14.0, z: -2, radius: 1.1 }
    ],
    wrecks: [
      // Ściana wraków zamykająca prostą drogę na północ (wymusza zakręt 1 w prawo przy z ≈ -3)
      { x: -13.5, z: -8.5, rot: 0.05, color: 0x222630, vaultable: false, radius: 1.95 },
      { x: -10.0, z: -8.5, rot: -0.08, color: 0x252a34, vaultable: false, radius: 1.95 },
      { x: -6.5, z: -8.5, rot: 0.1, color: 0x1e222b, vaultable: false, radius: 1.95 },

      // Środkowa przegroda labiryntu oddzielająca aleję zachodnią od wschodniej (z = 22 do z = 2)
      { x: -3.2, z: 20.0, rot: 1.55, color: 0x2c303a, vaultable: false, radius: 1.95 },
      { x: -3.2, z: 15.5, rot: 1.6, color: 0x242833, vaultable: false, radius: 1.95 },
      { x: -3.2, z: 11.0, rot: 1.5, color: 0x33292b, vaultable: false, radius: 1.95 },
      { x: -3.2, z: 6.5, rot: 1.58, color: 0x262f38, vaultable: false, radius: 1.95 },
      { x: -3.2, z: 2.0, rot: 1.52, color: 0x20242d, vaultable: false, radius: 1.95 },

      // Północna przegroda po zakręcie 1 prowadząca do zakrętu 2 na południe
      { x: 0.5, z: -9.5, rot: 0.06, color: 0x2b252d, vaultable: false, radius: 1.95 },
      { x: 4.2, z: -9.5, rot: -0.05, color: 0x21262e, vaultable: false, radius: 1.95 },
      { x: 8.0, z: -9.5, rot: 0.08, color: 0x282d38, vaultable: false, radius: 1.95 },

      // Wewnętrzna przegroda przed bramą boczną (wymusza zakręt 2 na z ≈ 12 i wejście w boczną bramę na wschodzie)
      { x: 4.5, z: 1.5, rot: 1.56, color: 0x302826, vaultable: false, radius: 1.9 },
      { x: 4.5, z: 6.0, rot: 1.58, color: 0x222930, vaultable: false, radius: 1.9 },
      { x: 4.5, z: 18.0, rot: 0.12, color: 0x262932, vaultable: true, radius: 1.75 }
    ],
    spikes: [
      { x: -14.2, z: 11.0, rot: 0.3 },
      { x: -9.5, z: -15.5, rot: 0.0 },
      { x: 1.5, z: 14.5, rot: -0.25 },
      { x: 13.5, z: -6.0, rot: 0.2 }
    ],
    barrels: [
      { x: -14.0, z: 14.0 },
      { x: -8.0, z: -15.0 },
      { x: 1.2, z: 11.5 },
      { x: 13.2, z: 2.5 }
    ],
    lamps: [
      { x: -10.5, z: 18, flickers: true, extinguishOnPass: false },
      { x: -9.0, z: -3, flickers: true, extinguishOnPass: false },
      { x: 9.0, z: -3, flickers: true, extinguishOnPass: false },
      { x: 11.5, z: 12, flickers: false, extinguishOnPass: false }
    ],
    // Brama nie jest na północy w linii, tylko z boku (wschodnia ściana za dwoma zakrętami)
    gate: {
      x: 13.6,
      z: 13.0,
      meshX: 14.8,
      meshZ: 13.0,
      rotY: -Math.PI / 2,
      lockedInitially: false,
      isLabsEntrance: false
    },
    encounters: [
      {
        id: 'd1_bay_west',
        triggerZ: 23,
        triggerTime: 0.5,
        bannerText: 'PARKING POD SZPITALEM — BRAMA ZA DWOMA ZAKRĘTAMI Z BOKU!',
        spawns: [
          // Ciemna zatoka po lewej (z boku głównej przejezdnej linii)
          { type: 'walker', x: -14.5, z: 15.0 },
          { type: 'walker', x: -14.2, z: 12.5 },
          { type: 'exploder', x: -13.8, z: 9.5 }
        ]
      },
      {
        id: 'd1_turn1_alcove',
        triggerZ: 8,
        triggerTime: 7,
        spawns: [
          // Północno-zachodnia ciemna zatoka przy kolcach (za zakrętem 1)
          { type: 'tank', x: -10.5, z: -16.5 },
          { type: 'walker', x: -7.5, z: -16.0 },
          { type: 'runner', x: -13.5, z: -17.0 }
        ]
      },
      {
        id: 'd1_turn2_bays',
        triggerZ: -1,
        triggerTime: 13,
        spawns: [
          // Zatoki boczne we wschodniej nawie (linia środkiem od zakrętu 2 do bocznej bramy jest czysta)
          { type: 'exploder', x: 13.8, z: 3.5 },
          { type: 'walker', x: 14.2, z: -4.0 },
          { type: 'walker', x: 1.0, z: 13.5 },
          { type: 'tank', x: 0.8, z: 16.5 }
        ]
      }
    ]
  },

  // Etap 2 — Oddział: długi, wąski korytarz z trzema progami (drzwi w danych etapu) i niszami po bokach (beczka, kolce, Exploder)
  {
    stage: 2,
    halfWidth: 8.5,
    halfLength: 36,
    baseWidth: 20,
    baseLength: 78,
    wallColor: 0x1c262b,
    windowsLit: false,
    playerStart: { x: 0, z: 31.5 },
    ceilingHeight: 6.2,
    // Trzy progi drzwiowe w danych etapu; po minięciu progu Runnerzy wychodzą z nisz za plecami i gonią z tyłu
    doors: [
      {
        z: 18.0,
        width: 5.2,
        rearRunners: [
          { type: 'runner', x: -5.8, z: 23.5 },
          { type: 'runner', x: 5.8, z: 23.5 }
        ]
      },
      {
        z: 2.0,
        width: 5.2,
        rearRunners: [
          { type: 'runner', x: -6.2, z: 9.5 },
          { type: 'runner', x: 6.2, z: 9.5 }
        ]
      },
      {
        z: -14.0,
        width: 5.2,
        rearRunners: [
          { type: 'runner', x: -6.2, z: -6.5 },
          { type: 'runner', x: 6.2, z: -6.5 }
        ]
      }
    ],
    // Ścianki działowe tworzące wąski środek (sprint środkiem) oraz 3 głębokie nisze po bokach między progami
    wrecks: [
      { x: -4.8, z: 26.0, rot: 0, color: 0x253238, vaultable: false, radius: 1.75 },
      { x: 4.8, z: 26.0, rot: 0, color: 0x253238, vaultable: false, radius: 1.75 },
      // Między progiem 1 (18) a progiem 2 (2) -> nisza 1 (lewa: beczka) i nisza 2 (prawa: kolce)
      { x: -4.8, z: 14.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: 4.8, z: 14.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: -4.8, z: 6.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: 4.8, z: 6.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      // Między progiem 2 (2) a progiem 3 (-14) -> nisza 3 z Exploderem
      { x: -4.8, z: -2.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: 4.8, z: -2.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: -4.8, z: -10.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 },
      { x: 4.8, z: -10.0, rot: 0, color: 0x222e34, vaultable: false, radius: 1.65 }
    ],
    // Nisza 1: beczka (oraz dodatkowa beczka w dalszej niszy)
    barrels: [
      { x: -6.6, z: 10.0 },
      { x: 6.6, z: -6.0 }
    ],
    // Nisza 2: kolce
    spikes: [
      { x: 6.6, z: 10.0, rot: -0.25 },
      { x: -6.6, z: -22.0, rot: 0.25 }
    ],
    lamps: [
      { x: -7.2, z: 22, flickers: true, extinguishOnPass: true },
      { x: 7.2, z: 10, flickers: true, extinguishOnPass: true },
      { x: -7.2, z: -6, flickers: true, extinguishOnPass: true },
      { x: 7.2, z: -22, flickers: true, extinguishOnPass: true }
    ],
    gate: {
      z: -33.2,
      meshZ: -34.2,
      lockedInitially: false,
      isLabsEntrance: false
    },
    // Zombie stoją wyłącznie w niszach z boku, środek i drzwi z przodu są wolne do sprintu
    encounters: [
      {
        id: 'd2_niche_1_2',
        triggerZ: 31,
        triggerTime: 0.5,
        bannerText: 'ODDZIAŁ SZPITALA — TRZY PROGI DRZWI, SPRINT ŚRODKIEM!',
        spawns: [
          { type: 'walker', x: -6.8, z: 11.2 },
          { type: 'tank', x: 6.8, z: 8.8 }
        ]
      },
      {
        id: 'd2_niche_3_exploder',
        triggerZ: 12,
        triggerTime: 8,
        spawns: [
          // Nisza 3: Exploder
          { type: 'exploder', x: -6.6, z: -6.0 },
          { type: 'exploder', x: 6.6, z: -7.2 },
          { type: 'walker', x: -6.8, z: -4.5 }
        ]
      },
      {
        id: 'd2_niche_north',
        triggerZ: -8,
        triggerTime: 16,
        spawns: [
          { type: 'tank', x: 6.6, z: -22.0 },
          { type: 'walker', x: -6.6, z: -20.5 }
        ]
      }
    ]
  },

  // Etap 3 — Lądowisko na dachu: prawie pusta płyta, mało wraków, beczki przy krawędziach, horda z 4 krawędzi falami, Boss przy bramie celu
  {
    stage: 3,
    halfWidth: 16.0,
    halfLength: 32,
    baseWidth: 36,
    baseLength: 68,
    wallColor: 0x121622,
    windowsLit: false,
    playerStart: { x: 0, z: 27.0 },
    openRooftop: true,
    // Prawie pusta płyta, tylko dwa wraki z boku
    wrecks: [
      { x: -10.5, z: 6.0, rot: 0.35, color: 0x262f3d, vaultable: true },
      { x: 10.5, z: -8.0, rot: -0.35, color: 0x3b232b, vaultable: true }
    ],
    spikes: [
      { x: -12.5, z: -2.0, rot: 0.25 },
      { x: 12.5, z: -2.0, rot: -0.25 },
      { x: -12.5, z: -18.0, rot: 0.35 },
      { x: 12.5, z: -18.0, rot: -0.35 }
    ],
    // Beczki wyłącznie przy krawędziach płyty, nie na linii do bossa
    barrels: [
      { x: -14.2, z: 18.0 },
      { x: 14.2, z: 18.0 },
      { x: -14.2, z: 0.0 },
      { x: 14.2, z: 0.0 },
      { x: -14.2, z: -16.0 },
      { x: 14.2, z: -16.0 },
      { x: -11.5, z: -27.5 },
      { x: 11.5, z: -27.5 }
    ],
    lamps: [
      { x: -14.5, z: 22, flickers: true, extinguishOnPass: false },
      { x: 14.5, z: 22, flickers: true, extinguishOnPass: false },
      { x: -14.5, z: -22, flickers: true, extinguishOnPass: false },
      { x: 14.5, z: -22, flickers: true, extinguishOnPass: false }
    ],
    gate: {
      z: -29.5,
      meshZ: -30.5,
      lockedInitially: true,
      isLabsEntrance: true
    },
    encounters: [
      {
        id: 'd3_boss_at_gate',
        triggerZ: 28,
        triggerTime: 0.4,
        bannerText: 'LĄDOWISKO NA DACHU — POKONAJ BOSSA PRZY BRAMIE CELU!',
        spawns: [
          // Boss stoi od razu przy bramie celu
          { type: 'tank', x: 0.0, z: -24.5, isBoss: true },
          // Fala 1 z czterech krawędzi (N, S, E, W)
          { type: 'runner', x: -14.8, z: 8.0 },
          { type: 'runner', x: 14.8, z: 8.0 },
          { type: 'walker', x: -6.0, z: 29.5 },
          { type: 'walker', x: 6.0, z: -29.5 }
        ]
      },
      {
        id: 'd3_edges_wave_2',
        triggerZ: 10,
        triggerTime: 9,
        spawns: [
          { type: 'runner', x: -14.8, z: -6.0 },
          { type: 'runner', x: 14.8, z: -6.0 },
          { type: 'exploder', x: -14.2, z: 16.0 },
          { type: 'exploder', x: 14.2, z: 16.0 },
          { type: 'walker', x: 0.0, z: 30.0 },
          { type: 'walker', x: -9.0, z: -29.0 }
        ]
      },
      {
        id: 'd3_edges_wave_3',
        triggerZ: -8,
        triggerTime: 18,
        spawns: [
          { type: 'runner', x: -14.8, z: -18.0 },
          { type: 'runner', x: 14.8, z: -18.0 },
          { type: 'exploder', x: -14.2, z: -12.0 },
          { type: 'exploder', x: 14.2, z: -12.0 },
          { type: 'walker', x: -7.5, z: -28.5 },
          { type: 'walker', x: 7.5, z: -28.5 }
        ]
      }
    ]
  }
];

export function getStageDefinitionsForLevel(level: LevelId): StageDefinition[] {
  return level === 2 ? DIXON_STAGE_DEFINITIONS : STAGE_DEFINITIONS;
}

export class CityWorld {
  public scene: THREE.Scene;
  public worldGroup: THREE.Group;

  public currentLevel: LevelId = 1;
  public currentStreet = 1;
  public arenaHalfWidth = 14;
  public arenaHalfLength = 35;
  public playerSpawnPoint = new THREE.Vector3(0, 0, 30);

  public obstacles: ObstacleCollider[] = [];
  public barrels: ExplosiveBarrel[] = [];
  public spikes: SpikeTrap[] = [];
  public lamps: StreetLamp[] = [];
  public thresholdDoors: ActiveThresholdDoor[] = [];

  // Exit Gate
  public gatePosition = new THREE.Vector3(0, 0, -33.2);
  public gateLocked = false;
  private gateBeaconMat!: THREE.MeshStandardMaterial;
  private gatePortalMat!: THREE.MeshBasicMaterial;
  private gateArrowMat!: THREE.MeshBasicMaterial;
  private gateArrowGroup!: THREE.Group;
  private gateLight!: THREE.PointLight;

  private asphaltTex: THREE.CanvasTexture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.asphaltTex = this.createAsphaltTexture();
    this.loadStreet(1, 1);
  }

  private createAsphaltTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5500; i++) {
      const v = 18 + Math.floor(Math.random() * 26);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = Math.random() * 512;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 18);
    return tex;
  }

  public clearStreet(): void {
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0];
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) {
            for (const mat of obj.material) {
              mat.dispose();
            }
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      this.worldGroup.remove(child);
    }
    this.obstacles = [];
    this.barrels = [];
    this.spikes = [];
    this.lamps = [];
    this.thresholdDoors = [];
  }

  public loadStreet(streetIndex: number, level: LevelId = this.currentLevel): void {
    this.clearStreet();
    this.currentLevel = level;
    const defs = getStageDefinitionsForLevel(level);
    const def = defs[streetIndex - 1] ?? defs[0];

    this.currentStreet = def.stage;
    this.arenaHalfWidth = def.halfWidth;
    this.arenaHalfLength = def.halfLength;
    this.gateLocked = def.gate.lockedInitially;
    this.playerSpawnPoint.set(
      def.playerStart ? def.playerStart.x : 0,
      0,
      def.playerStart ? def.playerStart.z : 30
    );

    this.buildStreetBase(def.baseWidth, def.baseLength, Boolean(def.openRooftop));
    this.buildPerimeterCorridor(
      def.halfWidth,
      def.halfLength,
      def.wallColor,
      def.windowsLit,
      Boolean(def.openRooftop),
      def.ceilingHeight
    );

    if (def.pillars) {
      for (const p of def.pillars) {
        this.addConcretePillar(p.x, p.z, p.radius ?? 1.1, def.ceilingHeight ?? 6.2);
      }
    }

    if (def.doors) {
      for (const d of def.doors) {
        this.addThresholdDoor(d, def.halfWidth);
      }
    }

    for (const wreck of def.wrecks) {
      this.addCarWreck(wreck);
    }
    for (const spike of def.spikes) {
      this.addSpikeTrap(spike.x, spike.z, spike.rot);
    }
    for (const barrel of def.barrels) {
      this.addBarrel(barrel.x, barrel.z);
    }
    for (const lamp of def.lamps) {
      this.addStreetLamp(lamp.x, lamp.z, lamp.flickers, lamp.extinguishOnPass);
    }

    this.buildExitGate(def.gate);
  }

  private buildStreetBase(width: number, length: number, isHelipad: boolean): void {
    const groundGeo = new THREE.PlaneGeometry(width + 18, length + 18);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTex,
      roughness: 0.88,
      metalness: 0.12
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.worldGroup.add(ground);

    if (isHelipad) {
      // Helipad circle and "H" marking in the center of the rooftop slab
      const padRingGeo = new THREE.RingGeometry(8.5, 9.3, 40);
      padRingGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        color: 0xeab308,
        side: THREE.DoubleSide
      });
      const padRing = new THREE.Mesh(padRingGeo, padMat);
      padRing.position.set(0, 0.02, -1.0);
      this.worldGroup.add(padRing);

      const hBarGeo = new THREE.PlaneGeometry(1.1, 7.2);
      hBarGeo.rotateX(-Math.PI / 2);
      const leftH = new THREE.Mesh(hBarGeo, padMat);
      leftH.position.set(-2.6, 0.02, -1.0);
      const rightH = new THREE.Mesh(hBarGeo, padMat);
      rightH.position.set(2.6, 0.02, -1.0);
      const crossGeo = new THREE.PlaneGeometry(5.2, 1.1);
      crossGeo.rotateX(-Math.PI / 2);
      const midH = new THREE.Mesh(crossGeo, padMat);
      midH.position.set(0, 0.02, -1.0);
      this.worldGroup.add(leftH, rightH, midH);
      return;
    }

    // Center road stripes
    const stripeGeo = new THREE.PlaneGeometry(0.32, 3.0);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xc2932d,
      roughness: 0.7
    });

    for (let z = -30; z <= 30; z += 5.5) {
      const s = new THREE.Mesh(stripeGeo, stripeMat);
      s.position.set(0, 0.015, z);
      s.receiveShadow = true;
      this.worldGroup.add(s);
    }
  }

  private buildPerimeterCorridor(
    halfW: number,
    halfL: number,
    wallColor: number,
    windowsLit: boolean,
    openRooftop: boolean,
    ceilingHeight?: number
  ): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.85,
      metalness: 0.15
    });
    const windowLitMat = new THREE.MeshBasicMaterial({ color: 0xff9933 });
    const windowDarkMat = new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.2 });

    if (!openRooftop) {
      for (let z = -30; z <= 30; z += 15) {
        for (const side of [-1, 1]) {
          const bGroup = new THREE.Group();
          const w = 8;
          const h = ceilingHeight ?? 11 + ((Math.abs(z) + (side > 0 ? 3 : 1)) % 6);
          const d = 13.5;

          const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
          body.position.y = h / 2;
          body.castShadow = true;
          body.receiveShadow = true;
          bGroup.add(body);

          if (!ceilingHeight) {
            for (let wy = 3; wy < h - 2; wy += 3.2) {
              for (let wz = -d / 2 + 2; wz < d / 2 - 2; wz += 3.0) {
                const isLit = windowsLit && (wy + wz) % 5 === 0;
                const win = new THREE.Mesh(
                  new THREE.BoxGeometry(w + 0.12, 1.4, 1.1),
                  isLit ? windowLitMat : windowDarkMat
                );
                win.position.set(0, wy, wz);
                bGroup.add(win);
              }
            }
          }

          bGroup.position.set(side * (halfW + 4.8), 0, z);
          this.worldGroup.add(bGroup);
        }
      }
    }

    if (ceilingHeight) {
      // Overhead concrete ceiling beams to evoke underground garage / hospital ward without blocking isometric camera
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x1a202c,
        roughness: 0.9
      });
      for (let z = -halfL + 4; z <= halfL - 4; z += 10) {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2 + 2, 0.35, 0.7),
          beamMat
        );
        beam.position.set(0, ceilingHeight, z);
        this.worldGroup.add(beam);
      }
    }

    // Concrete jersey barriers along both sides and behind start
    const barrierGeo = new THREE.BoxGeometry(0.9, 1.05, 3.8);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x3b404c, roughness: 0.8 });
    for (let z = -halfL; z <= halfL; z += 4.4) {
      for (const side of [-1, 1]) {
        const b = new THREE.Mesh(barrierGeo, barrierMat);
        b.position.set(side * (halfW + 0.55), 0.52, z);
        b.castShadow = true;
        b.receiveShadow = true;
        this.worldGroup.add(b);
      }
    }

    const southGeo = new THREE.BoxGeometry(3.6, 1.1, 0.9);
    for (let x = -halfW + 2; x <= halfW - 2; x += 4.2) {
      const sb = new THREE.Mesh(southGeo, barrierMat);
      sb.position.set(x, 0.55, halfL + 0.55);
      sb.castShadow = true;
      this.worldGroup.add(sb);
    }
  }

  private addConcretePillar(x: number, z: number, radius: number, height: number): void {
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x333947,
      roughness: 0.85
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const group = new THREE.Group();
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 1.6, height, radius * 1.6),
      pillarMat
    );
    col.position.y = height / 2;
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);

    const band = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 1.66, 0.35, radius * 1.66),
      stripeMat
    );
    band.position.y = 1.1;
    group.add(band);

    group.position.set(x, 0, z);
    this.worldGroup.add(group);

    this.obstacles.push({
      position: new THREE.Vector3(x, 0, z),
      radius,
      vaultable: false
    });
  }

  private addThresholdDoor(doorDef: DoorThresholdDef, halfW: number): void {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      metalness: 0.65,
      roughness: 0.35
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      metalness: 0.5,
      roughness: 0.4
    });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff9f1c, fog: false });

    const group = new THREE.Group();
    const openingHalf = doorDef.width * 0.5;
    const sideWallWidth = Math.max(1.2, halfW - openingHalf);

    // Side doorjamb walls framing the central hospital threshold
    for (const side of [-1, 1]) {
      const wallX = side * (openingHalf + sideWallWidth * 0.5);
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(sideWallWidth, 4.4, 0.75),
        frameMat
      );
      wall.position.set(wallX, 2.2, 0);
      wall.castShadow = true;
      group.add(wall);

      this.obstacles.push({
        position: new THREE.Vector3(wallX, 0, doorDef.z),
        radius: sideWallWidth * 0.46,
        vaultable: false
      });
    }

    // Overhead lintel + hospital threshold light strip
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorDef.width + 1.2, 0.65, 0.9),
      frameMat
    );
    lintel.position.set(0, 4.2, 0);
    group.add(lintel);

    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(doorDef.width, 0.18, 0.95),
      lightMat
    );
    strip.position.set(0, 3.85, 0);
    group.add(strip);

    // Sliding hospital door leaves (slide open when player approaches/passes, no time reset!)
    const leafWidth = openingHalf * 0.92;
    const leftLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth, 3.6, 0.22),
      leafMat
    );
    leftLeaf.position.set(-openingHalf * 0.48, 1.8, 0);
    group.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth, 3.6, 0.22),
      leafMat
    );
    rightLeaf.position.set(openingHalf * 0.48, 1.8, 0);
    group.add(rightLeaf);

    group.position.set(0, 0, doorDef.z);
    this.worldGroup.add(group);

    this.thresholdDoors.push({
      z: doorDef.z,
      passed: false,
      leftLeaf,
      rightLeaf,
      lightMat,
      rearRunners: doorDef.rearRunners.map((r) => ({ ...r }))
    });
  }

  private buildExitGate(gateDef: GateDef): void {
    const gx = gateDef.x ?? 0;
    const gz = gateDef.z;
    this.gatePosition.set(gx, 0, gz);

    const gateGroup = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({
      color: gateDef.isLabsEntrance ? 0x192338 : 0x2c323f,
      metalness: 0.7,
      roughness: 0.3
    });

    // Gate Pillars
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), pillarMat);
    leftPillar.position.set(-3.4, 2.75, 0);
    leftPillar.castShadow = true;
    gateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), pillarMat);
    rightPillar.position.set(3.4, 2.75, 0);
    rightPillar.castShadow = true;
    gateGroup.add(rightPillar);

    // Overhead Archway
    const arch = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.2, 1.6), pillarMat);
    arch.position.set(0, 5.6, 0);
    gateGroup.add(arch);

    // Glowing beacon strip on top
    this.gateBeaconMat = new THREE.MeshStandardMaterial({
      color: this.gateLocked ? 0xff2a3f : 0x00f5d4,
      emissive: this.gateLocked ? 0xff1e38 : 0x00f5d4,
      emissiveIntensity: 3.0,
      fog: false
    });
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 1.7), this.gateBeaconMat);
    beacon.position.set(0, 5.6, 0);
    gateGroup.add(beacon);

    // Glowing extraction zone ring on ground
    const zoneGeo = new THREE.RingGeometry(1.8, 2.35, 28);
    zoneGeo.rotateX(-Math.PI / 2);
    this.gatePortalMat = new THREE.MeshBasicMaterial({
      color: this.gateLocked ? 0xff2a3f : 0x00f5d4,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      fog: false
    });
    const zoneRing = new THREE.Mesh(zoneGeo, this.gatePortalMat);
    zoneRing.position.set(0, 0.04, 1.0);
    gateGroup.add(zoneRing);

    // 3D Arrow in the world above the gate, visible through fog (fog: false)
    this.gateArrowGroup = new THREE.Group();
    this.gateArrowMat = new THREE.MeshBasicMaterial({
      color: this.gateLocked ? 0xff2a3f : 0x00f5d4,
      fog: false
    });

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.1, 0.55), this.gateArrowMat);
    shaft.position.set(0, 1.4, 0);
    this.gateArrowGroup.add(shaft);

    const headGeo = new THREE.ConeGeometry(1.35, 1.8, 4);
    headGeo.rotateX(Math.PI);
    const head = new THREE.Mesh(headGeo, this.gateArrowMat);
    head.position.set(0, 0.1, 0);
    this.gateArrowGroup.add(head);

    this.gateArrowGroup.position.set(0, 8.2, 0.6);
    gateGroup.add(this.gateArrowGroup);

    this.gateLight = new THREE.PointLight(
      this.gateLocked ? 0xff2a3f : 0x00f5d4,
      24,
      16,
      1.4
    );
    this.gateLight.position.set(0, 4.2, 1.2);
    gateGroup.add(this.gateLight);

    if (gateDef.isLabsEntrance) {
      const labFacade = new THREE.Mesh(
        new THREE.BoxGeometry(24, 14, 6),
        new THREE.MeshStandardMaterial({ color: 0x101520, metalness: 0.6, roughness: 0.4 })
      );
      labFacade.position.set(0, 7, -3.5);
      gateGroup.add(labFacade);

      const neonStripMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, fog: false });
      const strip1 = new THREE.Mesh(new THREE.BoxGeometry(18, 0.25, 0.2), neonStripMat);
      strip1.position.set(0, 9.5, -0.4);
      gateGroup.add(strip1);

      const strip2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 0.2), neonStripMat);
      strip2.position.set(0, 11.2, -0.4);
      gateGroup.add(strip2);
    }

    gateGroup.position.set(gateDef.meshX ?? gx, 0, gateDef.meshZ);
    if (gateDef.rotY !== undefined) {
      gateGroup.rotation.y = gateDef.rotY;
    }
    this.worldGroup.add(gateGroup);
  }

  public unlockGate(): void {
    if (!this.gateLocked) return;
    this.gateLocked = false;
    this.gateBeaconMat.color.setHex(0x00f5d4);
    this.gateBeaconMat.emissive.setHex(0x00f5d4);
    this.gatePortalMat.color.setHex(0x00f5d4);
    this.gateArrowMat.color.setHex(0x00f5d4);
    this.gateLight.color.setHex(0x00f5d4);
  }

  private addCarWreck(wreck: WreckDef): void {
    const car = new THREE.Group();
    const chassisMat = new THREE.MeshStandardMaterial({
      color: wreck.color,
      roughness: 0.65,
      metalness: 0.45
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x15171c,
      roughness: 0.8,
      metalness: 0.6
    });

    if (wreck.vaultable) {
      const lower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.72, 1.8), chassisMat);
      lower.position.y = 0.45;
      lower.castShadow = true;
      lower.receiveShadow = true;
      car.add(lower);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.52, 1.6), chassisMat);
      cabin.position.set(-0.2, 1.0, 0);
      cabin.castShadow = true;
      car.add(cabin);

      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.28), stripeMat);
      roofStripe.position.set(-0.2, 1.27, 0);
      car.add(roofStripe);
    } else {
      const lower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.45, 2.1), chassisMat);
      lower.position.y = 0.75;
      lower.castShadow = true;
      lower.receiveShadow = true;
      car.add(lower);

      const topBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 1.85), darkMetal);
      topBlock.position.set(0.1, 1.9, 0);
      topBlock.rotation.z = 0.08;
      topBlock.castShadow = true;
      car.add(topBlock);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 10);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelOffsets = [
      [-1.1, 0.34, 0.88],
      [1.1, 0.34, 0.88],
      [-1.1, 0.34, -0.88],
      [1.1, 0.34, -0.88]
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, darkMetal);
      w.position.set(wx, wy, wz);
      car.add(w);
    });

    car.position.set(wreck.x, 0, wreck.z);
    car.rotation.y = wreck.rot;
    this.worldGroup.add(car);

    this.obstacles.push({
      position: new THREE.Vector3(wreck.x, 0, wreck.z),
      radius: wreck.radius ?? 1.7,
      vaultable: wreck.vaultable,
      noiseTriggered: false
    });
  }

  private addStreetLamp(
    x: number,
    z: number,
    flickers: boolean,
    extinguishOnPass: boolean
  ): void {
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x262b36,
      metalness: 0.75,
      roughness: 0.35
    });

    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 5.8, 8), poleMat);
    pole.position.y = 2.9;
    pole.castShadow = true;
    group.add(pole);

    const armDir = x < 0 ? 1 : -1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), poleMat);
    arm.position.set(armDir * 0.5, 5.75, 0);
    group.add(arm);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffbb55,
      emissive: 0xff9922,
      emissiveIntensity: 3.0
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bulbMat);
    bulb.position.set(armDir * 0.95, 5.6, 0);
    group.add(bulb);

    const light = new THREE.PointLight(0xff9d3b, 14, 18, 1.6);
    light.position.set(armDir * 0.95, 5.4, 0);
    group.add(light);

    group.position.set(x, 0, z);
    this.worldGroup.add(group);

    this.lamps.push({
      z,
      light,
      bulbMat,
      flickerSpeed: 7 + this.lamps.length * 2.7,
      flickerOffset: this.lamps.length * 1.5,
      isFlickering: flickers,
      extinguishOnPass,
      passed: false,
      extinguishDelayTimer: 0,
      extinguished: false,
      rearRunnersSpawned: false
    });
  }

  private addSpikeTrap(x: number, z: number, rot: number): void {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3a2618,
      roughness: 0.85
    });
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xb8c4d0,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x331111,
      emissiveIntensity: 0.4
    });

    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.2), frameMat);
    base.position.y = 0.45;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const warnGeo = new THREE.RingGeometry(1.45, 1.65, 20);
    warnGeo.rotateX(-Math.PI / 2);
    const warnMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.45
    });
    const warnRing = new THREE.Mesh(warnGeo, warnMat);
    warnRing.position.y = 0.03;
    group.add(warnRing);

    const coneGeo = new THREE.ConeGeometry(0.11, 1.15, 6);
    for (let sx = -1.0; sx <= 1.0; sx += 0.4) {
      for (const side of [-1, 1]) {
        const spike = new THREE.Mesh(coneGeo, spikeMat);
        spike.position.set(sx, 0.72, side * 0.65);
        spike.rotation.x = side * 0.75;
        group.add(spike);
      }
    }

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.worldGroup.add(group);

    this.spikes.push({
      mesh: group,
      position: new THREE.Vector3(x, 0, z),
      radius: 1.65,
      cooldown: 0
    });
  }

  private addBarrel(x: number, z: number): void {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd91424,
      roughness: 0.4,
      metalness: 0.5,
      emissive: 0x550000,
      emissiveIntensity: 0.6
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffbe0b,
      emissive: 0xff7700,
      emissiveIntensity: 0.5
    });

    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.25, 14), bodyMat);
    cyl.position.y = 0.625;
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    group.add(cyl);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 14), stripeMat);
    band.position.y = 0.65;
    group.add(band);

    group.position.set(x, 0, z);
    this.worldGroup.add(group);

    this.barrels.push({
      mesh: group,
      position: new THREE.Vector3(x, 0, z),
      radius: 0.65,
      hp: 30,
      exploded: false,
      respawnTimer: 0
    });
  }

  public update(
    dt: number,
    elapsedTime: number,
    playerZ = 30,
    keepLightDelaySeconds = 0,
    onLampExtinguished?: (lampZ: number) => void,
    onDoorThresholdPassed?: (spawns: EncounterSpawnDef[]) => void
  ): void {
    // Update spike cooldowns
    for (const spike of this.spikes) {
      if (spike.cooldown > 0) spike.cooldown -= dt;
    }

    // Update hospital ward door thresholds (Dixon Stage 2): open doors as player approaches, trigger rear niche runners when passed
    for (const door of this.thresholdDoors) {
      const approaching = playerZ <= door.z + 5.5;
      const targetOffset = approaching || door.passed ? 2.6 : 1.15;
      door.leftLeaf.position.x = THREE.MathUtils.lerp(
        door.leftLeaf.position.x,
        -targetOffset,
        10 * dt
      );
      door.rightLeaf.position.x = THREE.MathUtils.lerp(
        door.rightLeaf.position.x,
        targetOffset,
        10 * dt
      );

      if (!door.passed && playerZ <= door.z - 0.6) {
        door.passed = true;
        door.lightMat.color.setHex(0x39ff7a);
        if (onDoorThresholdPassed && door.rearRunners.length > 0) {
          onDoorThresholdPassed(door.rearRunners);
        }
      }
    }

    // Update street lamps: lamps with extinguishOnPass go out sequentially when player passes their Z threshold
    for (const lamp of this.lamps) {
      if (lamp.extinguishOnPass) {
        if (!lamp.passed && playerZ <= lamp.z) {
          lamp.passed = true;
          lamp.extinguishDelayTimer = keepLightDelaySeconds;
        }
        if (lamp.passed && !lamp.extinguished) {
          if (lamp.extinguishDelayTimer > 0) {
            lamp.extinguishDelayTimer -= dt;
          }
          if (lamp.extinguishDelayTimer <= 0) {
            lamp.extinguished = true;
            if (!lamp.rearRunnersSpawned) {
              lamp.rearRunnersSpawned = true;
              if (onLampExtinguished) {
                onLampExtinguished(lamp.z);
              }
            }
          }
        }
      }

      if (lamp.extinguished) {
        lamp.light.intensity = THREE.MathUtils.lerp(lamp.light.intensity, 0, 8 * dt);
        lamp.bulbMat.emissiveIntensity = THREE.MathUtils.lerp(
          lamp.bulbMat.emissiveIntensity,
          0.03,
          8 * dt
        );
        continue;
      }

      if (lamp.isFlickering) {
        const wave =
          Math.sin(elapsedTime * lamp.flickerSpeed + lamp.flickerOffset) *
          Math.cos(elapsedTime * (lamp.flickerSpeed * 1.7));
        const on = wave > -0.25;
        lamp.light.intensity = on ? 13 + wave * 4 : 1.2;
        lamp.bulbMat.emissiveIntensity = on ? 2.8 : 0.3;
      } else {
        lamp.light.intensity = 10;
        lamp.bulbMat.emissiveIntensity = 2.0;
      }
    }

    // Pulse gate portal & animate 3D fog-piercing arrow above gate
    if (this.gatePortalMat) {
      this.gatePortalMat.opacity = 0.55 + Math.sin(elapsedTime * 4) * 0.25;
    }
    if (this.gateArrowGroup) {
      this.gateArrowGroup.position.y = 8.3 + Math.sin(elapsedTime * 4.5) * 0.55;
      this.gateArrowGroup.rotation.y = elapsedTime * 2.0;
    }

    // Update barrels
    for (const barrel of this.barrels) {
      if (barrel.exploded) {
        barrel.respawnTimer -= dt;
        if (barrel.respawnTimer <= 0) {
          barrel.exploded = false;
          barrel.hp = 30;
          barrel.mesh.visible = true;
          barrel.mesh.scale.setScalar(1);
        }
      } else {
        const pulse = 1 + Math.sin(elapsedTime * 5) * 0.025;
        barrel.mesh.scale.set(pulse, 1, pulse);
      }
    }
  }
}
