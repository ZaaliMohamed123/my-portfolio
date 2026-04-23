import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { interval, Subject, takeUntil, Subscription } from 'rxjs';

interface ProfilePhoto {
  id: number;
  src: string;
  alt: string;
}

interface TechStack {
  name: string;
  key: string;
  icon: string;
  color: string;
  isCustomIcon?: boolean;
  scale?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private photoIntervalSubscription: Subscription | null = null;
  private isInitialized = false;

  // Photo carousel
  currentPhotoIndex = 0;
  private photoInterval = 30000;

  // ========================
  // LOGO LOOP (tech stack)
  // ========================
  @ViewChild('logoTrack') logoTrackRef!: ElementRef<HTMLElement>;
  @ViewChild('logoSeq')   logoSeqRef!: ElementRef<HTMLElement>;
  @ViewChild('logoContainer') logoContainerRef!: ElementRef<HTMLElement>;

  private readonly SMOOTH_TAU = 0.25;
  private readonly SPEED = 80; // px/s
  copyCount = 2;
  private seqWidth = 0;
  private offset = 0;
  private velocity = 0;
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  isHovered = false;

  profilePhotos: ProfilePhoto[] = [
    {
      id: 1,
      src: 'assets/media/photos/mohamed-1.jpeg',
      alt: 'Mohamed ZAALI - Professional headshot',
    },
    {
      id: 2,
      src: 'assets/media/photos/mohamed-2.jpeg',
      alt: 'Mohamed ZAALI - Fatal Error Conference',
    },
    {
      id: 3,
      src: 'assets/media/photos/mohamed-3.jpeg',
      alt: 'Mohamed ZAALI - AI generated ghibli style',
    },
    {
      id: 4,
      src: 'assets/media/photos/mohamed-4.jpeg',
      alt: 'Mohamed ZAALI - Professional headshot',
    },
    {
      id: 5,
      src: 'assets/media/photos/mohamed-5.jpg',
      alt: 'Mohamed ZAALI - Professional headshot',
    }
  ];

  // Tech stack with DevIcon classes
  techStack: TechStack[] = [
    { name: 'Python',       key: 'python',       icon: 'devicon-python-plain',          color: '#3776ab' },
    { name: 'TypeScript',   key: 'typescript',   icon: 'devicon-typescript-plain',      color: '#3178c6' },
    { name: 'JavaScript',   key: 'javascript',   icon: 'devicon-javascript-plain',      color: '#f7df1e' },
    { name: 'Java',         key: 'java',         icon: 'devicon-java-plain',            color: '#ed8b00' },
    { name: 'HTML5',        key: 'html',         icon: 'devicon-html5-plain',           color: '#e34c26' },
    { name: 'CSS3',         key: 'css',          icon: 'devicon-css3-plain',            color: '#1572b6' },
    { name: 'Bootstrap',    key: 'bootstrap',    icon: 'devicon-bootstrap-plain',       color: '#7952b3' },
    { name: 'Sass',         key: 'scss',         icon: 'devicon-sass-original',         color: '#cc6699' },
    { name: 'Angular',      key: 'angular',      icon: 'devicon-angular-plain',         color: '#dd0031' },
    { name: 'Spring Boot',  key: 'springboot',   icon: 'devicon-spring-original',       color: '#6db33f' },
    { name: 'Flask',        key: 'flask',        icon: 'devicon-flask-original',        color: '#000000' },
    { name: 'FastAPI',      key: 'fastapi',      icon: 'devicon-fastapi-plain',         color: '#009688' },
    { name: 'Scikit-Learn', key: 'scikitlearn',  icon: 'devicon-scikitlearn-plain',     color: '#f7931e' },
    { name: 'TensorFlow',   key: 'tensorflow',   icon: 'devicon-tensorflow-original',   color: '#ff6f00' },
    { name: 'PyTorch',      key: 'pytorch',      icon: 'devicon-pytorch-original',      color: '#ee4c2c' },
    { name: 'Docker',       key: 'docker',       icon: 'devicon-docker-plain',          color: '#2496ed' },
    { name: 'PostgreSQL',   key: 'postgresql',   icon: 'devicon-postgresql-plain',      color: '#336791' },
    { name: 'LangGraph',    key: 'langgraph',    icon: 'assets/media/tech-icons/langgraph.svg',    color: '#1c3c3c', isCustomIcon: true, scale: 2 },
    { name: 'LangFlow',     key: 'langflow',     icon: 'assets/media/tech-icons/langflow.svg',     color: '#f72585', isCustomIcon: true, scale: 2 },
    { name: 'HuggingFace',  key: 'huggingface',  icon: 'assets/media/tech-icons/huggingface.svg',  color: '#ffbd00', isCustomIcon: true, scale: 2 },
  ];

  // Typing animation — driven by i18n keys
  jobs: string[] = [];
  currentJob = '';
  currentJobIndex = 0;
  isTyping = false;
  private typingSpeed = 80;
  private deletingSpeed = 40;
  private pauseTime = 2500;

  constructor(
    private translocoService: TranslocoService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.updateJobsBasedOnLanguage();
    this.startPhotoCarousel();

    setTimeout(() => {
      this.startTypingAnimation();
    }, 1500);

    this.translocoService.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateJobsBasedOnLanguage();
    });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.setupLogoLoop();
    });
  }

  ngOnDestroy() {
    if (this.photoIntervalSubscription) {
      this.photoIntervalSubscription.unsubscribe();
    }
    this.stopLogoLoop();
    this.resizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // LOGO LOOP METHODS
  // ========================

  private setupLogoLoop() {
    const updateDimensions = () => {
      const seq = this.logoSeqRef?.nativeElement;
      const container = this.logoContainerRef?.nativeElement;
      if (!seq || !container) return;

      const seqRect = seq.getBoundingClientRect();
      const seqW = Math.ceil(seqRect.width);
      if (seqW <= 0) return;

      this.seqWidth = seqW;
      const containerW = container.clientWidth;
      const copies = Math.max(2, Math.ceil(containerW / seqW) + 2);

      if (copies !== this.copyCount) {
        this.copyCount = copies;
        this.cdr.detectChanges();
      }

      this.offset = ((this.offset % seqW) + seqW) % seqW;
    };

    // Wait for images to load before measuring
    const images = this.logoSeqRef?.nativeElement?.querySelectorAll('i') ?? [];
    updateDimensions();

    this.resizeObserver = new ResizeObserver(updateDimensions);
    if (this.logoContainerRef?.nativeElement) {
      this.resizeObserver.observe(this.logoContainerRef.nativeElement);
    }
    if (this.logoSeqRef?.nativeElement) {
      this.resizeObserver.observe(this.logoSeqRef.nativeElement);
    }

    this.startLogoAnimation();
  }

  private startLogoAnimation() {
    const animate = (timestamp: number) => {
      if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
      const delta = Math.max(0, timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      const target = this.isHovered ? 0 : this.SPEED;
      const easing = 1 - Math.exp(-delta / this.SMOOTH_TAU);
      this.velocity += (target - this.velocity) * easing;

      if (this.seqWidth > 0) {
        let next = this.offset + this.velocity * delta;
        next = ((next % this.seqWidth) + this.seqWidth) % this.seqWidth;
        this.offset = next;

        const track = this.logoTrackRef?.nativeElement;
        if (track) {
          track.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
        }
      }

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  private stopLogoLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  onLogoMouseEnter() {
    this.isHovered = true;
  }

  onLogoMouseLeave() {
    this.isHovered = false;
  }

  get copyArray(): number[] {
    return Array.from({ length: this.copyCount }, (_, i) => i);
  }

  // ========================
  // PHOTO CAROUSEL METHODS
  // ========================

  private startPhotoCarousel() {
    // Prevent multiple intervals
    if (this.photoIntervalSubscription) {
      this.photoIntervalSubscription.unsubscribe();
    }


    this.photoIntervalSubscription = interval(this.photoInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const timestamp = new Date().toLocaleTimeString();
        this.nextPhoto();
      });
  }

  nextPhoto() {
    const oldIndex = this.currentPhotoIndex;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.profilePhotos.length;
    this.cdr.detectChanges();
  }

  goToPhoto(index: number) {
    const oldIndex = this.currentPhotoIndex;
    this.currentPhotoIndex = index;
    this.cdr.detectChanges();
  }

  getPrevIndex(): number {
    return this.currentPhotoIndex === 0
      ? this.profilePhotos.length - 1
      : this.currentPhotoIndex - 1;
  }

  getNextIndex(): number {
    return (this.currentPhotoIndex + 1) % this.profilePhotos.length;
  }

  // ========================
  // TYPING ANIMATION METHODS
  // ========================

  private updateJobsBasedOnLanguage() {
    this.translocoService.selectTranslateObject<Record<string, string>>('home.jobs')
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobsObj => {
        this.jobs = Object.values(jobsObj);
        this.currentJobIndex = 0;
        this.cdr.detectChanges();
      });
  }

  private startTypingAnimation() {
    if (this.jobs.length === 0) {
      return;
    }

    this.typeCurrentJob();
  }

  private typeCurrentJob() {
    if (!this.jobs.length) {
      return;
    }

    const targetJob = this.jobs[this.currentJobIndex];

    this.isTyping = true;
    this.currentJob = '';
    this.cdr.detectChanges();

    this.typeText(targetJob, 0);
  }

  private typeText(text: string, charIndex: number) {
    if (charIndex < text.length) {
      this.currentJob += text.charAt(charIndex);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.typeText(text, charIndex + 1);
      }, this.typingSpeed);
    } else {
      this.isTyping = false;
      this.cdr.detectChanges();

      // Pause before deleting
      setTimeout(() => {
        this.deleteText();
      }, this.pauseTime);
    }
  }

  private deleteText() {
    if (this.currentJob.length > 0) {
      this.isTyping = true;
      this.currentJob = this.currentJob.slice(0, -1);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.deleteText();
      }, this.deletingSpeed);
    } else {
      // Move to next job
      this.currentJobIndex = (this.currentJobIndex + 1) % this.jobs.length;

      setTimeout(() => {
        this.typeCurrentJob();
      }, 500);
    }
  }

  // ========================
  // UTILITY METHODS
  // ========================

  trackPhoto(index: number, photo: ProfilePhoto): number {
    return photo.id;
  }

  trackTech(index: number, tech: TechStack): string {
    return tech.name;
  }
}
