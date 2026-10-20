import * as THREE from 'three';
import {
  MELEE_WEAPONS,
  MeleeWeaponId,
  MeleeWeaponSpec,
  RangedWeaponId,
  RANGED_WEAPONS,
  RangedWeaponSpec
} from '../combat/WeaponTypes';
import { ObstacleCollider } from '../world/CityWorld';
import { PlayerSkinId, UpgradeSystem } from '../systems/UpgradeSystem';

export class Player {
  public mesh: THREE.Group;
  public position = new THREE.Vector3(0, 0, 30);
  public velocity = new THREE.Vector3(0, 0, 0);
  public aimAngle = Math.PI;

  // Core stats
  public hp = 100;
  public maxHp = 100;
  public stamina = 100;
  public maxStamina = 100;
  public staminaRegen = 34;
  public hpRegen = 0.5;

  // Tony Hawk style Special meter (0..100, never decays on its own)
  public special = 0;
  public readonly maxSpecial = 100;
  public specialGainMultiplier = 1.0;

  public kills = 0;
  public ammo = 28;

  // Base combat parameters
  public moveSpeed = 8.5;
  public damageMultiplier = 1.0;
  public rangedDamageMultiplier = 1.0;
  public attackSpeedMultiplier = 1.0;
  public rangeMultiplier = 1.0;
  public critChance = 0.16;

  // Skill Tree flags
  public dawnBonusStage12 = false;      // Świt żywych trupów: +20% melee damage on stages 1-2
  public bubCritKnockback = false;      // Bub: crits knock back stronger
  public lucilleSpecialKnockback = false; // Lucille: Rzeź has higher knockback
  public medkitBonusHp = 0;             // Szpital Dixona: medkits heal +15 HP
  public uvFlashlight = false;          // Good night, good luck: UV blinds/slows Volatiles
  public breckenDash = false;           // Brecken: shorter cooldown & cheaper stamina dash
  public keepLightStage2 = false;       // Zostaw światło: Stage 2 passed lamp extinguishes 1s later & flashlight cone slows rear Runners
  public explosiveDash = false;         // Wybuchowy parkour: dash leaves shockwave
  public cameraOnPerk = false;          // Nie wyłączaj kamery: wider flashlight cone & lower stamina drain on stage 3
  public crowndMeleeKnockback = false;  // Cr0wnd: melee hits knock back stronger
  public silentWreckStage2 = false;     // Cichy wrak: Dash over a wreck on Stage 2 does not pull extra Runners from extinguished zone
  public carnagePullToSpikes = false;   // Rzeź na kolce: Rzeź pulls hit enemies onto nearest spikes

  // Weapons
  public meleeWeapon: MeleeWeaponSpec = MELEE_WEAPONS.katana;
  public rangedWeapon: RangedWeaponSpec = RANGED_WEAPONS.shotgun;

  // Action timers
  public attackCooldown = 0;
  public shootCooldown = 0;
  public dashTimer = 0;
  public dashCooldown = 0;
  public invulnerableTimer = 0;
  public dashDir = new THREE.Vector3();

  // Sword swing state (shared between visual animation and hitbox)
  public swingSide: 1 | -1 = 1;
  private swingAnimTimer = 0;
  private swingDuration = 0.2;
  private walkCycle = 0;

  // Parts for procedural animation & skins
  private bodyGroup: THREE.Group;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private bladeMesh!: THREE.Mesh;
  private bladeGlowMat!: THREE.MeshStandardMaterial;

  private armorMat: THREE.MeshStandardMaterial;
  private jacketMat: THREE.MeshStandardMaterial;
  private visorMat: THREE.MeshStandardMaterial;
  private rickVisorCapMesh: THREE.Mesh;
  private breckenScarfMesh: THREE.Mesh;
  private angelaCameraGroup: THREE.Group;

  // Dynamic trail attached directly to rightArm (rotates with the blade, never uses negative scale)
  private slashTrailMesh: THREE.Mesh;
  private slashTrailGeo: THREE.BufferGeometry;
  private slashTrailMat: THREE.MeshBasicMaterial;
  private readonly trailSegments = 24;

  // Flashlight SpotLight following cursor
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    this.armorMat = new THREE.MeshStandardMaterial({
      color: 0x283242,
      roughness: 0.45,
      metalness: 0.45
    });
    this.jacketMat = new THREE.MeshStandardMaterial({
      color: 0x9e2a2b,
      roughness: 0.65
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0b194,
      roughness: 0.6
    });
    this.visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 2.2
    });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);
    legGeo.translate(0, -0.32, 0);
    this.leftLeg = new THREE.Mesh(legGeo, this.armorMat);
    this.leftLeg.position.set(-0.18, 0.65, 0);
    this.leftLeg.castShadow = true;
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, this.armorMat);
    this.rightLeg.position.set(0.18, 0.65, 0);
    this.rightLeg.castShadow = true;
    this.bodyGroup.add(this.rightLeg);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.4), this.jacketMat);
    torso.position.y = 1.02;
    torso.castShadow = true;
    this.bodyGroup.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.46), this.armorMat);
    chest.position.y = 1.08;
    this.bodyGroup.add(chest);

    // Head + Glowing cyber-visor
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skinMat);
    head.position.y = 1.64;
    head.castShadow = true;
    this.bodyGroup.add(head);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.25, 0.48), this.armorMat);
    hood.position.set(0, 1.76, -0.02);
    this.bodyGroup.add(hood);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.08), this.visorMat);
    visor.position.set(0, 1.65, 0.21);
    this.bodyGroup.add(visor);

    // Procedural skin details (hidden unless corresponding skin is equipped)
    // 1. Rick z ostrzyżeniem: dark cap visor brim on forehead
    const capBrimMat = new THREE.MeshStandardMaterial({
      color: 0x161922,
      roughness: 0.4,
      metalness: 0.3
    });
    this.rickVisorCapMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.26), capBrimMat);
    this.rickVisorCapMesh.position.set(0, 1.73, 0.22);
    this.rickVisorCapMesh.visible = false;
    this.bodyGroup.add(this.rickVisorCapMesh);

    // 2. Brecken: orange scarf around hood/neck
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.45,
      roughness: 0.55
    });
    this.breckenScarfMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.52), scarfMat);
    this.breckenScarfMesh.position.set(0, 1.43, 0.02);
    this.breckenScarfMesh.visible = false;
    this.bodyGroup.add(this.breckenScarfMesh);

    // 3. Ángela: shoulder camera with red REC tally light
    this.angelaCameraGroup = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
    );
    camBody.position.set(-0.34, 1.44, 0.1);
    const camRecDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xff1744,
        emissiveIntensity: 3.5
      })
    );
    camRecDot.position.set(-0.34, 1.5, 0.24);
    this.angelaCameraGroup.add(camBody, camRecDot);
    this.angelaCameraGroup.visible = false;
    this.bodyGroup.add(this.angelaCameraGroup);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.44, 1.28, 0);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.56, 0.2), this.jacketMat);
    lArmMesh.position.set(0, -0.22, 0.15);
    lArmMesh.rotation.x = -Math.PI / 3;
    this.leftArm.add(lArmMesh);
    this.bodyGroup.add(this.leftArm);

    // Right Arm + Melee Weapon pivot
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.0, 1.15, 0.05);
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.56, 0.22), this.jacketMat);
    rArmMesh.position.set(0.28, -0.05, 0.26);
    rArmMesh.rotation.x = -Math.PI / 2.3;
    this.rightArm.add(rArmMesh);

    this.buildBladeMesh();

    // Build dynamic slash trail mesh as a direct child of rightArm
    this.slashTrailGeo = new THREE.BufferGeometry();
    const vertexCount = (this.trailSegments + 1) * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices: number[] = [];
    for (let i = 0; i < this.trailSegments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    this.slashTrailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.slashTrailGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.slashTrailGeo.setIndex(indices);

    this.slashTrailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.slashTrailMesh = new THREE.Mesh(this.slashTrailGeo, this.slashTrailMat);
    this.slashTrailMesh.scale.set(1, 1, 1);
    this.slashTrailMesh.position.set(0, -0.08, 0);
    this.rightArm.add(this.slashTrailMesh);

    this.bodyGroup.add(this.rightArm);

    // Player ground indicator ring
    const footRingGeo = new THREE.RingGeometry(0.58, 0.68, 24);
    footRingGeo.rotateX(-Math.PI / 2);
    const footRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45
    });
    const footRing = new THREE.Mesh(footRingGeo, footRingMat);
    footRing.position.y = 0.03;
    this.mesh.add(footRing);

    // Dynamic conical flashlight casting shadows
    this.flashlight = new THREE.SpotLight(0xfff4d6, 36, 26, Math.PI * 0.24, 0.48, 1.2);
    this.flashlight.position.set(0, 1.5, 0.35);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.8;
    this.flashlight.shadow.camera.far = 26;
    this.mesh.add(this.flashlight);

    this.flashlightTarget = new THREE.Object3D();
    scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    scene.add(this.mesh);
  }

  private buildBladeMesh(): void {
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.38, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
    );
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, -0.08, 0.72);
    this.rightArm.add(hilt);

    this.bladeGlowMat = new THREE.MeshStandardMaterial({
      color: this.meleeWeapon.bladeColor,
      emissive: this.meleeWeapon.emissiveColor,
      emissiveIntensity: 1.6,
      metalness: 0.9,
      roughness: 0.15
    });

    this.bladeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.1), this.bladeGlowMat);
    this.bladeMesh.position.set(0, -0.08, 1.85);
    this.rightArm.add(this.bladeMesh);
  }

  public applyPlayerSkin(skinId: PlayerSkinId): void {
    this.rickVisorCapMesh.visible = false;
    this.breckenScarfMesh.visible = false;
    this.angelaCameraGroup.visible = false;

    switch (skinId) {
      case 'rick_cut':
        // Jaśniejsza kurtka i ciemny daszek
        this.jacketMat.color.setHex(0xc8a97e);
        this.armorMat.color.setHex(0x1f2430);
        this.visorMat.color.setHex(0x38bdf8);
        this.visorMat.emissive.setHex(0x0284c7);
        this.rickVisorCapMesh.visible = true;
        break;
      case 'brecken_scarf':
        // Pomarańczowy szalik przy kapturze
        this.jacketMat.color.setHex(0x4b5563);
        this.armorMat.color.setHex(0x27272a);
        this.visorMat.color.setHex(0xfbbf24);
        this.visorMat.emissive.setHex(0xf59e0b);
        this.breckenScarfMesh.visible = true;
        break;
      case 'angela_cam':
        // Biała koszula i czerwony akcent kamery na ramieniu
        this.jacketMat.color.setHex(0xf1f5f9);
        this.armorMat.color.setHex(0x334155);
        this.visorMat.color.setHex(0xff3355);
        this.visorMat.emissive.setHex(0xff1744);
        this.angelaCameraGroup.visible = true;
        break;
      case 'kurier':
      default:
        // Domyślna
        this.jacketMat.color.setHex(0x9e2a2b);
        this.armorMat.color.setHex(0x283242);
        this.visorMat.color.setHex(0x00f5ff);
        this.visorMat.emissive.setHex(0x00d9ff);
        break;
    }
  }

  public applySkillTree(upgrades: UpgradeSystem, isRoundStart = false): void {
    // Romero branch
    this.critChance = 0.16 + (upgrades.hasNode('barbara') ? 0.08 : 0);
    this.dawnBonusStage12 = upgrades.hasNode('dawn');
    this.bubCritKnockback = upgrades.hasNode('bub');

    // The Walking Dead branch
    this.lucilleSpecialKnockback = upgrades.hasNode('lucille');
    this.medkitBonusHp = upgrades.hasNode('dixon') ? 15 : 0;
    const hasRick = upgrades.hasNode('rick');
    this.rangedDamageMultiplier = hasRick ? 1.2 : 1.0;
    if (isRoundStart) {
      this.ammo = 28 + (hasRick ? 12 : 0);
    }

    // Dying Light branch
    this.uvFlashlight = upgrades.hasNode('good_night');
    this.breckenDash = upgrades.hasNode('brecken');
    this.keepLightStage2 = upgrades.hasNode('keep_light');
    this.explosiveDash = upgrades.hasNode('explosive_parkour');

    // REC / Left 4 Dead branch
    this.cameraOnPerk = upgrades.hasNode('camera_on');
    this.specialGainMultiplier = upgrades.hasNode('adrenaline') ? 1.25 : 1.0;
    this.crowndMeleeKnockback = upgrades.hasNode('crownd');
    this.silentWreckStage2 = upgrades.hasNode('silent_wreck');
    this.carnagePullToSpikes = upgrades.hasNode('carnage_spikes');

    // Apply flashlight cone width immediately
    this.flashlight.angle = this.cameraOnPerk ? Math.PI * 0.34 : Math.PI * 0.24;
  }

  public addSpecial(baseAmount: number): void {
    if (this.hp <= 0) return;
    this.special = Math.min(
      this.maxSpecial,
      this.special + baseAmount * this.specialGainMultiplier
    );
  }

  public isSpecialFull(): boolean {
    return this.special >= this.maxSpecial;
  }

  public consumeSpecial(): boolean {
    if (this.special < this.maxSpecial) return false;
    this.special = 0;
    return true;
  }

  public getSwingYawBounds(side: 1 | -1 = this.swingSide): {
    startYaw: number;
    endYaw: number;
    minYaw: number;
    maxYaw: number;
  } {
    const arc = this.meleeWeapon.arcAngle;
    const startYaw = -side * (arc * 0.46);
    const endYaw = side * (arc * 0.54);
    return {
      startYaw,
      endYaw,
      minYaw: Math.min(startYaw, endYaw),
      maxYaw: Math.max(startYaw, endYaw)
    };
  }

  private updateSlashTrailGeometry(currentYaw: number, startYaw: number): void {
    const posAttr = this.slashTrailGeo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.slashTrailGeo.getAttribute('color') as THREE.BufferAttribute;

    const innerR = 0.85;
    const outerR = this.meleeWeapon.range * this.rangeMultiplier * 0.96;
    const tailLocalYaw = startYaw - currentYaw;

    const baseColor = new THREE.Color(this.meleeWeapon.trailColor);
    const tipWhite = new THREE.Color(0xffffff);

    for (let i = 0; i <= this.trailSegments; i++) {
      const u = i / this.trailSegments;
      const localAngle = u * tailLocalYaw;

      const sinA = Math.sin(localAngle);
      const cosA = Math.cos(localAngle);

      const idx = i * 2;
      posAttr.setXYZ(idx, innerR * sinA, 0, innerR * cosA);
      const rOut = outerR * (1 - u * 0.12);
      posAttr.setXYZ(idx + 1, rOut * sinA, 0, rOut * cosA);

      const intensity = Math.pow(1 - u, 1.5);
      const c = baseColor.clone().lerp(tipWhite, (1 - u) * 0.55).multiplyScalar(intensity);

      colAttr.setXYZ(idx, c.r * 0.45, c.g * 0.45, c.b * 0.45);
      colAttr.setXYZ(idx + 1, c.r, c.g, c.b);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public equipMeleeWeapon(id: MeleeWeaponId): void {
    this.meleeWeapon = MELEE_WEAPONS[id];
    this.bladeGlowMat.color.setHex(this.meleeWeapon.bladeColor);
    this.bladeGlowMat.emissive.setHex(this.meleeWeapon.emissiveColor);
  }

  public equipRangedWeapon(id: RangedWeaponId): void {
    this.rangedWeapon = RANGED_WEAPONS[id];
  }

  public prepareNextSwing(): 1 | -1 {
    this.swingSide = this.swingSide === 1 ? -1 : 1;
    this.swingDuration = 0.2;
    this.swingAnimTimer = this.swingDuration;

    const { startYaw } = this.getSwingYawBounds(this.swingSide);
    this.rightArm.rotation.y = startYaw;
    this.updateSlashTrailGeometry(startYaw, startYaw);
    this.slashTrailMat.opacity = 0.95;

    return this.swingSide;
  }

  public startDash(moveVec: THREE.Vector2, stageNumber = 1): boolean {
    let staminaCost = this.breckenDash ? 15 : 22;
    if (stageNumber === 3 && this.cameraOnPerk) {
      staminaCost *= 0.75;
    }
    if (this.dashCooldown > 0 || this.stamina < staminaCost) return false;
    this.stamina -= staminaCost;
    this.dashTimer = 0.22;
    this.dashCooldown = this.breckenDash ? 0.36 : 0.52;
    this.invulnerableTimer = 0.28;

    if (moveVec.lengthSq() > 0.01) {
      this.dashDir.set(moveVec.x, 0, moveVec.y).normalize();
    } else {
      this.dashDir.set(Math.sin(this.aimAngle), 0, Math.cos(this.aimAngle)).normalize();
    }
    return true;
  }

  public update(
    dt: number,
    moveInput: THREE.Vector2,
    mouseWorld: THREE.Vector3,
    obstacles: ObstacleCollider[],
    arenaHalfWidth: number,
    arenaHalfLength: number,
    isNight: boolean,
    stageNumber = 1
  ): { spawnedAfterimage: boolean; vaultedObstacle: ObstacleCollider | null } {
    let spawnedAfterimage = false;
    let vaultedObstacle: ObstacleCollider | null = null;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    const stage3BonusRegen = stageNumber === 3 && this.cameraOnPerk ? 1.22 : 1.0;
    this.stamina = Math.min(
      this.maxStamina,
      this.stamina + this.staminaRegen * stage3BonusRegen * dt
    );
    this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);

    // Aim toward mouse cursor
    const dx = mouseWorld.x - this.position.x;
    const dz = mouseWorld.z - this.position.z;
    this.aimAngle = Math.atan2(dx, dz);
    this.mesh.rotation.y = this.aimAngle;

    // Update flashlight target & UV tint
    this.flashlightTarget.position.set(
      this.position.x + Math.sin(this.aimAngle) * 10,
      0.5,
      this.position.z + Math.cos(this.aimAngle) * 10
    );
    if (this.uvFlashlight) {
      this.flashlight.color.setHex(0xbf7fff);
      this.flashlight.intensity = isNight ? 68 : 38;
    } else {
      this.flashlight.color.setHex(0xfff4d6);
      this.flashlight.intensity = isNight ? 55 : 24;
    }

    // Movement or Dash/Parkour vault
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      const dashSpeed = 23;
      this.position.addScaledVector(this.dashDir, dashSpeed * dt);
      const dashPhase = 1 - this.dashTimer / 0.22;
      this.bodyGroup.position.y = Math.sin(dashPhase * Math.PI) * 1.15;
      spawnedAfterimage = true;
    } else {
      this.bodyGroup.position.y = 0;
      const desiredVel = new THREE.Vector3(moveInput.x, 0, moveInput.y).multiplyScalar(this.moveSpeed);
      this.velocity.lerp(desiredVel, 1 - Math.exp(-16 * dt));
      this.position.addScaledVector(this.velocity, dt);
    }

    // Collide with obstacles (parkour vault over car wrecks during dash)
    const isDashing = this.dashTimer > 0;
    for (const obs of obstacles) {
      const toPlayer = new THREE.Vector2(
        this.position.x - obs.position.x,
        this.position.z - obs.position.z
      );
      const minDist = obs.radius + 0.5;
      const dist = toPlayer.length();
      if (isDashing && obs.vaultable) {
        if (dist < minDist) {
          vaultedObstacle = obs;
        }
        continue;
      }
      if (dist < minDist && dist > 0.0001) {
        toPlayer.normalize().multiplyScalar(minDist - dist);
        this.position.x += toPlayer.x;
        this.position.z += toPlayer.y;
      }
    }

    // Clamp to street bounds
    const limitX = arenaHalfWidth - 0.8;
    const limitZ = arenaHalfLength - 0.8;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -limitX, limitX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -limitZ, limitZ);
    this.mesh.position.copy(this.position);

    // Procedural limb animations
    const speed = this.velocity.length();
    if (speed > 0.4 && this.dashTimer <= 0) {
      this.walkCycle += dt * speed * 1.9;
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.65;
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 12 * dt);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 12 * dt);
    }

    this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, 12 * dt);

    // Sword swing animation + synchronized blade-leading trail
    if (this.swingAnimTimer > 0) {
      this.swingAnimTimer = Math.max(0, this.swingAnimTimer - dt);
      const rawT = 1 - this.swingAnimTimer / this.swingDuration;
      const easedT = 1 - Math.pow(1 - rawT, 2.4);
      const { startYaw, endYaw } = this.getSwingYawBounds(this.swingSide);
      const currentYaw = THREE.MathUtils.lerp(startYaw, endYaw, easedT);
      this.rightArm.rotation.y = currentYaw;
      this.updateSlashTrailGeometry(currentYaw, startYaw);
      this.slashTrailMat.opacity = rawT < 0.75 ? 0.95 : (1 - (rawT - 0.75) / 0.25) * 0.95;
    } else {
      const restYaw = -this.swingSide * 0.45;
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, restYaw, 12 * dt);
      this.slashTrailMat.opacity = Math.max(0, this.slashTrailMat.opacity - 10 * dt);
    }

    return { spawnedAfterimage, vaultedObstacle };
  }

  public placeAtStreetStart(spawnPoint?: THREE.Vector3): void {
    if (spawnPoint) {
      this.position.set(spawnPoint.x, 0, spawnPoint.z);
    } else {
      this.position.set(0, 0, 30);
    }
    this.velocity.set(0, 0, 0);
    this.dashTimer = 0;
    this.mesh.position.copy(this.position);
  }

  public reset(upgrades: UpgradeSystem): void {
    this.placeAtStreetStart();
    this.hp = 100;
    this.maxHp = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.special = 0;
    this.kills = 0;
    this.moveSpeed = 8.5;
    this.damageMultiplier = 1.0;
    this.attackSpeedMultiplier = 1.0;
    this.rangeMultiplier = 1.0;
    this.equipMeleeWeapon('katana');
    this.equipRangedWeapon('shotgun');
    this.applyPlayerSkin(upgrades.selectedPlayerSkin);
    this.applySkillTree(upgrades, true);
  }
}
