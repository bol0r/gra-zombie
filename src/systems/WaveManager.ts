import * as THREE from 'three';
import { Zombie } from '../entities/Zombie';
import { EncounterSpawnDef, getStageDefinitionsForLevel } from '../world/CityWorld';
import { LevelId, ZombieSkinId } from './UpgradeSystem';

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
  public encounters: StreetEncounter[] = [];
  public bossZombie: Zombie | null = null;
  public bossDefeated = false;
  private readonly maxConcurrentZombies = 32;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loadStreetEncounters(1, 1);
  }

  public loadStreetEncounters(streetIndex: number, level: LevelId = this.currentLevel): void {
    this.clearZombies();
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
        this.activeZombieSkin
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
        this.activeZombieSkin
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
        this.activeZombieSkin
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
        this.activeZombieSkin
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
    _dt: number,
    playerPos: THREE.Vector3,
    stageElapsed: number,
    onBanner: (title: string, sub: string) => void,
    onBossDefeated: () => void
  ): void {
    // Clean up dead zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      if (this.zombies[i].isDead) {
        if (this.zombies[i] === this.bossZombie && !this.bossDefeated) {
          this.bossDefeated = true;
          onBossDefeated();
        }
        this.disposeZombieMesh(this.zombies[i]);
        this.zombies.splice(i, 1);
      }
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
    return this.zombies.length + untriggeredCount;
  }

  public clearZombies(): void {
    for (const z of this.zombies) {
      this.disposeZombieMesh(z);
    }
    this.zombies = [];
    this.bossZombie = null;
  }
}
