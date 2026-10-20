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
    uVignetteIntensity: { value: 0.42 }
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
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float dist = length(centered);

      // Subtle chromatic aberration on damage or night
      float ca = (0.0012 + uDamagePulse * 0.005 + uNightFactor * 0.001) * dist;
      float r = texture2D(tDiffuse, uv + centered * ca).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - centered * ca).b;
      vec3 color = vec3(r, g, b);

      // Contrast & saturation boost for gritty ARPG look
      color = pow(color, vec3(0.95));
      color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 1.15);

      // Night color grading (deep cold shadows + crimson highlights)
      vec3 nightTint = mix(vec3(0.88, 0.94, 1.12), vec3(1.12, 0.85, 0.92), smoothstep(0.2, 0.8, r));
      color *= mix(vec3(1.02, 0.99, 0.95), nightTint, uNightFactor * 0.55);

      // Vignette
      float vig = smoothstep(0.82, 0.25, dist * (1.0 + uVignetteIntensity + uNightFactor * 0.22));
      color *= mix(0.22, 1.0, vig);

      // Red blood edge pulse when damaged
      float edge = smoothstep(0.25, 0.72, dist);
      color = mix(color, vec3(0.9, 0.05, 0.1), edge * uDamagePulse * 0.65);

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
      0.75, // strength
      0.45, // radius
      0.68  // threshold
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

  public update(nightFactor: number, damagePulse: number): void {
    this.gradingPass.uniforms.uNightFactor.value = nightFactor;
    this.gradingPass.uniforms.uDamagePulse.value = damagePulse;
    // Slightly stronger bloom at night for glowing red eyes, fire & lightning
    this.bloomPass.strength = THREE.MathUtils.lerp(0.68, 1.05, nightFactor);
  }

  public render(): void {
    this.composer.render();
  }
}
