import * as THREE from 'three';

export class IsometricCamera {
  public camera: THREE.PerspectiveCamera;
  private offset = new THREE.Vector3(17, 21, 17);
  private currentLookAt = new THREE.Vector3(0, 0, 0);
  private shakeIntensity = 0;
  private shakeDecay = 12;
  private zoomOffset = 0;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.5,
      180
    );
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  public addShake(amount: number): void {
    this.shakeIntensity = Math.min(1.6, Math.max(this.shakeIntensity, amount));
  }

  public punchZoom(amount: number): void {
    this.zoomOffset = Math.max(this.zoomOffset, amount);
  }

  public update(dt: number, playerPos: THREE.Vector3, mouseWorld: THREE.Vector3): void {
    // Subtle lead toward mouse cursor for dynamic ARPG/shooter feel
    const mouseLead = new THREE.Vector3()
      .subVectors(mouseWorld, playerPos)
      .clampLength(0, 8)
      .multiplyScalar(0.18);

    const targetFocus = new THREE.Vector3()
      .copy(playerPos)
      .add(mouseLead);
    targetFocus.y = 0.6;

    this.currentLookAt.lerp(targetFocus, 1 - Math.exp(-9 * dt));

    // Decay zoom punch
    this.zoomOffset = THREE.MathUtils.lerp(this.zoomOffset, 0, 1 - Math.exp(-10 * dt));

    const dynamicOffset = this.offset
      .clone()
      .multiplyScalar(1 - this.zoomOffset * 0.08);

    const desiredPos = new THREE.Vector3().addVectors(this.currentLookAt, dynamicOffset);

    // Apply screen shake
    if (this.shakeIntensity > 0.001) {
      const rx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const ry = (Math.random() - 0.5) * 1.4 * this.shakeIntensity;
      const rz = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      desiredPos.add(new THREE.Vector3(rx, ry, rz));
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.position.copy(desiredPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public worldToScreen(worldPos: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = worldPos.clone().project(this.camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(v.y * 0.5) + 0.5) * window.innerHeight;
    return { x, y, visible: v.z < 1 };
  }
}
