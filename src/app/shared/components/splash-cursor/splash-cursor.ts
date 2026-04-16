import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-splash-cursor',
  standalone: true,
  templateUrl: './splash-cursor.html',
  styleUrl: './splash-cursor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashCursor implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationId?: number;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cleanupFns: (() => void)[] = [];

  private mouse        = { x: 0, y: 0 };
  private virtualMouse = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    if (window.innerWidth < 1024) return;
    this.init();
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.cleanupFns.forEach(fn => fn());
    this.renderer?.dispose();
  }

  private init(): void {
    const canvas = this.canvasRef.nativeElement;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ───────────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Scene / Camera ─────────────────────────────────────────────────────────
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000);
    this.camera.position.set(0, 0, 50);

    // ── Config ─────────────────────────────────────────────────────────────────
    const COUNT          = 500;
    const MAGNET_RADIUS  = 18;
    const RING_RADIUS    = 18;
    const WAVE_SPEED     = 0.4;
    const WAVE_AMP       = 0.8;
    const PARTICLE_SIZE  = 0.6;
    const LERP_SPEED     = 0.15;
    const MOUSE_SMOOTH   = 0.04;
    const PULSE_SPEED    = 2.5;
    const FIELD_STRENGTH = 10;
    const DEPTH_FACTOR   = 2;
    const FADE_DIST      = 5;

    // Viewport world size at camera z=50
    const vFov = THREE.MathUtils.degToRad(35);
    const vH   = 2 * Math.tan(vFov / 2) * 50;
    const vW   = vH * (W / H);

    // ── Shader material — per-particle cycling gradient + radial glow ─────────
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // glow blends additively like light
      vertexShader: `
        attribute float aPhase;
        attribute float aOpacity;
        uniform float uTime;

        varying vec3  vColor;
        varying float vOpacity;
        varying vec2  vUv;

        vec3 getColor(float phase) {
          // 5-stop portfolio palette cycling smoothly
          // blue → cyan → green → purple → amber → blue
          vec3 p0 = vec3(0.145, 0.388, 0.922); // #2563EB blue
          vec3 p1 = vec3(0.024, 0.714, 0.831); // #06B6D4 cyan
          vec3 p2 = vec3(0.063, 0.725, 0.506); // #10B981 green
          vec3 p3 = vec3(0.545, 0.361, 0.965); // #8B5CF6 purple
          vec3 p4 = vec3(0.961, 0.620, 0.043); // #F59E0B amber

          float p = mod(phase, 1.0) * 5.0;
          float t = fract(p);
          int   s = int(floor(p));

          if (s == 0) return mix(p0, p1, t);
          if (s == 1) return mix(p1, p2, t);
          if (s == 2) return mix(p2, p3, t);
          if (s == 3) return mix(p3, p4, t);
                      return mix(p4, p0, t);
        }

        void main() {
          // Each particle has its own phase offset, animated over time
          float animPhase = mod(aPhase + uTime * 0.06, 1.0);
          vColor   = getColor(animPhase);
          vOpacity = aOpacity;
          vUv      = uv;

          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vOpacity;
        varying vec2  vUv;

        void main() {
          // Radial glow: bright at center (uv 0.5,0.5), fades at edges
          vec2  center = vUv - 0.5;
          float dist   = length(center) * 2.0;           // 0 center → 1 edge
          float glow   = pow(max(0.0, 1.0 - dist), 1.8); // soft falloff

          // Boost brightness at center for the bloom look
          vec3  brightColor = vColor * (1.0 + glow * 1.5);

          gl_FragColor = vec4(brightColor, vOpacity * glow);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
      },
    });

    // ── Geometry + instanced mesh ──────────────────────────────────────────────
    // SphereGeometry: UVs centered at (0.5,0.5) — needed for radial glow in fragment shader
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);

    // Per-instance attributes
    const phases    = new Float32Array(COUNT);
    const opacities = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      phases[i]    = i / COUNT;    // evenly spread around the gradient
      opacities[i] = 1.0;
    }
    geometry.setAttribute('aPhase',   new THREE.InstancedBufferAttribute(phases,    1));
    geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacities, 1));

    const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
    this.scene.add(mesh);

    // ── Particle pool ──────────────────────────────────────────────────────────
    interface Particle {
      t: number; speed: number;
      cx: number; cy: number; cz: number;
      mz: number;
      randomRadiusOffset: number;
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const x = (Math.random() - 0.5) * vW;
      const y = (Math.random() - 0.5) * vH;
      const z = (Math.random() - 0.5) * 10;
      return {
        t:     Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        cx: x, cy: y, cz: z,
        mz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
      };
    });

    const dummy      = new THREE.Object3D();
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    const opAttr     = geometry.getAttribute('aOpacity') as THREE.InstancedBufferAttribute;
    let elapsed      = 0;
    let last         = performance.now();

    // ── Animation loop — runs fully outside Angular zone ──────────────────────
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt  = Math.min((now - last) / 1000, 0.05);
      last      = now;
      elapsed  += dt;

      // Update shader time for color cycling
      material.uniforms['uTime'].value = elapsed;

      // Smooth virtual mouse — original 0.05 factor is what makes it fluid
      const targetX =  this.mouse.x * vW / 2;
      const targetY =  this.mouse.y * vH / 2;
      this.virtualMouse.x += (targetX - this.virtualMouse.x) * MOUSE_SMOOTH;
      this.virtualMouse.y += (targetY - this.virtualMouse.y) * MOUSE_SMOOTH;

      const vmx = this.virtualMouse.x;
      const vmy = this.virtualMouse.y;

      particles.forEach((p, i) => {
        p.t += p.speed / 2;

        const projFactor = 1 - p.cz / 50;
        const ptx = vmx * projFactor;
        const pty = vmy * projFactor;

        const dx   = p.cx - ptx;
        const dy   = p.cy - pty;

        // Every particle always orbits the cursor — no distance gate
        const angle = Math.atan2(dy, dx);
        const wave  = Math.sin(p.t * WAVE_SPEED + angle) * 0.5 * WAVE_AMP;
        const dev   = p.randomRadiusOffset * (5 / (FIELD_STRENGTH + 0.1));
        const r     = RING_RADIUS + wave + dev;

        const tx = ptx + r * Math.cos(angle);
        const ty = pty + r * Math.sin(angle);
        const tz = p.mz * DEPTH_FACTOR + Math.sin(p.t) * WAVE_AMP * DEPTH_FACTOR;

        p.cx += (tx - p.cx) * LERP_SPEED;
        p.cy += (ty - p.cy) * LERP_SPEED;
        p.cz += (tz - p.cz) * LERP_SPEED;

        dummy.position.set(p.cx, p.cy, p.cz);
        dummy.lookAt(ptx, pty, p.cz);
        dummy.rotateX(Math.PI / 2);

        const distFromRing = Math.abs(
          Math.sqrt((p.cx - ptx) ** 2 + (p.cy - pty) ** 2) - RING_RADIUS
        );

        // Smooth proximity fade — fast falloff beyond ring
        const proximity   = Math.max(0, 1 - distFromRing / FADE_DIST);
        const scaleFactor = proximity * (0.8 + Math.sin(p.t * PULSE_SPEED) * 0.2) * PARTICLE_SIZE;

        if (scaleFactor < 0.001) {
          mesh.setMatrixAt(i, zeroMatrix);
          opAttr.setX(i, 0);
          return;
        }

        dummy.scale.setScalar(scaleFactor);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // Smooth opacity transition
        const curOp = opAttr.getX(i);
        opAttr.setX(i, curOp + (proximity - curOp) * 0.12);
      });

      mesh.instanceMatrix.needsUpdate = true;
      opAttr.needsUpdate = true;

      this.renderer.render(this.scene, this.camera);
    };

    animate();

    // ── Events ─────────────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      this.mouse.x =  (e.clientX / W) * 2 - 1;
      this.mouse.y = -((e.clientY / H) * 2 - 1);
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);
    this.cleanupFns = [
      () => window.removeEventListener('mousemove', onMouseMove),
      () => window.removeEventListener('resize', onResize),
    ];
  }
}
