import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('aboutSection') aboutSection!: ElementRef;
  aboutInView = false;

  // 3D Avatar
  @ViewChild('avatarCanvas', { static: false }) avatarCanvas!: ElementRef<HTMLCanvasElement>;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private avatar?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private animationId?: number;
  private clock = new THREE.Clock();
  private isDragging = false;
  private previousMouseX = 0;
  private targetRotationY = 0;
  private currentRotationY = 0;

  // Values Cards
  activeValue: string | null = null;

  // Scroll Detection
  visibleSections = new Set<string>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeScrollObserver();
  }

  ngAfterViewInit() {
    // FadeIn Animation Observer
    const fadeInObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.aboutSection.nativeElement) {
            if (entry.isIntersecting) {
              this.aboutInView = true;
              this.cdr.detectChanges();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    if (this.aboutSection?.nativeElement) {
      fadeInObserver.observe(this.aboutSection.nativeElement);
    }

    // Initialize 3D avatar
    setTimeout(() => {
      this.init3DAvatar();
    }, 500);
  }

  ngOnDestroy() {
    // Cleanup avatar
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // VALUES CARDS
  // ========================

  showValueDetails(value: string) {
    this.activeValue = value;
    this.cdr.detectChanges();
  }

  hideValueDetails(value: string) {
    if (this.activeValue === value) {
      this.activeValue = null;
      this.cdr.detectChanges();
    }
  }

  // ========================
  // SCROLL ANIMATIONS
  // ========================

  private initializeScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.visibleSections.add('main');
            this.visibleSections.add('values');
            this.visibleSections.add('cta');
            this.cdr.detectChanges();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    setTimeout(() => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        observer.observe(aboutSection);
      }
    }, 100);
  }

  // ========================
  // 3D AVATAR METHODS
  // ========================

  private init3DAvatar(): void {
    if (!this.avatarCanvas?.nativeElement) {
      return;
    }

    const canvas = this.avatarCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaaaaff, 1.0);
    fillLight.position.set(-3, 2, -3);
    this.scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 3, -5);
    this.scene.add(backLight);

    // Load FBX
    const loader = new FBXLoader();

    loader.load(
      'assets/media/avatar/Waving_Gesture_.fbx',
      (fbx) => {
        this.avatar = fbx;

        const box = new THREE.Box3().setFromObject(fbx);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        fbx.scale.setScalar(scale);

        box.setFromObject(fbx);
        fbx.position.y = -box.min.y;

        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => {
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                });
              } else {
                (mesh.material as THREE.Material).side = THREE.DoubleSide;
                (mesh.material as THREE.Material).needsUpdate = true;
              }
            }
          }
        });

        this.scene!.add(fbx);

        if (fbx.animations && fbx.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(fbx);
          const action = this.mixer.clipAction(fbx.animations[0]);
          action.play();
        }

        this.animate();
        this.cdr.detectChanges();
      },
      undefined,
      (error) => {
        console.error('Error loading FBX:', error);
      }
    );

    // Mouse interaction
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    // Touch interaction
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.avatar) {
      // Smooth rotation controlled by user
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
      this.avatar.rotation.y = this.currentRotationY;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMouseX = event.clientX;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMouseX;
    this.targetRotationY += deltaX * 0.01;
    this.previousMouseX = event.clientX;
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMouseX = event.touches[0].clientX;
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - this.previousMouseX;
    this.targetRotationY += deltaX * 0.01;
    this.previousMouseX = event.touches[0].clientX;
    event.preventDefault();
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private onWindowResize(): void {
    if (!this.avatarCanvas?.nativeElement || !this.camera || !this.renderer) return;

    const canvas = this.avatarCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
