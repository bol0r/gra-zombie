import * as THREE from 'three';
import { CombatSystem } from '../combat/CombatSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { DogModId } from '../systems/UpgradeSystem';
import { Player } from './Player';
import { Zombie } from './Zombie';

export class Dog {
  public mesh: THREE.Group;
  public position = new THREE.Vector3();
  public unlocked = false;
  public activeMod: DogModId = 'kiel';
  public cooldown = 0;
  public readonly maxCooldown = 8.0;

  private state: 'heel' | 'pouncing' | 'returning' = 'heel';
  private targetZombie: Zombie | null = null;
  private pounceTimer = 0;
  private dustTimer = 0;
  private legPhase = 0;

  private flLeg: THREE.Mesh;
  private frLeg: THREE.Mesh;
  private blLeg: THREE.Mesh;
  private brLeg: THREE.Mesh;
  private tail: THREE.Mesh;
  private collarMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x6b4c35,
      roughness: 0.75
    });
    const darkFurMat = new THREE.MeshStandardMaterial({
      color: 0x261c15,
      roughness: 0.8
    });
    this.collarMat = new THREE.MeshStandardMaterial({
      color: 0xff9f1c,
      emissive: 0xff6b00,
      emissiveIntensity: 0.9,
      roughness: 0.4
    });

    // Low quadruped body
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.68), coatMat);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    this.mesh.add(torso);

    const backSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.12, 0.42), darkFurMat);
    backSaddle.position.set(0, 0.45, -0.02);
    this.mesh.add(backSaddle);

    // Collar
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.1), this.collarMat);
    collar.position.set(0, 0.41, 0.28);
    this.mesh.add(collar);

    // Head + snout + pointed ears
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.28), coatMat);
    head.position.set(0, 0.52, 0.38);
    head.castShadow = true;
    this.mesh.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.22), darkFurMat);
    snout.position.set(0, 0.48, 0.56);
    this.mesh.add(snout);

    const earGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
    const leftEar = new THREE.Mesh(earGeo, darkFurMat);
    leftEar.position.set(-0.09, 0.68, 0.34);
    this.mesh.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, darkFurMat);
    rightEar.position.set(0.09, 0.68, 0.34);
    this.mesh.add(rightEar);

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.07, 0.07, 0.32);
    tailGeo.translate(0, 0, -0.14);
    this.tail = new THREE.Mesh(tailGeo, darkFurMat);
    this.tail.position.set(0, 0.44, -0.32);
    this.tail.rotation.x = -0.35;
    this.mesh.add(this.tail);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.09, 0.28, 0.09);
    legGeo.translate(0, -0.14, 0);

    this.flLeg = new THREE.Mesh(legGeo, coatMat);
    this.flLeg.position.set(-0.11, 0.26, 0.24);
    this.mesh.add(this.flLeg);

    this.frLeg = new THREE.Mesh(legGeo, coatMat);
    this.frLeg.position.set(0.11, 0.26, 0.24);
    this.mesh.add(this.frLeg);

    this.blLeg = new THREE.Mesh(legGeo, coatMat);
    this.blLeg.position.set(-0.11, 0.26, -0.24);
    this.mesh.add(this.blLeg);

    this.brLeg = new THREE.Mesh(legGeo, coatMat);
    this.brLeg.position.set(0.11, 0.26, -0.24);
    this.mesh.add(this.brLeg);

    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  public syncWithUpgrades(unlocked: boolean, modId: DogModId, playerPos: THREE.Vector3): void {
    const wasUnlocked = this.unlocked;
    this.unlocked = unlocked;
    this.activeMod = modId;
    this.mesh.visible = unlocked;

    if (modId === 'kiel') {
      this.collarMat.color.setHex(0xff3b4e);
      this.collarMat.emissive.setHex(0xff1e38);
    } else if (modId === 'warta') {
      this.collarMat.color.setHex(0x00e5ff);
      this.collarMat.emissive.setHex(0x00b4d8);
    } else {
      this.collarMat.color.setHex(0x39ff7a);
      this.collarMat.emissive.setHex(0x10b981);
    }

    if (unlocked && !wasUnlocked) {
      this.placeAtPlayer(playerPos);
    }
  }

  public placeAtPlayer(playerPos: THREE.Vector3): void {
    this.state = 'heel';
    this.targetZombie = null;
    this.pounceTimer = 0;
    this.position.set(playerPos.x - 1.15, 0, playerPos.z + 0.65);
    this.mesh.position.copy(this.position);
  }

  public resetForRound(unlocked: boolean, modId: DogModId, playerPos: THREE.Vector3): void {
    this.unlocked = unlocked;
    this.activeMod = modId;
    this.cooldown = 0;
    this.mesh.visible = unlocked;
    this.placeAtPlayer(playerPos);
  }

  private getHeelPosition(player: Player): THREE.Vector3 {
    const rightX = Math.cos(player.aimAngle);
    const rightZ = -Math.sin(player.aimAngle);
    const backX = -Math.sin(player.aimAngle);
    const backZ = -Math.cos(player.aimAngle);
    return new THREE.Vector3(
      player.position.x - rightX * 1.15 + backX * 0.55,
      0,
      player.position.z - rightZ * 1.15 + backZ * 0.55
    );
  }

  private selectTarget(
    player: Player,
    zombies: Zombie[],
    gatePos: THREE.Vector3
  ): Zombie | null {
    if (zombies.length === 0) return null;

    if (this.activeMod === 'kiel') {
      // Kieł: Rzuca się na najbliższego zombie przed graczem
      const forward = new THREE.Vector3(
        Math.sin(player.aimAngle),
        0,
        Math.cos(player.aimAngle)
      );
      let best: Zombie | null = null;
      let bestDist = 10.5;
      for (const z of zombies) {
        if (z.isDead) continue;
        const toZ = new THREE.Vector3().subVectors(z.position, player.position);
        toZ.y = 0;
        const dist = toZ.length();
        if (dist > bestDist || dist < 0.1) continue;
        const dir = toZ.clone().normalize();
        if (forward.dot(dir) >= 0.15) {
          bestDist = dist;
          best = z;
        }
      }
      return best;
    }

    if (this.activeMod === 'warta') {
      // Warta: Rzuca się na zombie, które jest najbliżej gracza w zasięgu ciosu
      let best: Zombie | null = null;
      let bestDist = 4.8;
      for (const z of zombies) {
        if (z.isDead) continue;
        const dist = player.position.distanceTo(z.position);
        if (dist <= bestDist) {
          bestDist = dist;
          best = z;
        }
      }
      return best;
    }

    // Trop: Rzuca się na zombie stojącego najbliżej linii do bramy i ściąga go z drogi. Pies nie biegnie za grupą z tyłu.
    const toGate = new THREE.Vector3().subVectors(gatePos, player.position);
    toGate.y = 0;
    const gateDist = toGate.length();
    if (gateDist < 0.5) return null;
    const gateDir = toGate.clone().normalize();

    let best: Zombie | null = null;
    let bestScore = Infinity;

    for (const z of zombies) {
      if (z.isDead) continue;
      const toZ = new THREE.Vector3().subVectors(z.position, player.position);
      toZ.y = 0;
      const distFromPlayer = toZ.length();
      if (distFromPlayer > 13.5) continue;

      // Must be ahead towards the gate, not behind the player
      const proj = toZ.dot(gateDir);
      if (proj < 0.4 || proj > gateDist + 1.5) continue;

      const perpPoint = gateDir.clone().multiplyScalar(proj);
      const perpDist = toZ.distanceTo(perpPoint);
      if (perpDist <= 3.6) {
        const score = perpDist * 2.2 + proj * 0.25;
        if (score < bestScore) {
          bestScore = score;
          best = z;
        }
      }
    }

    return best;
  }

  private executePounceImpact(
    target: Zombie,
    player: Player,
    zombies: Zombie[],
    gatePos: THREE.Vector3,
    combat: CombatSystem,
    particles: ParticleSystem,
    sound: SoundSystem
  ): void {
    // Po skoku krótki ślad kurzu i jeden jęk z istniejącego syntezatora
    particles.spawnDustPuff(target.position, 10);
    sound.playZombieGroan(false, true);

    const fromPlayer = new THREE.Vector3().subVectors(target.position, player.position);
    fromPlayer.y = 0;
    const awayDir =
      fromPlayer.lengthSq() > 0.001
        ? fromPlayer.normalize()
        : new THREE.Vector3(Math.sin(player.aimAngle), 0, Math.cos(player.aimAngle));

    if (this.activeMod === 'kiel') {
      // Kieł: Walker i Runner giną od razu. Tank i boss dostają jedno mocne ugryzienie i odrzut, nie śmierć.
      if (target.type === 'walker' || target.type === 'runner') {
        combat.damageZombie(target, 9999, awayDir, 15, true, zombies, 'dog_kiel');
      } else if (target.type === 'tank' || target.isBoss) {
        // Nie tankuje bossa ani Tanka do zera
        const safeBite = Math.max(0, Math.min(85, target.hp - 35));
        if (safeBite > 0) {
          combat.damageZombie(target, safeBite, awayDir, 22, true, zombies, 'dog_kiel');
        } else {
          target.applyKnockback(awayDir, 22);
        }
      } else {
        // Exploder: odepchnięcie z dala od gracza
        target.applyKnockback(awayDir, 22);
      }
    } else if (this.activeMod === 'warta') {
      // Warta: Zabija Walkera, Runnera albo Explodera, zanim ten zdąży wybuchnąć przy nodze. Tanka i bossa tylko odpycha.
      if (
        !target.isBoss &&
        (target.type === 'walker' || target.type === 'runner' || target.type === 'exploder')
      ) {
        combat.damageZombie(target, 9999, awayDir, 16, true, zombies, 'dog_warta');
      } else {
        target.applyKnockback(awayDir, 26);
      }
    } else {
      // Trop: Rzuca się na zombie stojącego najbliżej linii do bramy i ściąga go z drogi. Walker i Runner giną, Tank jest odepchnięty w bok.
      const toGate = new THREE.Vector3().subVectors(gatePos, player.position);
      toGate.y = 0;
      const gateDir =
        toGate.lengthSq() > 0.001 ? toGate.normalize() : new THREE.Vector3(0, 0, -1);

      const rel = new THREE.Vector3().subVectors(target.position, player.position);
      const crossY = gateDir.x * rel.z - gateDir.z * rel.x;
      const sideSign = crossY >= 0 ? 1 : -1;
      const sideDir = new THREE.Vector3(-gateDir.z * sideSign, 0, gateDir.x * sideSign).normalize();

      if (!target.isBoss && (target.type === 'walker' || target.type === 'runner')) {
        combat.damageZombie(target, 9999, sideDir, 18, true, zombies, 'dog_trop');
      } else {
        target.applyKnockback(sideDir, 28);
      }
    }
  }

  public update(
    dt: number,
    player: Player,
    zombies: Zombie[],
    gatePos: THREE.Vector3,
    combat: CombatSystem,
    particles: ParticleSystem,
    sound: SoundSystem
  ): void {
    if (!this.unlocked) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }

    const heelPos = this.getHeelPosition(player);

    if (this.state === 'heel') {
      // Follow smoothly near player's leg without blocking movement
      const toHeel = new THREE.Vector3().subVectors(heelPos, this.position);
      toHeel.y = 0;
      const dist = toHeel.length();
      if (dist > 0.05) {
        const moveStep = Math.min(dist, (player.moveSpeed + 4.5) * dt);
        this.position.addScaledVector(toHeel.normalize(), moveStep);
        this.mesh.rotation.y = Math.atan2(toHeel.x, toHeel.z);
        this.legPhase += dt * 16;
      } else {
        this.mesh.rotation.y = THREE.MathUtils.lerp(
          this.mesh.rotation.y,
          player.aimAngle,
          8 * dt
        );
      }
      this.mesh.position.set(this.position.x, 0, this.position.z);

      // Trigger automatic pounce when cooldown reaches 0
      if (this.cooldown <= 0) {
        const candidate = this.selectTarget(player, zombies, gatePos);
        if (candidate) {
          this.targetZombie = candidate;
          this.state = 'pouncing';
          this.pounceTimer = 0;
          this.dustTimer = 0;
          this.cooldown = this.maxCooldown;
          particles.spawnDustPuff(this.position, 6);
        }
      }
    } else if (this.state === 'pouncing') {
      this.pounceTimer += dt;
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.055;
        particles.spawnDustPuff(this.position, 2);
      }

      if (!this.targetZombie || this.targetZombie.isDead || this.pounceTimer > 0.75) {
        this.state = 'returning';
      } else {
        const toTarget = new THREE.Vector3().subVectors(
          this.targetZombie.position,
          this.position
        );
        toTarget.y = 0;
        const dist = toTarget.length();
        const pounceSpeed = 25.0;

        if (dist <= this.targetZombie.radius + 0.65) {
          this.executePounceImpact(
            this.targetZombie,
            player,
            zombies,
            gatePos,
            combat,
            particles,
            sound
          );
          this.targetZombie = null;
          this.state = 'returning';
        } else {
          const dir = toTarget.normalize();
          this.position.addScaledVector(dir, pounceSpeed * dt);
          this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
          this.legPhase += dt * 28;
        }
      }

      const jumpArc = Math.sin(Math.min(1, this.pounceTimer / 0.35) * Math.PI) * 0.45;
      this.mesh.position.set(this.position.x, Math.max(0, jumpArc), this.position.z);
    } else if (this.state === 'returning') {
      const toHeel = new THREE.Vector3().subVectors(heelPos, this.position);
      toHeel.y = 0;
      const dist = toHeel.length();
      const returnSpeed = 20.0;

      if (dist <= 0.45) {
        this.state = 'heel';
        this.position.copy(heelPos);
        this.mesh.position.set(this.position.x, 0, this.position.z);
      } else {
        const dir = toHeel.normalize();
        this.position.addScaledVector(dir, returnSpeed * dt);
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.legPhase += dt * 24;
      }
    }

    // Quadruped leg & tail animation
    const swing = Math.sin(this.legPhase) * 0.55;
    this.flLeg.rotation.x = swing;
    this.brLeg.rotation.x = swing;
    this.frLeg.rotation.x = -swing;
    this.blLeg.rotation.x = -swing;
    this.tail.rotation.y = Math.sin(this.legPhase * 0.8) * 0.35;
  }
}
