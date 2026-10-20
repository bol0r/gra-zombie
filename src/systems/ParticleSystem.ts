import * as THREE from 'three';

interface ActiveParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  gravity: number;
  life: number;
  maxLife: number;
  leaveBloodDecal: boolean;
  scaleDecay: boolean;
}

interface ActiveRing {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  maxRadius: number;
}

interface ActiveLine {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: ActiveParticle[] = [];
  private rings: ActiveRing[] = [];
  private lines: ActiveLine[] = [];
  private bloodDecals: THREE.Mesh[] = [];
  private maxDecals = 110;

  private cubeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  private decalGeo = new THREE.CircleGeometry(0.45, 7);
  private ringGeo = new THREE.RingGeometry(0.75, 1.0, 28);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.decalGeo.rotateX(-Math.PI / 2);
    this.ringGeo.rotateX(-Math.PI / 2);
  }

  public spawnBloodBurst(pos: THREE.Vector3, dir: THREE.Vector3, count = 14): void {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.3 ? 0xaa0616 : 0x6b030c,
        roughness: 0.35
      });
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      const scale = 0.65 + Math.random() * 1.15;
      mesh.scale.setScalar(scale);
      mesh.position.copy(pos).add(new THREE.Vector3(0, 0.8 + Math.random() * 0.4, 0));

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        2.2 + Math.random() * 4.2,
        (Math.random() - 0.5) * 4.5
      );
      const vel = dir.clone().multiplyScalar(3.5 + Math.random() * 4).add(spread);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        gravity: 16,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        leaveBloodDecal: i % 3 === 0,
        scaleDecay: true
      });
    }
  }

  public spawnSparks(pos: THREE.Vector3, color = 0xffb703, count = 10): void {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      mesh.scale.set(0.45, 0.45, 1.2);
      mesh.position.copy(pos).add(new THREE.Vector3(0, 0.9, 0));

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 11,
        2 + Math.random() * 6,
        (Math.random() - 0.5) * 11
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        gravity: 12,
        life: 0.22 + Math.random() * 0.2,
        maxLife: 0.42,
        leaveBloodDecal: false,
        scaleDecay: true
      });
    }
  }

  public spawnDashAfterimage(pos: THREE.Vector3, rotY: number): void {
    const geo = new THREE.BoxGeometry(0.65, 1.45, 0.45);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xd6c7b2,
      transparent: true,
      opacity: 0.36
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
    mesh.rotation.y = rotY;
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0, 0.3, 0),
      gravity: 0,
      life: 0.2,
      maxLife: 0.2,
      leaveBloodDecal: false,
      scaleDecay: true
    });
  }

  public spawnMuzzleFlash(pos: THREE.Vector3, dir: THREE.Vector3, color = 0xffb703): void {
    const muzzlePos = pos.clone().addScaledVector(dir, 0.85);
    muzzlePos.y = 1.05;
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? color : 0xfff3b0 });
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      mesh.scale.set(0.38, 0.38, 0.9);
      mesh.position.copy(muzzlePos);

      const vel = dir
        .clone()
        .multiplyScalar(8 + Math.random() * 7)
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 4.5,
            (Math.random() - 0.5) * 2.5,
            (Math.random() - 0.5) * 4.5
          )
        );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        gravity: 4,
        life: 0.08 + Math.random() * 0.05,
        maxLife: 0.13,
        leaveBloodDecal: false,
        scaleDecay: true
      });
    }
  }

  public spawnBulletTracer(from: THREE.Vector3, to: THREE.Vector3, color = 0xfbbf24): void {
    const dist = from.distanceTo(to);
    const dir = new THREE.Vector3().subVectors(to, from);
    if (dir.lengthSq() > 0.0001) dir.normalize();

    // Krótka smuga śrutu/pocisku (nie zygzak pioruna)
    const startOffset = Math.min(dist * 0.25, 1.1);
    const tracerLen = Math.min(dist - startOffset, 2.6);
    const p1 = from.clone().addScaledVector(dir, startOffset);
    const p2 = p1.clone().addScaledVector(dir, Math.max(0.45, tracerLen));
    p1.y = 1.02;
    p2.y = 1.02;

    const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.88
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.lines.push({
      line,
      mat,
      life: 0.075,
      maxLife: 0.075
    });

    // Ślad / iskry w punkcie trafienia
    const impactPos = to.clone();
    impactPos.y = 0.15;
    this.spawnSparks(impactPos, color, 3);
  }

  public spawnShockwaveRing(pos: THREE.Vector3, maxRadius: number, color = 0xff5400, duration = 0.38): void {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(pos.x, 0.08, pos.z);
    mesh.scale.setScalar(0.2);
    this.scene.add(mesh);

    this.rings.push({
      mesh,
      mat,
      life: duration,
      maxLife: duration,
      maxRadius
    });
  }

  public spawnLightningArc(from: THREE.Vector3, to: THREE.Vector3, color = 0x00f5ff): void {
    const points: THREE.Vector3[] = [];
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(from, to, t);
      p.y += 1.0;
      if (i > 0 && i < segments) {
        p.x += (Math.random() - 0.5) * 0.7;
        p.y += (Math.random() - 0.5) * 0.5;
        p.z += (Math.random() - 0.5) * 0.7;
      }
      points.push(p);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.lines.push({
      line,
      mat,
      life: 0.16,
      maxLife: 0.16
    });
  }

  public spawnExplosion(pos: THREE.Vector3, color = 0xff4d00, radius = 4.5): void {
    this.spawnShockwaveRing(pos, radius, color, 0.42);
    this.spawnSparks(pos, 0xffaa00, 24);
    this.spawnSparks(pos, 0xff2200, 18);
  }

  public spawnDustPuff(pos: THREE.Vector3, count = 8): void {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xa89f91,
        transparent: true,
        opacity: 0.7
      });
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      const scale = 0.65 + Math.random() * 0.7;
      mesh.scale.setScalar(scale);
      mesh.position.copy(pos).add(new THREE.Vector3(0, 0.25 + Math.random() * 0.2, 0));

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4.2,
        1.2 + Math.random() * 2.2,
        (Math.random() - 0.5) * 4.2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        gravity: 8,
        life: 0.28 + Math.random() * 0.16,
        maxLife: 0.44,
        leaveBloodDecal: false,
        scaleDecay: true
      });
    }
  }

  private addBloodDecal(x: number, z: number): void {
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x5c040c : 0x3d0207,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });
    const decal = new THREE.Mesh(this.decalGeo, mat);
    const scale = 0.65 + Math.random() * 1.3;
    decal.scale.setScalar(scale);
    decal.position.set(x, 0.02 + Math.random() * 0.015, z);
    decal.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(decal);
    this.bloodDecals.push(decal);

    if (this.bloodDecals.length > this.maxDecals) {
      const oldest = this.bloodDecals.shift();
      if (oldest) {
        this.scene.remove(oldest);
        (oldest.material as THREE.Material).dispose();
      }
    }
  }

  public clearAll(): void {
    for (const d of this.bloodDecals) {
      this.scene.remove(d);
      (d.material as THREE.Material).dispose();
    }
    this.bloodDecals = [];
  }

  public update(dt: number): void {
    // Update 3D particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.velocity.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += 6 * dt;
      p.mesh.rotation.z += 5 * dt;

      if (p.mesh.position.y <= 0.06 && p.gravity > 0) {
        p.mesh.position.y = 0.06;
        p.velocity.x *= 0.5;
        p.velocity.z *= 0.5;
        p.velocity.y = 0;
        if (p.leaveBloodDecal) {
          p.leaveBloodDecal = false;
          this.addBloodDecal(p.mesh.position.x, p.mesh.position.z);
        }
      }

      if (p.scaleDecay) {
        const ratio = Math.max(0.05, p.life / p.maxLife);
        p.mesh.scale.multiplyScalar(0.97 + ratio * 0.02);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update shockwave rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const progress = 1 - Math.max(0, r.life / r.maxLife);
      const currentRadius = THREE.MathUtils.lerp(0.3, r.maxRadius, progress);
      r.mesh.scale.setScalar(currentRadius);
      r.mat.opacity = (1 - progress) * 0.9;

      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        r.mat.dispose();
        this.rings.splice(i, 1);
      }
    }

    // Update lightning / gunshot lines
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i];
      l.life -= dt;
      l.mat.opacity = Math.max(0, l.life / l.maxLife);
      if (l.life <= 0) {
        this.scene.remove(l.line);
        l.line.geometry.dispose();
        l.mat.dispose();
        this.lines.splice(i, 1);
      }
    }
  }
}
