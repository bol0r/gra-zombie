import * as THREE from 'three';
import { ObstacleCollider } from '../world/CityWorld';
import { DIFFICULTY_CONFIGS, DifficultyId, ZombieSkinId } from '../systems/UpgradeSystem';

export type ZombieType = 'walker' | 'runner' | 'tank' | 'exploder';

export class Zombie {
  public type: ZombieType;
  public isBoss: boolean;
  public skinId: ZombieSkinId;
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity = new THREE.Vector3();
  public knockbackVel = new THREE.Vector3();

  public hp: number;
  public maxHp: number;
  public baseSpeed: number;
  public damage: number;
  public radius: number;
  public xpValue: number;
  public isDead = false;

  public attackCooldown = 0;
  public hitFlashTimer = 0;
  public burnTimer = 0;
  public burnTickTimer = 0;
  public blindedTimer = 0;
  public stunTimer = 0;
  private animPhase = Math.random() * Math.PI * 2;

  private bodyMat: THREE.MeshStandardMaterial;
  private eyeMat: THREE.MeshStandardMaterial;
  private baseBodyEmissiveHex = 0x000000;
  private baseBodyEmissiveIntensity = 0;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;

  constructor(
    type: ZombieType,
    spawnPos: THREE.Vector3,
    streetNumber: number,
    isBoss = false,
    skinId: ZombieSkinId = 'port',
    difficulty: DifficultyId = 'normal'
  ) {
    this.type = type;
    this.isBoss = isBoss;
    this.skinId = skinId;
    this.position = spawnPos.clone();
    this.mesh = new THREE.Group();

    const streetScale = 1 + (streetNumber - 1) * 0.16;
    const diffCfg = DIFFICULTY_CONFIGS[difficulty];

    // XP values calibrated so a full 3-stage round (~12-16 kills + 8-XP orbs) grants ~140-175 XP (~30-40% of 450 XP node)
    switch (type) {
      case 'runner':
        this.maxHp = Math.round(52 * streetScale * diffCfg.zombieHpMult);
        this.baseSpeed = 5.7;
        this.damage = Math.round(12 * diffCfg.zombieDmgMult);
        this.radius = 0.48;
        this.xpValue = 6;
        break;
      case 'tank':
        this.maxHp = Math.round((isBoss ? 820 : 230 * streetScale) * diffCfg.zombieHpMult);
        this.baseSpeed = isBoss ? 3.1 : 2.65;
        this.damage = Math.round((isBoss ? 36 : 26) * diffCfg.zombieDmgMult);
        this.radius = isBoss ? 1.25 : 0.88;
        this.xpValue = isBoss ? 28 : 12;
        break;
      case 'exploder':
        this.maxHp = Math.round(64 * streetScale * diffCfg.zombieHpMult);
        this.baseSpeed = 4.1;
        this.damage = Math.round(34 * diffCfg.zombieDmgMult);
        this.radius = 0.62;
        this.xpValue = 7;
        break;
      case 'walker':
      default:
        this.maxHp = Math.round(75 * streetScale * diffCfg.zombieHpMult);
        this.baseSpeed = 3.3;
        this.damage = Math.round(14 * diffCfg.zombieDmgMult);
        this.radius = 0.52;
        this.xpValue = 5;
        break;
    }
    this.hp = this.maxHp;

    let skinColor = isBoss
      ? 0x2a1b3d
      : type === 'runner'
      ? 0x6b3a3e
      : type === 'tank'
      ? 0x3b4938
      : type === 'exploder'
      ? 0x4f5d2f
      : 0x4e5b4e;

    if (skinId === 'romero') {
      // Szare ciało, mleczne oczy
      skinColor = isBoss ? 0x4c4854 : type === 'tank' ? 0x64696c : 0x7a8084;
    } else if (skinId === 'volatile_uv') {
      // Ciemniejsze żylaste ciało + mocniejsze czerwone oczy także w dzień
      skinColor = isBoss ? 0x24122e : 0x3c2c35;
      this.baseBodyEmissiveHex = 0x2a0814;
      this.baseBodyEmissiveIntensity = 0.25;
    } else if (skinId === 'rec') {
      // Bledsze ciało i zielonkawy poblask
      skinColor = isBoss ? 0x5c6b5e : 0x9eb29d;
      this.baseBodyEmissiveHex = 0x1e5c32;
      this.baseBodyEmissiveIntensity = 0.38;
    }

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      emissive: this.baseBodyEmissiveHex,
      emissiveIntensity: this.baseBodyEmissiveIntensity,
      roughness: 0.72,
      metalness: 0.12
    });

    const clothesMat = new THREE.MeshStandardMaterial({
      color: type === 'tank' ? 0x1e2229 : 0x2b2d38,
      roughness: 0.85
    });

    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff5500,
      emissiveIntensity: 1.5
    });

    const scale = isBoss
      ? 2.15
      : type === 'tank'
      ? 1.55
      : type === 'runner'
      ? 0.92
      : 1.05;
    this.mesh.scale.setScalar(scale);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.24);
    legGeo.translate(0, -0.3, 0);
    this.leftLeg = new THREE.Mesh(legGeo, clothesMat);
    this.leftLeg.position.set(-0.16, 0.6, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, clothesMat);
    this.rightLeg.position.set(0.16, 0.6, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Torso
    const torsoW = type === 'tank' ? 0.82 : 0.58;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, 0.75, 0.38), this.bodyMat);
    torso.position.y = 0.98;
    torso.castShadow = true;
    this.mesh.add(torso);

    if (isBoss) {
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xff0044,
        emissive: 0xff0044,
        emissiveIntensity: 3.0
      });
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.48), coreMat);
      core.position.set(0, 1.12, 0);
      this.mesh.add(core);
    }

    if (type === 'exploder') {
      const boilMat = new THREE.MeshStandardMaterial({
        color: 0x80ff00,
        emissive: 0x55ff00,
        emissiveIntensity: 2.2,
        roughness: 0.3
      });
      const boil1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), boilMat);
      boil1.position.set(0.12, 1.02, 0.16);
      this.mesh.add(boil1);

      const boil2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), boilMat);
      boil2.position.set(-0.18, 1.15, -0.12);
      this.mesh.add(boil2);
    }

    // Head & Glowing Eyes
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), this.bodyMat);
    head.position.y = 1.54;
    head.castShadow = true;
    this.mesh.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    leftEye.position.set(-0.09, 1.56, 0.19);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    rightEye.position.set(0.09, 1.56, 0.19);
    this.mesh.add(rightEye);

    // Outstretched Zombie Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
    armGeo.translate(0, -0.25, 0);
    this.leftArm = new THREE.Mesh(armGeo, this.bodyMat);
    this.leftArm.position.set(-torsoW * 0.58, 1.26, 0);
    this.leftArm.rotation.x = -Math.PI / 2.2;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, this.bodyMat);
    this.rightArm.position.set(torsoW * 0.58, 1.26, 0);
    this.rightArm.rotation.x = -Math.PI / 2.2;
    this.mesh.add(this.rightArm);

    this.mesh.position.copy(this.position);
  }

  public applyKnockback(dir: THREE.Vector3, force: number): void {
    const resist = this.isBoss ? 0.22 : this.type === 'tank' ? 0.45 : 1.0;
    this.knockbackVel.addScaledVector(dir, force * resist);
    this.hitFlashTimer = 0.11;
    this.bodyMat.emissive.setHex(0xffffff);
    this.bodyMat.emissiveIntensity = 0.85;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isNight: boolean,
    streetNumber: number,
    obstacles: ObstacleCollider[],
    arenaHalfWidth: number,
    arenaHalfLength: number
  ): {
    attackedPlayer: boolean;
    tankShockwave: boolean;
    exploderTriggered: boolean;
    burnTickDamage: number;
  } {
    let attackedPlayer = false;
    let tankShockwave = false;
    let exploderTriggered = false;
    let burnTickDamage = 0;

    if (this.blindedTimer > 0) {
      this.blindedTimer -= dt;
    }
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
    }

    // Eye & UV blind state + skin eye overrides
    if (this.stunTimer > 0) {
      this.eyeMat.color.setHex(0xfde047);
      this.eyeMat.emissive.setHex(0xd97706);
      this.eyeMat.emissiveIntensity = 3.2;
    } else if (this.blindedTimer > 0) {
      this.eyeMat.color.setHex(0xd896ff);
      this.eyeMat.emissive.setHex(0xb548ff);
      this.eyeMat.emissiveIntensity = 4.5;
    } else if (this.skinId === 'romero' && !this.isBoss) {
      // Mleczne oczy
      this.eyeMat.color.setHex(0xf1f5f9);
      this.eyeMat.emissive.setHex(0xcbd5e1);
      this.eyeMat.emissiveIntensity = 1.7;
    } else if (this.skinId === 'volatile_uv' || isNight || this.isBoss) {
      // Mocniejsze czerwone oczy także w dzień (Volatile UV) lub w nocy
      this.eyeMat.color.setHex(0xff002b);
      this.eyeMat.emissive.setHex(0xff002b);
      this.eyeMat.emissiveIntensity = this.skinId === 'volatile_uv' ? 4.8 : 4.2;
    } else if (this.skinId === 'rec') {
      this.eyeMat.color.setHex(0xa7f3d0);
      this.eyeMat.emissive.setHex(0x34d399);
      this.eyeMat.emissiveIntensity = 2.4;
    } else {
      this.eyeMat.color.setHex(0xffaa00);
      this.eyeMat.emissive.setHex(0xff5500);
      this.eyeMat.emissiveIntensity = 1.4;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        if (this.burnTimer > 0) {
          this.bodyMat.emissive.setHex(0xff4500);
          this.bodyMat.emissiveIntensity = 0.5;
        } else if (this.blindedTimer > 0) {
          this.bodyMat.emissive.setHex(0x6b21a8);
          this.bodyMat.emissiveIntensity = 0.45;
        } else {
          this.bodyMat.emissive.setHex(this.baseBodyEmissiveHex);
          this.bodyMat.emissiveIntensity = this.baseBodyEmissiveIntensity;
        }
      }
    } else if (this.blindedTimer > 0) {
      this.bodyMat.emissive.setHex(0x6b21a8);
      this.bodyMat.emissiveIntensity = 0.45;
    } else if (this.burnTimer <= 0) {
      this.bodyMat.emissive.setHex(this.baseBodyEmissiveHex);
      this.bodyMat.emissiveIntensity = this.baseBodyEmissiveIntensity;
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.4;
        burnTickDamage = 14;
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    const dirToPlayer = distToPlayer > 0.001 ? toPlayer.clone().normalize() : new THREE.Vector3(0, 0, 1);

    this.mesh.rotation.y = Math.atan2(dirToPlayer.x, dirToPlayer.z);

    // Street 1 daytime zombies are slower; Night Volatiles are faster; UV Flashlight slows by 58%; Stun freezes
    const streetMult = streetNumber === 1 ? 0.8 : isNight ? 1.38 : 1.0;
    const blindMult = this.stunTimer > 0 ? 0.0 : this.blindedTimer > 0 ? 0.42 : 1.0;
    const effectiveSpeed = this.baseSpeed * streetMult * blindMult;

    if (distToPlayer > this.radius + 0.65) {
      this.position.addScaledVector(dirToPlayer, effectiveSpeed * dt);
    } else if (this.attackCooldown <= 0 && this.stunTimer <= 0) {
      if (this.type === 'exploder') {
        exploderTriggered = true;
      } else if (this.type === 'tank') {
        this.attackCooldown = this.isBoss ? 1.55 : 1.9;
        tankShockwave = true;
      } else {
        this.attackCooldown = isNight ? 0.78 : 1.05;
        attackedPlayer = true;
      }
    }

    if (this.type === 'exploder' && distToPlayer < 3.6) {
      const swell = 1.05 + Math.sin(performance.now() * 0.025) * 0.16;
      this.mesh.scale.setScalar(swell);
    }

    if (this.knockbackVel.lengthSq() > 0.05) {
      this.position.addScaledVector(this.knockbackVel, dt);
      this.knockbackVel.multiplyScalar(Math.exp(-10 * dt));
    }

    // Obstacle pushout
    for (const obs of obstacles) {
      const dx = this.position.x - obs.position.x;
      const dz = this.position.z - obs.position.z;
      const minDist = obs.radius + this.radius;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDist * minDist && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        this.position.x += (dx / d) * (minDist - d);
        this.position.z += (dz / d) * (minDist - d);
      }
    }

    // Keep inside street corridor
    const limitX = arenaHalfWidth - this.radius;
    const limitZ = arenaHalfLength - this.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -limitX, limitX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -limitZ, limitZ);

    this.mesh.position.copy(this.position);

    this.animPhase += dt * effectiveSpeed * 2.4;
    const swing = Math.sin(this.animPhase) * 0.6;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -Math.PI / 2.1 + Math.cos(this.animPhase) * 0.25;
    this.rightArm.rotation.x = -Math.PI / 2.1 - Math.cos(this.animPhase) * 0.25;

    return {
      attackedPlayer,
      tankShockwave,
      exploderTriggered,
      burnTickDamage
    };
  }
}
