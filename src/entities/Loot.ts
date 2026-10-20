import * as THREE from 'three';
import {
  MELEE_WEAPONS,
  MeleeWeaponId,
  RANGED_WEAPONS,
  RangedWeaponId
} from '../combat/WeaponTypes';
import { DIFFICULTY_CONFIGS, DifficultyId, LevelId } from '../systems/UpgradeSystem';

export type LootType = 'xp' | 'coin' | 'health' | 'ammo' | 'weapon';

export interface LootDrop {
  type: LootType;
  mesh: THREE.Group;
  position: THREE.Vector3;
  value: number;
  weaponMelee?: MeleeWeaponId;
  weaponRanged?: RangedWeaponId;
  weaponLabel?: string;
  age: number;
  persistent?: boolean;
}

export class LootManager {
  private scene: THREE.Scene;
  public drops: LootDrop[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 8 broni rozrzuconych po wszystkich poziomach i etapach (nie 8 na jednej ulicy):
   * L1E1: Młotek (hammer)
   * L1E2: Strzelba (shotgun)
   * L1E3: Topór (axe)
   * L2E1: Karabin (rifle)
   * L2E2: Obrzyn (sawed_off)
   * L2E3: Maczeta elektryczna (electric_machete)
   * L3E1: Pistolet (pistol)
   * L3E2: Katana (katana)
   */
  public spawnStreetSupplies(streetIndex: number, level: LevelId = 1): void {
    this.clearAll();
    if (level === 3) {
      if (streetIndex === 1) {
        // Tunel dworca + Pistolet
        this.createWeaponDrop(new THREE.Vector3(-4.6, 0, 11), undefined, 'pistol');
        this.createDrop('ammo', new THREE.Vector3(5.5, 0, 21), 5, true);
        this.createDrop('coin', new THREE.Vector3(4.2, 0, 9), 1, true);
        this.createDrop('health', new THREE.Vector3(-5.5, 0, 5), 28, true);
        this.createDrop('xp', new THREE.Vector3(-5.5, 0, -2), 8, true);
        this.createDrop('coin', new THREE.Vector3(-4.2, 0, -10.5), 1, true);
        this.createDrop('ammo', new THREE.Vector3(5.5, 0, -15), 5, true);
        this.createDrop('coin', new THREE.Vector3(5.8, 0, -26.5), 1, true);
      } else if (streetIndex === 2) {
        // Tory kolejowe + Katana
        this.createWeaponDrop(new THREE.Vector3(0.0, 0, 6), 'katana', undefined);
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, 15), 5, true);
        this.createDrop('coin', new THREE.Vector3(-6.8, 0, 13), 1, true);
        this.createDrop('health', new THREE.Vector3(0.0, 0, 3), 28, true);
        this.createDrop('coin', new THREE.Vector3(6.8, 0, 3), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -9), 8, true);
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, -20), 6, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -29), 1, true);
      } else {
        // Hala dworca
        this.createDrop('health', new THREE.Vector3(-9.0, 0, 14), 32, true);
        this.createDrop('ammo', new THREE.Vector3(9.0, 0, 14), 6, true);
        this.createDrop('coin', new THREE.Vector3(-9.5, 0, 0), 1, true);
        this.createDrop('coin', new THREE.Vector3(9.5, 0, 0), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -12), 8, true);
        this.createDrop('health', new THREE.Vector3(-9.0, 0, -16), 32, true);
        this.createDrop('ammo', new THREE.Vector3(9.0, 0, -16), 6, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -24), 1, true);
      }
      return;
    }

    if (level === 2) {
      if (streetIndex === 1) {
        // Parking pod szpitalem + Karabin
        this.createWeaponDrop(new THREE.Vector3(-2.2, 0, 7), undefined, 'rifle');
        this.createDrop('ammo', new THREE.Vector3(-8.5, 0, 14), 5, true);
        this.createDrop('coin', new THREE.Vector3(-8.5, 0, 4), 1, true);
        this.createDrop('health', new THREE.Vector3(-2.0, 0, -4), 28, true);
        this.createDrop('xp', new THREE.Vector3(9.5, 0, -4), 8, true);
        this.createDrop('coin', new THREE.Vector3(9.5, 0, 4), 1, true);
        this.createDrop('ammo', new THREE.Vector3(9.5, 0, 10), 5, true);
        this.createDrop('coin', new THREE.Vector3(11.5, 0, 13), 1, true);
      } else if (streetIndex === 2) {
        // Oddział + Obrzyn
        this.createWeaponDrop(new THREE.Vector3(2.4, 0, 11), undefined, 'sawed_off');
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, 22), 5, true);
        this.createDrop('coin', new THREE.Vector3(-6.2, 0, 10), 1, true);
        this.createDrop('health', new THREE.Vector3(0.0, 0, 6), 28, true);
        this.createDrop('coin', new THREE.Vector3(6.2, 0, 10), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -4), 8, true);
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, -18), 6, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -26), 1, true);
      } else {
        // Lądowisko na dachu + Maczeta elektryczna
        this.createWeaponDrop(new THREE.Vector3(0.0, 0, 12), 'electric_machete', undefined);
        this.createDrop('health', new THREE.Vector3(-7.0, 0, 14), 32, true);
        this.createDrop('ammo', new THREE.Vector3(7.0, 0, 14), 6, true);
        this.createDrop('coin', new THREE.Vector3(-6.0, 0, 2), 1, true);
        this.createDrop('coin', new THREE.Vector3(6.0, 0, 2), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -6), 8, true);
        this.createDrop('health', new THREE.Vector3(-7.5, 0, -14), 32, true);
        this.createDrop('ammo', new THREE.Vector3(7.5, 0, -14), 6, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -18), 1, true);
      }
      return;
    }

    if (streetIndex === 1) {
      // Poziom 1 Etap 1: Kordon + Młotek
      this.createWeaponDrop(new THREE.Vector3(-3.4, 0, 11), 'hammer', undefined);
      this.createDrop('ammo', new THREE.Vector3(-3.2, 0, 24), 5, true);
      this.createDrop('coin', new THREE.Vector3(2.2, 0, 21), 1, true);
      this.createDrop('health', new THREE.Vector3(3.5, 0, 15), 28, true);
      this.createDrop('xp', new THREE.Vector3(-2.5, 0, 6), 8, true);
      this.createDrop('coin', new THREE.Vector3(0.4, 0, -2), 1, true);
      this.createDrop('ammo', new THREE.Vector3(3.8, 0, -6), 5, true);
      this.createDrop('health', new THREE.Vector3(-3.2, 0, -18), 28, true);
      this.createDrop('coin', new THREE.Vector3(-1.8, 0, -22), 1, true);
      this.createDrop('xp', new THREE.Vector3(2.5, 0, -24), 8, true);
    } else if (streetIndex === 2) {
      // Poziom 1 Etap 2: Wygaszane latarnie + Strzelba
      this.createWeaponDrop(new THREE.Vector3(3.2, 0, 8), undefined, 'shotgun');
      this.createDrop('ammo', new THREE.Vector3(2.4, 0, 19), 5, true);
      this.createDrop('coin', new THREE.Vector3(-2.1, 0, 14), 1, true);
      this.createDrop('health', new THREE.Vector3(-2.4, 0, 1), 28, true);
      this.createDrop('coin', new THREE.Vector3(1.8, 0, -5), 1, true);
      this.createDrop('xp', new THREE.Vector3(-1.6, 0, -11), 8, true);
      this.createDrop('ammo', new THREE.Vector3(2.2, 0, -16), 6, true);
      this.createDrop('coin', new THREE.Vector3(0.0, 0, -23), 1, true);
    } else {
      // Poziom 1 Etap 3: Plac Dead Net Labs + Topór
      this.createWeaponDrop(new THREE.Vector3(0.0, 0, 14), 'axe', undefined);
      this.createDrop('health', new THREE.Vector3(-4.0, 0, 18), 32, true);
      this.createDrop('ammo', new THREE.Vector3(4.0, 0, 18), 6, true);
      this.createDrop('coin', new THREE.Vector3(-2.8, 0, 8), 1, true);
      this.createDrop('coin', new THREE.Vector3(2.8, 0, -3), 1, true);
      this.createDrop('xp', new THREE.Vector3(0.0, 0, -8), 8, true);
      this.createDrop('health', new THREE.Vector3(-5.0, 0, -14), 32, true);
      this.createDrop('ammo', new THREE.Vector3(5.0, 0, -14), 6, true);
      this.createDrop('coin', new THREE.Vector3(0.0, 0, -21), 1, true);
    }
  }

  public spawnSurvivalWaveSupplies(wave: number): void {
    const angle = (wave * 1.7) % (Math.PI * 2);
    const rx = Math.cos(angle) * 5.5;
    const rz = Math.sin(angle) * 9.0;
    this.createDrop('ammo', new THREE.Vector3(rx, 0, rz), 5, false);
    if (wave % 2 === 0) {
      this.createDrop('health', new THREE.Vector3(-rx, 0, -rz * 0.6), 25, false);
    }

    // Co falę na arenie Przetrwania pojawia się jedna z 8 broni do podniesienia
    const pool: Array<{ melee?: MeleeWeaponId; ranged?: RangedWeaponId }> = [
      { melee: 'hammer' },
      { ranged: 'shotgun' },
      { melee: 'axe' },
      { ranged: 'rifle' },
      { melee: 'electric_machete' },
      { ranged: 'sawed_off' },
      { melee: 'katana' },
      { ranged: 'pistol' }
    ];
    const pick = pool[(wave - 1) % pool.length];
    this.createWeaponDrop(
      new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 10),
      pick.melee,
      pick.ranged
    );
  }

  public spawnDropFromZombie(
    pos: THREE.Vector3,
    isBoss: boolean,
    isTank: boolean,
    difficulty: DifficultyId = 'normal'
  ): void {
    // Kule XP dają zawsze po 8 XP
    this.createDrop(
      'xp',
      pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8)),
      8
    );

    // Monety wypadają z części zombie
    if (isBoss) {
      this.createDrop('coin', pos.clone().add(new THREE.Vector3(0.45, 0, 0.35)), 2);
    } else {
      const coinChance = isTank ? 0.75 : 0.35;
      if (Math.random() < coinChance) {
        this.createDrop(
          'coin',
          pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, 0, (Math.random() - 0.5) * 0.9)),
          1
        );
      }
    }

    const diffCfg = DIFFICULTY_CONFIGS[difficulty];
    const ammoChance = (isTank ? 0.42 : 0.14) * diffCfg.ammoDropChanceMult;
    const healthChance = isTank ? 0.24 : 0.12;
    const supplyRoll = Math.random();
    if (supplyRoll < ammoChance) {
      this.createDrop('ammo', pos.clone().add(new THREE.Vector3(0.5, 0, -0.4)), 4);
    } else if (supplyRoll < ammoChance + healthChance) {
      this.createDrop('health', pos.clone().add(new THREE.Vector3(-0.5, 0, 0.4)), 22);
    }
  }

  public createWeaponDrop(
    pos: THREE.Vector3,
    weaponMelee?: MeleeWeaponId,
    weaponRanged?: RangedWeaponId
  ): void {
    const group = new THREE.Group();
    const spec = weaponMelee
      ? MELEE_WEAPONS[weaponMelee]
      : weaponRanged
      ? RANGED_WEAPONS[weaponRanged]
      : MELEE_WEAPONS.katana;
    const color = weaponMelee
      ? MELEE_WEAPONS[weaponMelee].emissiveColor
      : weaponRanged
      ? RANGED_WEAPONS[weaponRanged].color
      : 0xd97706;

    const ringGeo = new THREE.RingGeometry(0.48, 0.62, 20);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    group.add(ring);

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.8,
      roughness: 0.25,
      metalness: 0.75
    });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.24, 0.32), mat);
    crate.position.y = 0.52;
    group.add(crate);

    group.position.set(pos.x, 0, pos.z);
    this.scene.add(group);

    this.drops.push({
      type: 'weapon',
      mesh: group,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      value: 1,
      weaponMelee,
      weaponRanged,
      weaponLabel: spec.name,
      age: 0,
      persistent: true
    });
  }

  private createDrop(
    type: LootType,
    pos: THREE.Vector3,
    value: number,
    persistent = false
  ): void {
    const group = new THREE.Group();

    const color =
      type === 'xp'
        ? 0xd6c7b2
        : type === 'coin'
        ? 0xd97706
        : type === 'health'
        ? 0xb91c1c
        : 0xeab308;

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: type === 'coin' ? 2.0 : 1.5,
      roughness: type === 'coin' ? 0.2 : 0.3,
      metalness: type === 'coin' ? 0.8 : 0.3
    });

    let mesh: THREE.Mesh;
    if (type === 'xp') {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mat);
    } else if (type === 'coin') {
      const coinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.07, 16);
      coinGeo.rotateZ(Math.PI / 2);
      mesh = new THREE.Mesh(coinGeo, mat);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), mat);
    }
    mesh.position.y = 0.45;
    group.add(mesh);

    group.position.set(pos.x, 0, pos.z);
    this.scene.add(group);

    this.drops.push({
      type,
      mesh: group,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      value,
      age: 0,
      persistent
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onCollect: (drop: LootDrop) => void
  ): void {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.age += dt;
      d.mesh.rotation.y += (d.type === 'coin' ? 3.8 : 2.2) * dt;
      d.mesh.position.y = Math.sin(d.age * 4) * 0.08;

      const dx = playerPos.x - d.position.x;
      const dz = playerPos.z - d.position.z;
      const dist = Math.hypot(dx, dz);

      const magnetRadius = d.type === 'xp' || d.type === 'coin' ? 5.0 : d.type === 'weapon' ? 1.8 : 3.2;
      if (d.type !== 'weapon' && dist < magnetRadius && dist > 0.01) {
        const pullSpeed = d.type === 'xp' || d.type === 'coin' ? 11.5 : 8.5;
        d.position.x += (dx / dist) * pullSpeed * dt;
        d.position.z += (dz / dist) * pullSpeed * dt;
        d.mesh.position.x = d.position.x;
        d.mesh.position.z = d.position.z;
      }

      if (dist < (d.type === 'weapon' ? 1.45 : 1.15)) {
        onCollect(d);
        this.scene.remove(d.mesh);
        this.drops.splice(i, 1);
      } else if (!d.persistent && d.age > 45) {
        this.scene.remove(d.mesh);
        this.drops.splice(i, 1);
      }
    }
  }

  public clearAll(): void {
    for (const d of this.drops) {
      this.scene.remove(d.mesh);
    }
    this.drops = [];
  }
}
