import * as THREE from 'three';
import { Zombie, ZombieType } from '../entities/Zombie';
import { EncounterSpawnDef, getStageDefinitionsForLevel } from '../world/CityWorld';
import { DifficultyId, LevelId, ZombieSkinId } from './UpgradeSystem';

export interface StreetEncounter {
  id: string;
  triggerZ: number;
  triggerTime: number;
  triggered: boolean;
  bannerText?: string;
  spawns: EncounterSpawnDef[];
}

export class WaveManager {
  private scene: THREE.Scene;
  public zombies: Zombie[] = [];
  public currentLevel: LevelId = 1;
  public currentStreet = 1;
  public activeZombieSkin: ZombieSkinId = 'port';
  public activeDifficulty: DifficultyId = 'normal';
  public encounters: StreetEncounter[] = [];
  public bossZombie: Zombie | null = null;
  public bossDefeated = false;
  private readonly maxConcurrentZombies = 34;

  // Survival Mode state
  public isSurvivalMode = false;
  public survivalWave = 1;
  public survivalBreatherTimer = 0;
  public survivalRemainingToSpawn = 0;
  private survivalSpawnTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loadStreetEncounters(1, 1);
  }

  public loadStreetEncounters(streetIndex: number, level: LevelId = this.currentLevel): void {
    this.clearZombies();
    this.isSurvivalMode = false;
    this.currentLevel = level;
    const defs = getStageDefinitionsForLevel(level);
    const def = defs[streetIndex - 1] ?? defs[0];

    this.currentStreet = def.stage;
    this.bossZombie = null;
    this.bossDefeated = false;

    this.encounters = def.encounters.map((enc) => ({
      id: enc.id,
      triggerZ: enc.triggerZ,
      triggerTime: enc.triggerTime,
      triggered: false,
      bannerText: enc.bannerText,
      spawns: enc.spawns.map((s) => ({ ...s }))
    }));
  }

  public startSurvivalMode(): void {
    this.clearZombies();
    this.isSurvivalMode = true;
    this.currentLevel = 1;
    this.currentStreet = 1;
    this.encounters = [];
    this.bossZombie = null;
    this.bossDefeated = false;
    this.survivalWave = 1;
    this.survivalBreatherTimer = 0;
    this.beginSurvivalWave(1);
  }

  private beginSurvivalWave(wave: number): void {
    this.survivalWave = wave;
    this.survivalRemainingToSpawn = 4 + wave * 3;
    this.survivalSpawnTimer = 0.1;
  }

  private spawnOneSurvivalZombie(playerPos: THREE.Vector3): void {
    const w = this.survivalWave;
    let type: ZombieType = 'walker';
    const isBoss = w % 4 === 0 && this.survivalRemainingToSpawn === 1;
    const roll = Math.random();
    if (isBoss) {
      type = 'tank';
    } else if (w >= 3 && roll < 0.16) {
      type = 'tank';
    } else if (w >= 2 && roll < 0.36) {
      type = 'exploder';
    } else if (roll < 0.62) {
      type = 'runner';
    }

    // Spawn around perimeter of Stary Port arena, away from player
    let sx = (Math.random() - 0.5) * 22;
    let sz = (Math.random() - 0.5) * 56;
    if (Math.random() < 0.5) {
      sx = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 2.5);
    } else {
      sz = (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 6);
    }
    if (Math.hypot(sx - playerPos.x, sz - playerPos.z) < 8) {
      sz = playerPos.z > 0 ? -24 : 24;
    }

    const z = new Zombie(
      type,
      new THREE.Vector3(sx, 0, sz),
      Math.min(3, 1 + Math.floor((w - 1) / 2)),
      isBoss,
      this.activeZombieSkin,
      this.activeDifficulty
    );

    const waveScale = 1 + (w - 1) * 0.14;
    z.maxHp = Math.round(z.maxHp * waveScale);
    z.hp = z.maxHp;
    z.damage = Math.round(z.damage * (1 + (w - 1) * 0.1));
    z.baseSpeed *= Math.min(1.35, 1 + (w - 1) * 0.03);

    this.scene.add(z.mesh);
    this.zombies.push(z);
    if (isBoss) {
      this.bossZombie = z;
    }
  }

  /**
   * Spawns Runners emerging from side niches behind the player when a hospital ward door threshold is passed.
   */
  public spawnDoorThresholdRunners(spawns: EncounterSpawnDef[]): void {
    for (const sp of spawns) {
      if (this.zombies.length >= this.maxConcurrentZombies) break;
      const runner = new Zombie(
        sp.type,
        new THREE.Vector3(sp.x, 0, sp.z),
        this.currentStreet,
        false,
        this.activeZombieSkin,
        this.activeDifficulty
      );
      this.scene.add(runner.mesh);
      this.zombies.push(runner);
    }
  }

  /**
   * Spawns 2 Runners behind the player in the extinguished lamp zone on Stage 2.
   * Placed South of the lamp (behind the North-running player) so they never block the gate ahead.
   */
  public spawnRearRunnersAtLamp(lampZ: number, playerZ: number): void {
    const spawnZ = Math.min(33, Math.max(lampZ + 3.5, playerZ + 5.5));
    const positions: Array<[number, number]> = [
      [-2.0, spawnZ],
      [2.0, spawnZ + 0.8]
    ];

    for (const [x, z] of positions) {
      if (this.zombies.length >= this.maxConcurrentZombies) break;
      const runner = new Zombie(
        'runner',
        new THREE.Vector3(x, 0, z),
        this.currentStreet,
        false,
        this.activeZombieSkin,
        this.activeDifficulty
      );
      this.scene.add(runner.mesh);
      this.zombies.push(runner);
    }
  }

  /**
   * When dashing over a wreck on Stage 2 without the "Cichy wrak" node,
   * metallic noise pulls additional Runners from the extinguished zone behind the player.
   */
  public spawnWreckNoiseRunners(playerZ: number): void {
    const spawnZ = Math.min(33.5, playerZ + 7.5);
    const positions: Array<[number, number]> = [
      [-1.4, spawnZ],
      [1.4, spawnZ + 0.6]
    ];

    for (const [x, z] of positions) {
      if (this.zombies.length >= this.maxConcurrentZombies) break;
      const runner = new Zombie(
        'runner',
        new THREE.Vector3(x, 0, z),
        this.currentStreet,
        false,
        this.activeZombieSkin,
        this.activeDifficulty
      );
      this.scene.add(runner.mesh);
      this.zombies.push(runner);
    }
  }

  private spawnEncounter(enc: StreetEncounter): void {
    enc.triggered = true;
    for (const sp of enc.spawns) {
      if (this.zombies.length >= this.maxConcurrentZombies && !sp.isBoss) {
        continue;
      }
      const z = new Zombie(
        sp.type,
        new THREE.Vector3(sp.x, 0, sp.z),
        this.currentStreet,
        Boolean(sp.isBoss),
        this.activeZombieSkin,
        this.activeDifficulty
      );
      this.scene.add(z.mesh);
      this.zombies.push(z);
      if (sp.isBoss) {
        this.bossZombie = z;
      }
    }
  }

  private disposeZombieMesh(zombie: Zombie): void {
    zombie.mesh.traverse((obj) => {
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
    this.scene.remove(zombie.mesh);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    stageElapsed: number,
    onBanner: (title: string, sub: string) => void,
    onBossDefeated: () => void,
    onSurvivalWaveStart?: (wave: number) => void
  ): void {
    // Clean up dead zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      if (this.zombies[i].isDead) {
        if (this.zombies[i] === this.bossZombie && !this.bossDefeated) {
          this.bossDefeated = true;
          if (!this.isSurvivalMode) {
            onBossDefeated();
          }
        }
        this.disposeZombieMesh(this.zombies[i]);
        this.zombies.splice(i, 1);
      }
    }

    if (this.isSurvivalMode) {
      if (this.survivalRemainingToSpawn > 0) {
        this.survivalSpawnTimer -= dt;
        if (this.survivalSpawnTimer <= 0 && this.zombies.length < this.maxConcurrentZombies) {
          this.spawnOneSurvivalZombie(playerPos);
          this.survivalRemainingToSpawn--;
          this.survivalSpawnTimer = Math.max(0.22, 0.68 - this.survivalWave * 0.04);
        }
      } else if (this.zombies.length === 0) {
        if (this.survivalBreatherTimer <= 0) {
          this.survivalBreatherTimer = 4.0;
          onBanner(`FALA ${this.survivalWave} ODPARTA`, 'Krótki oddech przed kolejną falą...');
        } else {
          this.survivalBreatherTimer -= dt;
          if (this.survivalBreatherTimer <= 0) {
            this.survivalBreatherTimer = 0;
            const nextW = this.survivalWave + 1;
            this.beginSurvivalWave(nextW);
            onBanner(`FALA ${nextW}`, 'Nadciąga liczniejsza i silniejsza horda!');
            if (onSurvivalWaveStart) {
              onSurvivalWaveStart(nextW);
            }
          }
        }
      }
      return;
    }

    // Trigger stage encounters from data based on player Z position or stage clock
    for (const enc of this.encounters) {
      if (!enc.triggered) {
        if (playerPos.z <= enc.triggerZ || stageElapsed >= enc.triggerTime) {
          this.spawnEncounter(enc);
          if (enc.bannerText) {
            onBanner(enc.bannerText, 'Biegnij do bramy albo zgarnij łup po bokach!');
          }
        }
      }
    }
  }

  public getRemainingCount(): number {
    let untriggeredCount = 0;
    for (const enc of this.encounters) {
      if (!enc.triggered) untriggeredCount += enc.spawns.length;
    }
    return this.zombies.length + untriggeredCount + this.survivalRemainingToSpawn;
  }

  public clearZombies(): void {
    for (const z of this.zombies) {
      this.disposeZombieMesh(z);
    }
    this.zombies = [];
    this.bossZombie = null;
    this.survivalRemainingToSpawn = 0;
    this.survivalBreatherTimer = 0;
  }
}
