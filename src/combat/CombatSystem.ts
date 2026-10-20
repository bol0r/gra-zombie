import * as THREE from 'three';
import { Player } from '../entities/Player';
import { Zombie } from '../entities/Zombie';
import { CityWorld, ExplosiveBarrel } from '../world/CityWorld';
import { ParticleSystem } from '../systems/ParticleSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { HitStopManager } from '../core/HitStopManager';
import { IsometricCamera } from '../core/IsometricCamera';
import { UIManager } from '../systems/UIManager';

function normalizeAngle(rad: number): number {
  while (rad > Math.PI) rad -= Math.PI * 2;
  while (rad < -Math.PI) rad += Math.PI * 2;
  return rad;
}

export class CombatSystem {
  constructor(
    private player: Player,
    private world: CityWorld,
    private particles: ParticleSystem,
    private sound: SoundSystem,
    private hitStop: HitStopManager,
    private camera: IsometricCamera,
    private ui: UIManager,
    private onZombieKilled: (zombie: Zombie, cause: string) => void
  ) {}

  public performMeleeAttack(zombies: Zombie[], stageNumber = 1): void {
    const weapon = this.player.meleeWeapon;
    if (this.player.attackCooldown > 0) return;

    this.player.attackCooldown = weapon.cooldown / this.player.attackSpeedMultiplier;

    // Advance swing side and get exact yaw cone bounds matching the blade animation
    const swingSide = this.player.prepareNextSwing();
    const { minYaw, maxYaw } = this.player.getSwingYawBounds(swingSide);

    this.sound.playSlash(Boolean(weapon.chainLightning), Boolean(weapon.burnDamage));

    const forward = new THREE.Vector3(
      Math.sin(this.player.aimAngle),
      0,
      Math.cos(this.player.aimAngle)
    );
    const sweepTangent = new THREE.Vector3(
      Math.cos(this.player.aimAngle) * swingSide,
      0,
      -Math.sin(this.player.aimAngle) * swingSide
    );

    const effectiveRange = weapon.range * this.player.rangeMultiplier;
    const dawnStageMult =
      this.player.dawnBonusStage12 && (stageNumber === 1 || stageNumber === 2) ? 1.2 : 1.0;

    let hitCount = 0;
    let anyCrit = false;

    for (const z of zombies) {
      if (z.isDead) continue;
      const toZ = new THREE.Vector3().subVectors(z.position, this.player.position);
      toZ.y = 0;
      const dist = toZ.length();
      if (dist > effectiveRange + z.radius) continue;

      const worldYaw = Math.atan2(toZ.x, toZ.z);
      const relYaw = normalizeAngle(worldYaw - this.player.aimAngle);
      const angularRadius = dist > 0.2 ? Math.atan2(z.radius, dist) : Math.PI;

      if ((relYaw >= minYaw - angularRadius && relYaw <= maxYaw + angularRadius) || dist < 1.1) {
        hitCount++;
        const isCrit = Math.random() < this.player.critChance;
        if (isCrit) anyCrit = true;

        const dmg = Math.round(
          weapon.damage *
            this.player.damageMultiplier *
            dawnStageMult *
            (isCrit ? 1.85 : 1.0)
        );
        const radialDir = dist > 0.001 ? toZ.clone().normalize() : forward.clone();
        const knockDir = radialDir.addScaledVector(sweepTangent, 0.38).normalize();

        let knockForce = weapon.knockback;
        if (this.player.crowndMeleeKnockback) knockForce *= 1.38;
        if (isCrit && this.player.bubCritKnockback) knockForce *= 1.48;

        // Trafienie: +6 do paska special (z uwzględnieniem Adrenaliny w addSpecial)
        this.player.addSpecial(6);

        this.damageZombie(z, dmg, knockDir, knockForce, isCrit, zombies);

        if (weapon.burnDamage) {
          z.burnTimer = 3.2;
          this.particles.spawnSparks(z.position, 0xff5400, 8);
        }

        if (weapon.chainLightning) {
          this.triggerChainLightning(z, zombies, Math.round(dmg * 0.55));
        }
      }
    }

    // Check if melee hit any explosive barrels in the same swing cone
    for (const barrel of this.world.barrels) {
      if (barrel.exploded) continue;
      const toB = new THREE.Vector3().subVectors(barrel.position, this.player.position);
      toB.y = 0;
      const dist = toB.length();
      if (dist <= effectiveRange + barrel.radius) {
        const relYaw = normalizeAngle(Math.atan2(toB.x, toB.z) - this.player.aimAngle);
        if (relYaw >= minYaw - 0.25 && relYaw <= maxYaw + 0.25) {
          this.detonateBarrel(barrel, zombies);
        }
      }
    }

    if (hitCount > 0) {
      this.sound.playHit(anyCrit, Boolean(weapon.chainLightning));
      this.hitStop.triggerHitStop(anyCrit ? 0.055 : 0.032);
      this.camera.addShake(anyCrit ? 0.36 : 0.2);
    }
  }

  private triggerChainLightning(sourceZombie: Zombie, zombies: Zombie[], arcDamage: number): void {
    let currentPos = sourceZombie.position.clone();
    const visited = new Set<Zombie>([sourceZombie]);

    for (let jump = 0; jump < 3; jump++) {
      let nearest: Zombie | null = null;
      let nearestDist = 6.5;

      for (const candidate of zombies) {
        if (candidate.isDead || visited.has(candidate)) continue;
        const d = currentPos.distanceTo(candidate.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = candidate;
        }
      }

      if (!nearest) break;
      visited.add(nearest);

      this.particles.spawnLightningArc(currentPos, nearest.position, 0x00f5ff);
      const pushDir = new THREE.Vector3().subVectors(nearest.position, currentPos).normalize();
      this.damageZombie(nearest, arcDamage, pushDir, 4.0, false, zombies);
      currentPos = nearest.position.clone();
    }
  }

  public performRangedAttack(zombies: Zombie[]): void {
    const weapon = this.player.rangedWeapon;
    if (this.player.shootCooldown > 0) return;
    if (this.player.ammo <= 0) {
      this.ui.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2, 0)),
        'BRAK AMUNICJI!',
        '#ff4d6d'
      );
      return;
    }

    this.player.ammo--;
    this.player.shootCooldown = weapon.cooldown / this.player.attackSpeedMultiplier;
    this.sound.playShotgun();
    this.camera.addShake(0.32);
    this.camera.punchZoom(0.25);

    const origin = this.player.position.clone().add(new THREE.Vector3(0, 0.2, 0));
    let gainedHitSpecial = false;

    for (let p = 0; p < weapon.pellets; p++) {
      const spreadAngle =
        this.player.aimAngle + (Math.random() - 0.5) * weapon.spread;
      const dir = new THREE.Vector3(Math.sin(spreadAngle), 0, Math.cos(spreadAngle));
      const endPoint = origin.clone().addScaledVector(dir, weapon.range);

      let closestZombie: Zombie | null = null;
      let closestDist = weapon.range;

      for (const z of zombies) {
        if (z.isDead) continue;
        const toZ = new THREE.Vector3().subVectors(z.position, origin);
        toZ.y = 0;
        const proj = toZ.dot(dir);
        if (proj < 0 || proj > closestDist) continue;
        const perpSq = toZ.lengthSq() - proj * proj;
        const hitRadius = z.radius + 0.35;
        if (perpSq <= hitRadius * hitRadius) {
          closestDist = proj;
          closestZombie = z;
        }
      }

      for (const barrel of this.world.barrels) {
        if (barrel.exploded) continue;
        const toB = new THREE.Vector3().subVectors(barrel.position, origin);
        toB.y = 0;
        const proj = toB.dot(dir);
        if (proj > 0 && proj < closestDist) {
          const perpSq = toB.lengthSq() - proj * proj;
          if (perpSq <= (barrel.radius + 0.35) ** 2) {
            closestDist = proj;
            closestZombie = null;
            this.detonateBarrel(barrel, zombies);
          }
        }
      }

      if (closestZombie) {
        if (!gainedHitSpecial) {
          gainedHitSpecial = true;
          this.player.addSpecial(6);
        }
        endPoint.copy(origin).addScaledVector(dir, closestDist);
        const isCrit = Math.random() < this.player.critChance;
        const dmg = Math.round(
          weapon.damage *
            this.player.damageMultiplier *
            this.player.rangedDamageMultiplier *
            (isCrit ? 1.75 : 1.0)
        );
        const knockForce =
          weapon.knockback * (isCrit && this.player.bubCritKnockback ? 1.4 : 1.0);
        this.damageZombie(closestZombie, dmg, dir, knockForce, isCrit, zombies);
      }

      this.particles.spawnLightningArc(origin, endPoint, weapon.color);
    }
  }

  /**
   * Aktywuje umiejętność specjalną „Rzeź” (E albo F) tylko przy pełnym pasku (100/100)
   * i zużywa pasek do zera. Pusty lub niepełny pasek nie robi nic.
   */
  public performSpecialCarnage(zombies: Zombie[]): boolean {
    if (!this.player.consumeSpecial()) return false;

    this.sound.playSpecialCarnage();
    this.hitStop.triggerHitStop(0.085);
    this.camera.addShake(0.88);
    this.camera.punchZoom(0.45);

    const waveRadius = 6.0;
    this.particles.spawnShockwaveRing(this.player.position, waveRadius, 0xff2a4b, 0.42);
    this.particles.spawnShockwaveRing(this.player.position, waveRadius * 0.72, 0xffbe0b, 0.32);
    this.particles.spawnSparks(this.player.position, 0xffbe0b, 26);

    this.ui.spawnFloatingText(
      this.player.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
      'RZEŹ!',
      '#ffbe0b',
      true
    );

    const baseForce = this.player.lucilleSpecialKnockback ? 38 : 26;

    for (const z of zombies) {
      if (z.isDead) continue;
      const toZ = new THREE.Vector3().subVectors(z.position, this.player.position);
      toZ.y = 0;
      const dist = toZ.length();
      if (dist > waveRadius + z.radius) continue;

      let dir = dist > 0.001 ? toZ.clone().normalize() : new THREE.Vector3(0, 0, -1);
      let force = baseForce;

      // Węzeł „Rzeź na kolce”: ściąga trafionych na najbliższe kolce
      if (this.player.carnagePullToSpikes && this.world.spikes.length > 0) {
        let bestSpike = this.world.spikes[0];
        let bestDist = Infinity;
        for (const spike of this.world.spikes) {
          const dSpike = z.position.distanceTo(spike.position);
          if (dSpike < bestDist) {
            bestDist = dSpike;
            bestSpike = spike;
          }
        }
        if (bestDist < 18) {
          dir = new THREE.Vector3().subVectors(bestSpike.position, z.position);
          dir.y = 0;
          if (dir.lengthSq() > 0.001) dir.normalize();
          force = Math.max(baseForce, 34);
          this.particles.spawnLightningArc(z.position, bestSpike.position, 0xffbe0b);
        }
      }

      const dmg = z.isBoss ? 190 : 210;
      this.damageZombie(z, dmg, dir, force, true, zombies, 'special');
    }

    // Fala Rzezi odpala też pobliskie wybuchowe beczki w zasięgu 6 m
    for (const barrel of this.world.barrels) {
      if (barrel.exploded) continue;
      if (barrel.position.distanceTo(this.player.position) <= waveRadius + barrel.radius) {
        this.detonateBarrel(barrel, zombies);
      }
    }

    return true;
  }

  public checkEnvironmentalHazards(zombies: Zombie[]): void {
    for (const z of zombies) {
      if (z.isDead) continue;

      // 1. Environmental Spike Traps
      for (const spike of this.world.spikes) {
        const dx = z.position.x - spike.position.x;
        const dz = z.position.z - spike.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < spike.radius + z.radius * 0.75) {
          const isBeingKnocked = z.knockbackVel.lengthSq() > 5.0;
          if (z.isBoss) {
            if (isBeingKnocked && spike.cooldown <= 0) {
              spike.cooldown = 1.5;
              this.ui.spawnFloatingText(
                z.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
                'KOLCE -180!',
                '#ffbe0b',
                true
              );
              this.damageZombie(
                z,
                180,
                new THREE.Vector3(dx, 0, dz).normalize(),
                6,
                true,
                zombies,
                'spikes'
              );
            }
          } else if (isBeingKnocked || z.type !== 'tank') {
            this.ui.spawnFloatingText(
              z.position.clone().add(new THREE.Vector3(0, 2.1, 0)),
              'NABITY NA KOLCE!',
              '#ffbe0b',
              true
            );
            this.damageZombie(
              z,
              9999,
              new THREE.Vector3(dx, 0, dz).normalize(),
              4,
              true,
              zombies,
              'spikes'
            );
            break;
          }
        }
      }

      if (z.isDead) continue;

      // 2. Knocked-back zombie slamming into an explosive barrel detonates it
      if (z.knockbackVel.lengthSq() > 14) {
        for (const barrel of this.world.barrels) {
          if (barrel.exploded) continue;
          const dist = z.position.distanceTo(barrel.position);
          if (dist < barrel.radius + z.radius + 0.4) {
            this.detonateBarrel(barrel, zombies);
          }
        }
      }
    }
  }

  public detonateBarrel(barrel: ExplosiveBarrel, zombies: Zombie[]): void {
    if (barrel.exploded) return;
    barrel.exploded = true;
    barrel.respawnTimer = 22;
    barrel.mesh.visible = false;

    this.sound.playExplosion();
    this.particles.spawnExplosion(barrel.position, 0xff4d00, 5.8);
    this.camera.addShake(0.75);
    this.hitStop.triggerHitStop(0.06);

    const blastRadius = 5.8;
    for (const z of zombies) {
      if (z.isDead) continue;
      const toZ = new THREE.Vector3().subVectors(z.position, barrel.position);
      toZ.y = 0;
      const dist = toZ.length();
      if (dist <= blastRadius) {
        const dir = dist > 0.01 ? toZ.normalize() : new THREE.Vector3(1, 0, 0);
        const falloff = 1 - (dist / blastRadius) * 0.45;
        const dmg = Math.round(175 * falloff);
        z.burnTimer = 4.0;
        this.damageZombie(z, dmg, dir, 20, true, zombies, 'explosion');
      }
    }

    for (const other of this.world.barrels) {
      if (!other.exploded && other.position.distanceTo(barrel.position) < blastRadius) {
        this.detonateBarrel(other, zombies);
      }
    }
  }

  public detonateExploderZombie(exploder: Zombie, zombies: Zombie[]): void {
    if (exploder.isDead) return;
    exploder.isDead = true;
    exploder.hp = 0;

    this.sound.playExplosion();
    this.particles.spawnExplosion(exploder.position, 0x80ff00, 4.6);
    this.particles.spawnBloodBurst(exploder.position, new THREE.Vector3(0, 1, 0), 22);
    this.camera.addShake(0.55);

    const radius = 4.5;
    for (const z of zombies) {
      if (z.isDead || z === exploder) continue;
      const toZ = new THREE.Vector3().subVectors(z.position, exploder.position);
      toZ.y = 0;
      const d = toZ.length();
      if (d < radius) {
        this.damageZombie(z, 95, toZ.normalize(), 16, true, zombies, 'exploder');
      }
    }

    this.onZombieKilled(exploder, 'exploder');
  }

  public damageZombie(
    zombie: Zombie,
    amount: number,
    knockDir: THREE.Vector3,
    knockForce: number,
    isCrit: boolean,
    allZombies: Zombie[],
    cause = 'combat'
  ): void {
    if (zombie.isDead) return;

    zombie.hp -= amount;
    zombie.applyKnockback(knockDir, knockForce);

    this.particles.spawnBloodBurst(zombie.position, knockDir, isCrit ? 16 : 9);

    if (amount < 9000) {
      this.ui.spawnFloatingText(
        zombie.position.clone().add(new THREE.Vector3(0, 1.8, 0)),
        `${amount}${isCrit ? '!' : ''}`,
        isCrit ? '#ffdf40' : '#ffffff',
        isCrit
      );
    }

    if (zombie.hp <= 0) {
      if (zombie.type === 'exploder' && cause !== 'exploder' && cause !== 'dog_warta') {
        this.detonateExploderZombie(zombie, allZombies);
      } else {
        zombie.isDead = true;
        this.particles.spawnBloodBurst(zombie.position, knockDir, 18);
        this.onZombieKilled(zombie, cause);
      }
    }
  }
}
