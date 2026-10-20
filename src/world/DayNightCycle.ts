import * as THREE from 'three';

export class DayNightCycle {
  private scene: THREE.Scene;
  public ambientLight: THREE.HemisphereLight;
  public dirLight: THREE.DirectionalLight;
  public fog: THREE.FogExp2;

  public currentStreet = 1;
  public isNight = false;
  public nightFactor = 0; // 0 = Day (Street 1), 0.4..0.85 = Dusk (Street 2), 1.0 = Night (Street 3)
  public warningActive = false;

  private daySkyColor = new THREE.Color(0x232d42);
  private duskSkyColor = new THREE.Color(0x281320);
  private nightSkyColor = new THREE.Color(0x04060c);

  private daySunColor = new THREE.Color(0xffe4bd);
  private duskSunColor = new THREE.Color(0xff5e36);
  private nightMoonColor = new THREE.Color(0x3a66b8);

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.fog = new THREE.FogExp2(0x161b28, 0.012);
    this.scene.fog = this.fog;
    this.scene.background = this.daySkyColor.clone();

    this.ambientLight = new THREE.HemisphereLight(0x8fa8cc, 0x1d1c24, 0.9);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffe1b8, 1.85);
    this.dirLight.position.set(22, 34, 16);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 110;
    const d = 42;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  public setStreetEnvironment(streetIndex: number, streetProgress = 0, level = 1): void {
    this.currentStreet = streetIndex;

    if (level === 2) {
      if (streetIndex === 1) {
        // Dixon Stage 1: Dark underground parking garage where flashlight is essential
        this.isNight = true;
        this.nightFactor = 0.86;
        this.warningActive = false;
      } else if (streetIndex === 2) {
        // Dixon Stage 2: Dim hospital ward corridor
        this.isNight = streetProgress > 0.5;
        this.nightFactor = THREE.MathUtils.lerp(0.68, 0.92, streetProgress);
        this.warningActive = true;
      } else {
        // Dixon Stage 3: Night rooftop helipad
        this.isNight = true;
        this.nightFactor = 1.0;
        this.warningActive = true;
      }
      this.applyLighting();
      return;
    }

    if (streetIndex === 1) {
      // Street 1: Daytime cordon
      this.isNight = false;
      this.nightFactor = streetProgress * 0.2;
      this.warningActive = false;
    } else if (streetIndex === 2) {
      // Street 2: Dusk alley — lights flicker and go out towards the end
      this.isNight = streetProgress > 0.78;
      this.nightFactor = THREE.MathUtils.lerp(0.42, 0.88, streetProgress);
      this.warningActive = streetProgress > 0.55;
    } else {
      // Street 3: Full Night — Dead Net Labs & Volatile
      this.isNight = true;
      this.nightFactor = 1.0;
      this.warningActive = true;
    }

    this.applyLighting();
  }

  private applyLighting(): void {
    const bg = new THREE.Color();
    if (this.nightFactor < 0.45) {
      bg.lerpColors(this.daySkyColor, this.duskSkyColor, this.nightFactor / 0.45);
    } else {
      bg.lerpColors(this.duskSkyColor, this.nightSkyColor, (this.nightFactor - 0.45) / 0.55);
    }
    this.scene.background = bg;
    this.fog.color.copy(bg);
    // Street 3 has dense fog as specified
    this.fog.density =
      this.currentStreet === 3
        ? 0.028
        : THREE.MathUtils.lerp(0.011, 0.021, this.nightFactor);

    const sunCol = new THREE.Color();
    if (this.nightFactor < 0.45) {
      sunCol.lerpColors(this.daySunColor, this.duskSunColor, this.nightFactor / 0.45);
    } else {
      sunCol.lerpColors(this.duskSunColor, this.nightMoonColor, (this.nightFactor - 0.45) / 0.55);
    }
    this.dirLight.color.copy(sunCol);
    this.dirLight.intensity = THREE.MathUtils.lerp(1.9, 0.35, this.nightFactor);
    this.ambientLight.intensity = THREE.MathUtils.lerp(0.95, 0.2, this.nightFactor);
  }
}
