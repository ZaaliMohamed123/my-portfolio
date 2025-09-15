import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { interval, Subject, takeUntil } from 'rxjs';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit, OnDestroy {

  // Component state
  private destroy$ = new Subject<void>();
  
  // Photo carousel
  currentPhotoIndex = 0;
  private photoInterval = 4000; // 4 seconds
  
  profilePhotos: ProfilePhoto[] = [
    {
      id: 1,
      src: 'assets/media/photos/mohamed-1.jpeg',
      alt: 'Mohamed ZAALI - Professional headshot'
    },
    {
      id: 2,
      src: 'assets/media/photos/mohamed-2.jpeg',
      alt: 'Mohamed ZAALI - Fatal Error Conference'
    },
    {
      id: 3,
      src: 'assets/media/photos/mohamed-3.jpeg',
      alt: 'Mohamed ZAALI - AI generated ghibli style'
    },
    {
      id: 4,
      src: 'assets/media/photos/mohamed-4.jpeg',
      alt: 'Mohamed ZAALI - Professional headshot'
    }
  ];

  // Tech stack with DevIcon classes
  techStack: TechStack[] = [
    { 
      name: 'Python', 
      key: 'python',
      icon: 'devicon-python-plain',
      color: '#3776ab' 
    },
    { 
      name: 'Java', 
      key: 'java',
      icon: 'devicon-java-plain',
      color: '#ed8b00' 
    },
    { 
      name: 'HTML5', 
      key: 'html',
      icon: 'devicon-html5-plain',
      color: '#e34c26' 
    },
    { 
      name: 'CSS3', 
      key: 'css',
      icon: 'devicon-css3-plain',
      color: '#1572b6' 
    },
    { 
      name: 'Bootstrap', 
      key: 'bootstrap',
      icon: 'devicon-bootstrap-plain',
      color: '#7952b3' 
    },
    { 
      name: 'JavaScript', 
      key: 'javascript',
      icon: 'devicon-javascript-plain',
      color: '#f7df1e' 
    },
    { 
      name: 'TypeScript', 
      key: 'typescript',
      icon: 'devicon-typescript-plain',
      color: '#3178c6' 
    },
    { 
      name: 'Spring Boot', 
      key: 'springboot',
      icon: 'devicon-spring-plain',
      color: '#6db33f' 
    },
    { 
      name: 'Angular', 
      key: 'angular',
      icon: 'devicon-angular-plain',
      color: '#dd0031' 
    }
  ];

  // Typing animation
  jobs: string[] = [];
  currentJob = '';
  currentJobIndex = 0;
  isTyping = false;
  private typingSpeed = 100; // milliseconds per character
  private deletingSpeed = 50; // milliseconds per character
  private pauseTime = 2000; // pause between jobs

  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.initializeJobs();
    this.startPhotoCarousel();
    this.startTypingAnimation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // PHOTO CAROUSEL METHODS
  // ========================

  private startPhotoCarousel() {
    interval(this.photoInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.nextPhoto();
      });
  }

  nextPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.profilePhotos.length;
  }

  goToPhoto(index: number) {
    this.currentPhotoIndex = index;
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

  private initializeJobs() {
    // Get translated job titles
    this.translocoService.selectTranslate('home.jobs.job1')
      .pipe(takeUntil(this.destroy$))
      .subscribe(job1 => {
        this.jobs[0] = job1;
      });

    this.translocoService.selectTranslate('home.jobs.job2')
      .pipe(takeUntil(this.destroy$))
      .subscribe(job2 => {
        this.jobs[1] = job2;
      });

    this.translocoService.selectTranslate('home.jobs.job3')
      .pipe(takeUntil(this.destroy$))
      .subscribe(job3 => {
        this.jobs[2] = job3;
      });
  }

  private startTypingAnimation() {
    // Wait a bit before starting
    setTimeout(() => {
      this.typeCurrentJob();
    }, 1000);
  }

  private typeCurrentJob() {
    if (this.jobs.length === 0) return;

    const targetJob = this.jobs[this.currentJobIndex];
    this.isTyping = true;
    this.currentJob = '';
    
    this.typeText(targetJob, 0);
  }

  private typeText(text: string, charIndex: number) {
    if (charIndex < text.length) {
      this.currentJob += text.charAt(charIndex);
      setTimeout(() => {
        this.typeText(text, charIndex + 1);
      }, this.typingSpeed);
    } else {
      this.isTyping = false;
      // Pause before deleting
      setTimeout(() => {
        this.deleteText();
      }, this.pauseTime);
    }
  }

  private deleteText() {
    this.isTyping = true;
    if (this.currentJob.length > 0) {
      this.currentJob = this.currentJob.slice(0, -1);
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

  // Track function for performance
  trackPhoto(index: number, photo: ProfilePhoto): number {
    return photo.id;
  }

  trackTech(index: number, tech: TechStack): string {
    return tech.name;
  }
}
