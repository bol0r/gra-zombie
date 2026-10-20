import * as THREE from 'three';
import { MeleeWeaponId, RangedWeaponId } from '../combat/WeaponTypes';
import { LevelId } from '../systems/UpgradeSystem';

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

  public spawnStreetSupplies(streetIndex: number, level: LevelId = 1): void {
    this.clearAll();
    if (level === 2) {
      if (streetIndex === 1) {
        // Parking pod szpitalem: supplies along the labyrinth turns and dark bays
        this.createDrop('ammo', new THREE.Vector3(-8.5, 0, 14), 10, true);
        this.createDrop('coin', new THREE.Vector3(-8.5, 0, 4), 1, true);
        this.createDrop('health', new THREE.Vector3(-2.0, 0, -4), 30, true);
        this.createDrop('xp', new THREE.Vector3(9.5, 0, -4), 8, true);
        this.createDrop('coin', new THREE.Vector3(9.5, 0, 4), 1, true);
        this.createDrop('ammo', new THREE.Vector3(9.5, 0, 10), 10, true);
        this.createDrop('coin', new THREE.Vector3(11.5, 0, 13), 1, true);
      } else if (streetIndex === 2) {
        // Oddział: supplies along the corridor and side niches
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, 22), 10, true);
        this.createDrop('coin', new THREE.Vector3(-6.2, 0, 10), 1, true);
        this.createDrop('health', new THREE.Vector3(0.0, 0, 6), 30, true);
        this.createDrop('coin', new THREE.Vector3(6.2, 0, 10), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -4), 8, true);
        this.createDrop('ammo', new THREE.Vector3(0.0, 0, -18), 12, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -26), 1, true);
      } else {
        // Lądowisko na dachu: supplies around the helipad slab
        this.createDrop('health', new THREE.Vector3(-7.0, 0, 14), 35, true);
        this.createDrop('ammo', new THREE.Vector3(7.0, 0, 14), 14, true);
        this.createDrop('coin', new THREE.Vector3(-6.0, 0, 2), 1, true);
        this.createDrop('coin', new THREE.Vector3(6.0, 0, 2), 1, true);
        this.createDrop('xp', new THREE.Vector3(0.0, 0, -6), 8, true);
        this.createDrop('health', new THREE.Vector3(-7.5, 0, -14), 35, true);
        this.createDrop('ammo', new THREE.Vector3(7.5, 0, -14), 14, true);
        this.createDrop('coin', new THREE.Vector3(0.0, 0, -18), 1, true);
      }
      return;
    }

    if (streetIndex === 1) {
      // Street 1: Daytime supplies + 3 coins + 8-XP orbs
      this.createDrop('ammo', new THREE.Vector3(-3.2, 0, 24), 10, true);
      this.createDrop('coin', new THREE.Vector3(2.2, 0, 21), 1, true);
      this.createDrop('health', new THREE.Vector3(3.5, 0, 15), 30, true);
      this.createDrop('xp', new THREE.Vector3(-2.5, 0, 6), 8, true);
      this.createDrop('coin', new THREE.Vector3(0.4, 0, -2), 1, true);
      this.createDrop('ammo', new THREE.Vector3(3.8, 0, -6), 10, true);
      this.createDrop('health', new THREE.Vector3(-3.2, 0, -18), 30, true);
      this.createDrop('coin', new THREE.Vector3(-1.8, 0, -22), 1, true);
      this.createDrop('xp', new THREE.Vector3(2.5, 0, -24), 8, true);
    } else if (streetIndex === 2) {
      // Street 2: Narrow alley supplies + 3 coins + 8-XP orb
      this.createDrop('ammo', new THREE.Vector3(2.4, 0, 19), 10, true);
      this.createDrop('coin', new THREE.Vector3(-2.1, 0, 14), 1, true);
      this.createDrop('health', new THREE.Vector3(-2.4, 0, 1), 30, true);
      this.createDrop('coin', new THREE.Vector3(1.8, 0, -5), 1, true);
      this.createDrop('xp', new THREE.Vector3(-1.6, 0, -11), 8, true);
      this.createDrop('ammo', new THREE.Vector3(2.2, 0, -16), 12, true);
      this.createDrop('coin', new THREE.Vector3(0.0, 0, -23), 1, true);
    } else {
      // Street 3: Plaza supplies + 3 coins + 8-XP orb
      this.createDrop('health', new THREE.Vector3(-4.0, 0, 18), 35, true);
      this.createDrop('ammo', new THREE.Vector3(4.0, 0, 18), 14, true);
      this.createDrop('coin', new THREE.Vector3(-2.8, 0, 8), 1, true);
      this.createDrop('coin', new THREE.Vector3(2.8, 0, -3), 1, true);
      this.createDrop('xp', new THREE.Vector3(0.0, 0, -8), 8, true);
      this.createDrop('health', new THREE.Vector3(-5.0, 0, -14), 35, true);
      this.createDrop('ammo', new THREE.Vector3(5.0, 0, -14), 14, true);
      this.createDrop('coin', new THREE.Vector3(0.0, 0, -21), 1, true);
    }
  }

  public spawnDropFromZombie(
    pos: THREE.Vector3,
    isBoss: boolean,
    isTank: boolean
  ): void {
    // Kule XP dają zawsze po 8 XP
    this.createDrop(
      'xp',
      pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8)),
      8
    );

    // Monety wypadają z części zombie (kilkanaście monet na całą rundę)
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

    const supplyRoll = Math.random();
    if (supplyRoll < (isTank ? 0.55 : 0.2)) {
      this.createDrop('ammo', pos.clone().add(new THREE.Vector3(0.5, 0, -0.4)), 8);
    } else if (supplyRoll < (isTank ? 0.82 : 0.34)) {
      this.createDrop('health', pos.clone().add(new THREE.Vector3(-0.5, 0, 0.4)), 25);
    }
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
        ? 0x00e5ff
        : type === 'coin'
        ? 0xffd166
        : type === 'health'
        ? 0xff2a4b
        : 0xff9f1c;

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: type === 'coin' ? 2.4 : 2.0,
      roughness: type === 'coin' ? 0.15 : 0.2,
      metalness: type === 'coin' ? 0.85 : 0.3
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
      d.mesh.rotation.y += (d.type === 'coin' ? 3.8 : 2.6) * dt;
      d.mesh.position.y = Math.sin(d.age * 4) * 0.08;

      const dx = playerPos.x - d.position.x;
      const dz = playerPos.z - d.position.z;
      const dist = Math.hypot(dx, dz);

      const magnetRadius = d.type === 'xp' || d.type === 'coin' ? 5.2 : 3.4;
      if (dist < magnetRadius && dist > 0.01) {
        const pullSpeed = d.type === 'xp' || d.type === 'coin' ? 11.5 : 8.5;
        d.position.x += (dx / dist) * pullSpeed * dt;
        d.position.z += (dz / dist) * pullSpeed * dt;
        d.mesh.position.x = d.position.x;
        d.mesh.position.z = d.position.z;
      }

      if (dist < 1.15) {
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
