import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private photoIntervalSubscription: Subscription | null = null;
  private isInitialized = false;

  // Photo carousel
  currentPhotoIndex = 0;
  private photoInterval = 30000;

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
  ];

  // Tech stack with DevIcon classes
  techStack: TechStack[] = [
    {
      name: 'Python',
      key: 'python',
      icon: 'devicon-python-plain',
      color: '#3776ab',
    },
    {
      name: 'Java',
      key: 'java',
      icon: 'devicon-java-plain',
      color: '#ed8b00',
    },
    {
      name: 'HTML5',
      key: 'html',
      icon: 'devicon-html5-plain',
      color: '#e34c26',
    },
    {
      name: 'CSS3',
      key: 'css',
      icon: 'devicon-css3-plain',
      color: '#1572b6',
    },
    {
      name: 'Bootstrap',
      key: 'bootstrap',
      icon: 'devicon-bootstrap-plain',
      color: '#7952b3',
    },
    {
      name: 'Sass',
      key: 'scss',
      icon: 'devicon-sass-original',
      color: '#cc6699',
    },
    {
      name: 'JavaScript',
      key: 'javascript',
      icon: 'devicon-javascript-plain',
      color: '#f7df1e',
    },
    {
      name: 'Angular',
      key: 'angular',
      icon: 'devicon-angular-plain',
      color: '#dd0031',
    },
    {
      name: 'Spring Boot',
      key: 'springboot',
      icon: 'devicon-spring-original',
      color: '#6db33f',
    },
    {
      name: 'Flask',
      key: 'flask',
      icon: 'devicon-flask-original',
      color: '#000000',
    },
    {
      name: 'Scikit-Learn',
      key: 'scikitlearn',
      icon: 'devicon-scikitlearn-plain',
      color: '#f7931e',
    },
    {
      name: 'TensorFlow',
      key: 'tensorflow',
      icon: 'devicon-tensorflow-original',
      color: '#ff6f00',
    },
  ];

  // Typing animation (hardcoded for reliability)
  jobsEn: string[] = ['Data Scientist', 'Full Stack Developer', 'Health-Tech Innovator'];

  jobsFr: string[] = ['Data Scientist', 'Développeur Full Stack', 'Innovateur Health-Tech'];

  jobs: string[] = [];
  currentJob = '';
  currentJobIndex = 0;
  isTyping = false;
  private typingSpeed = 80;
  private deletingSpeed = 40;
  private pauseTime = 2500;

  constructor(private translocoService: TranslocoService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.isInitialized) {
      console.warn('Home component already initialized - skipping');
      return;
    }

    this.isInitialized = true;
    console.log('Home component initialized - starting carousel');

    // Set initial jobs
    this.updateJobsBasedOnLanguage();

    // Start photo carousel ONCE
    this.startPhotoCarousel();

    // Start typing animation after delay
    setTimeout(() => {
      console.log('Starting typing animation with jobs:', this.jobs);
      this.startTypingAnimation();
    }, 1500);

    // Handle language changes - but DON'T restart carousel
    this.translocoService.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      console.log('Language changed - updating jobs only');
      this.updateJobsBasedOnLanguage();
    });
  }

  ngOnDestroy() {
    console.log('Home component destroying');

    if (this.photoIntervalSubscription) {
      this.photoIntervalSubscription.unsubscribe();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // PHOTO CAROUSEL METHODS - FIXED VERSION
  // ========================

  private startPhotoCarousel() {
    // Prevent multiple intervals
    if (this.photoIntervalSubscription) {
      console.log('Photo carousel already running, stopping previous one');
      this.photoIntervalSubscription.unsubscribe();
    }

    console.log('Starting photo carousel with', this.photoInterval, 'ms interval');

    this.photoIntervalSubscription = interval(this.photoInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`Photo changing at ${timestamp} - from index ${this.currentPhotoIndex}`);
        this.nextPhoto();
      });
  }

  nextPhoto() {
    const oldIndex = this.currentPhotoIndex;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.profilePhotos.length;
    console.log(`Photo changed: ${oldIndex} → ${this.currentPhotoIndex}`);
    this.cdr.detectChanges();
  }

  goToPhoto(index: number) {
    const oldIndex = this.currentPhotoIndex;
    this.currentPhotoIndex = index;
    console.log(`Photo manually changed: ${oldIndex} → ${this.currentPhotoIndex}`);
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
    const currentLang = this.translocoService.getActiveLang();
    this.jobs = currentLang === 'fr' ? this.jobsFr : this.jobsEn;
    this.currentJobIndex = 0;

    console.log('Updated jobs for language:', currentLang, this.jobs);
    this.cdr.detectChanges();
  }

  private startTypingAnimation() {
    if (this.jobs.length === 0) {
      console.error('No jobs available for typing animation');
      return;
    }

    console.log('Starting typing with jobs:', this.jobs);
    this.typeCurrentJob();
  }

  private typeCurrentJob() {
    if (!this.jobs.length) {
      console.error('Jobs array is empty');
      return;
    }

    const targetJob = this.jobs[this.currentJobIndex];
    console.log('Typing job:', targetJob);

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
