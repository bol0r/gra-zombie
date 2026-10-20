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

  // Xbox / Standard Gamepad state (polled every frame for Chrome on macOS)
  public readonly deadzone = 0.18;
  public gamepadConnected = false;
  public gamepadAimActive = false;
  public gamepadAimAngle = 0;
  private gamepadMove = new THREE.Vector2(0, 0);
  private gamepadRtDown = false;
  private prevGamepadButtons: boolean[] = [];

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
      // Moving the mouse switches aiming back to mouse until the right stick is moved again
      this.gamepadAimActive = false;
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
      this.gamepadRtDown = false;
    });
  }

  /**
   * Polls navigator.getGamepads() every frame (Chrome on macOS does not emit gamepad movement events).
   * Standard mapping, deadzone 0.18.
   */
  public pollGamepad(): void {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      this.gamepadConnected = false;
      this.gamepadRtDown = false;
      this.gamepadMove.set(0, 0);
      return;
    }

    const pads = navigator.getGamepads();
    let activePad: Gamepad | null = null;
    for (const pad of pads) {
      if (pad && pad.connected) {
        activePad = pad;
        if (pad.mapping === 'standard') break;
      }
    }

    if (!activePad) {
      this.gamepadConnected = false;
      this.gamepadAimActive = false;
      this.gamepadRtDown = false;
      this.gamepadMove.set(0, 0);
      this.prevGamepadButtons = [];
      return;
    }

    this.gamepadConnected = true;

    // Left stick: movement (axes 0, 1) with 0.18 deadzone
    const lx = activePad.axes[0] ?? 0;
    const ly = activePad.axes[1] ?? 0;
    const leftMag = Math.hypot(lx, ly);
    if (leftMag >= this.deadzone) {
      const norm = Math.min(1, (leftMag - this.deadzone) / (1 - this.deadzone));
      this.gamepadMove.set((lx / leftMag) * norm, (ly / leftMag) * norm);
    } else {
      this.gamepadMove.set(0, 0);
    }

    // Right stick: aiming flashlight & slash (axes 2, 3) with 0.18 deadzone + same isometric correction as WASD
    const rx = activePad.axes[2] ?? 0;
    const ry = activePad.axes[3] ?? 0;
    const rightMag = Math.hypot(rx, ry);
    if (rightMag >= this.deadzone) {
      const isoAngle = -Math.PI / 4;
      const cos = Math.cos(isoAngle);
      const sin = Math.sin(isoAngle);
      const isoX = rx * cos - ry * sin;
      const isoZ = rx * sin + ry * cos;
      this.gamepadAimAngle = Math.atan2(isoX, isoZ);
      this.gamepadAimActive = true;
    }

    const isBtnPressed = (index: number, threshold = 0.5): boolean => {
      const b = activePad!.buttons[index];
      if (!b) return false;
      return b.pressed || b.value >= threshold;
    };

    const wasBtnPressed = (index: number): boolean => Boolean(this.prevGamepadButtons[index]);

    // RT (button 7): melee attack (held, like LPM)
    this.gamepadRtDown = isBtnPressed(7, 0.35);

    // LT (button 6): ranged shot (single press, like PPM)
    const ltNow = isBtnPressed(6, 0.35);
    if (ltNow && !wasBtnPressed(6)) {
      this.rightMouseJustPressed = true;
    }

    // A (button 0): Dash in gameplay + confirm in menu/level select
    const aNow = isBtnPressed(0);
    if (aNow && !wasBtnPressed(0)) {
      this.justPressed.add('Space');
      this.justPressed.add('PadA');
    }

    // X (button 2): Rzeź special (only when bar is 100%)
    const xNow = isBtnPressed(2);
    if (xNow && !wasBtnPressed(2)) {
      this.justPressed.add('KeyE');
    }

    // Start (button 9): Pause
    const startNow = isBtnPressed(9);
    if (startNow && !wasBtnPressed(9)) {
      this.justPressed.add('PadStart');
    }

    // D-pad Up (button 12) / Down (button 13): menu & level select navigation
    const dpadUpNow = isBtnPressed(12);
    if (dpadUpNow && !wasBtnPressed(12)) {
      this.justPressed.add('PadUp');
    }

    const dpadDownNow = isBtnPressed(13);
    if (dpadDownNow && !wasBtnPressed(13)) {
      this.justPressed.add('PadDown');
    }

    const nextStates: boolean[] = [];
    for (let i = 0; i < activePad.buttons.length; i++) {
      nextStates[i] = isBtnPressed(i, i === 6 || i === 7 ? 0.35 : 0.5);
    }
    this.prevGamepadButtons = nextStates;
  }

  public isMeleeDown(): boolean {
    return this.leftMouseDown || this.gamepadRtDown;
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

    // Combine keyboard WASD with Left Stick (both use the same isometric -45 deg rotation)
    if (x === 0 && y === 0 && this.gamepadMove.lengthSq() > 0) {
      x = this.gamepadMove.x;
      y = this.gamepadMove.y;
    }

    const vec = new THREE.Vector2(x, y);
    if (vec.lengthSq() > 0) {
      const mag = Math.min(1, vec.length());
      vec.normalize().multiplyScalar(mag);
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
