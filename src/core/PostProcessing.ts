import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const CinematicGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    uNightFactor: { value: 0.0 },
    uDamagePulse: { value: 0.0 },
    uVignetteIntensity: { value: 0.42 },
    uTime: { value: 0.0 },
    uVhs: { value: 1.0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uNightFactor;
    uniform float uDamagePulse;
    uniform float uVignetteIntensity;
    uniform float uTime;
    uniform float uVhs;
    varying vec2 vUv;

    float hashNoise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Lekkie pływanie klatki VHS, tylko gdy filtr jest włączony
      float wobble = (sin(uv.y * 14.0 + uTime * 2.1) * 0.00042 + sin(uTime * 1.45) * 0.00025) * uVhs;
      uv.x = clamp(uv.x + wobble, 0.001, 0.999);

      vec2 centered = uv - 0.5;
      float dist = length(centered);

      // Subtelna aberracja chromatyczna VHS + puls obrażeń
      float ca = (uDamagePulse * 0.0045 + uVhs * (0.0011 + uNightFactor * 0.0008)) * (0.35 + dist);
      float r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
      vec3 color = vec3(r, g, b);

      // Contrast & slightly desaturated gritty 80s horror film look
      color = pow(color, vec3(0.96));
      color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 1.04);

      // Night color grading (warm rust/blood highlights + cold shadows)
      vec3 nightTint = mix(vec3(0.90, 0.92, 1.04), vec3(1.10, 0.86, 0.84), smoothstep(0.2, 0.8, r));
      color *= mix(vec3(1.01, 0.98, 0.93), nightTint, uNightFactor * 0.5);

      // Linie i szum taśmy tylko przy włączonym filtrze
      float scanline = sin(vUv.y * 680.0) * 0.022 * uVhs;
      color -= scanline;

      float grain = (hashNoise(uv * vec2(320.0, 240.0) + fract(uTime * 7.3)) - 0.5) * 0.034 * uVhs;
      color += grain;

      // Vignette
      float vig = smoothstep(0.84, 0.25, dist * (1.0 + uVignetteIntensity + uNightFactor * 0.2));
      color *= mix(0.24, 1.0, vig);

      // Red blood edge pulse when damaged
      float edge = smoothstep(0.25, 0.72, dist);
      color = mix(color, vec3(0.82, 0.06, 0.08), edge * uDamagePulse * 0.65);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class PostProcessing {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public gradingPass: ShaderPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.62, // strength
      0.42, // radius
      0.72  // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.gradingPass = new ShaderPass(CinematicGradingShader);
    this.composer.addPass(this.gradingPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    window.addEventListener('resize', () => {
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.bloomPass.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public setVhsEnabled(enabled: boolean): void {
    this.gradingPass.uniforms.uVhs.value = enabled ? 1.0 : 0.0;
  }

  public update(nightFactor: number, damagePulse: number, elapsedTime = 0): void {
    this.gradingPass.uniforms.uNightFactor.value = nightFactor;
    this.gradingPass.uniforms.uDamagePulse.value = damagePulse;
    this.gradingPass.uniforms.uTime.value = elapsedTime;
    this.bloomPass.strength = THREE.MathUtils.lerp(0.55, 0.88, nightFactor);
  }

  public render(): void {
    this.composer.render();
  }
}
