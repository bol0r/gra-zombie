import * as THREE from 'three';

export class InputManager {
  public keys: Set<string> = new Set();
  public justPressed: Set<string> = new Set();
  public mouseScreen: THREE.Vector2 = new THREE.Vector2(0, 0);
  public mouseWorld: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public leftMouseDown = false;
  public rightMouseDown = false;
  public leftMouseJustPressed = false;
  public rightMouseJustPressed = false;

  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.8);

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
      }
      this.keys.add(code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreen.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseScreen.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.leftMouseDown = true;
        this.leftMouseJustPressed = true;
      } else if (e.button === 2) {
        this.rightMouseDown = true;
        this.rightMouseJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.leftMouseDown = false;
      if (e.button === 2) this.rightMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.leftMouseDown = false;
      this.rightMouseDown = false;
    });
  }

  public updateMouseWorld(camera: THREE.Camera): void {
    this.raycaster.setFromCamera(this.mouseScreen, camera);
    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, target)) {
      this.mouseWorld.copy(target);
    }
  }

  public getMoveVector(): THREE.Vector2 {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    // Rotate 45 degrees so WASD aligns naturally with the isometric camera view
    const vec = new THREE.Vector2(x, y);
    if (vec.lengthSq() > 0) {
      vec.normalize();
      const angle = -Math.PI / 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return new THREE.Vector2(
        vec.x * cos - vec.y * sin,
        vec.x * sin + vec.y * cos
      );
    }
    return vec;
  }

  public consumeJustPressed(code: string): boolean {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code);
      return true;
    }
    return false;
  }

  public endFrame(): void {
    this.justPressed.clear();
    this.leftMouseJustPressed = false;
    this.rightMouseJustPressed = false;
  }
}
