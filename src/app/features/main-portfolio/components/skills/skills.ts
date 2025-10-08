import { 
  Component, 
  OnInit, 
  OnDestroy,
  AfterViewInit, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

interface Skill {
  name: string;
  icon?: string;
  color?: string;
  tooltip: string;
  isCustomIcon?: boolean;
}

interface SkillCategory {
  label: string;
  icon: string;
  skills: Skill[];
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skills implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('skillsSection') skillsSection!: ElementRef;
  skillsInView = false;

  // Scroll Detection
  visibleSections = new Set<string>();

  skillCategories: SkillCategory[] = [
    {
      label: 'skills.cat.programming',
      icon: 'fas fa-code',
      skills: [
        { name: 'Python', icon: 'devicon-python-plain colored', tooltip: 'Python' },
        { name: 'Java', icon: 'devicon-java-plain colored', tooltip: 'Java' },
        { name: 'C/C++', icon: 'devicon-cplusplus-plain colored', tooltip: 'C/C++' },
        { name: 'MATLAB', icon: 'devicon-matlab-plain colored', tooltip: 'MATLAB' },
      ]
    },
    {
      label: 'skills.cat.databases',
      icon: 'fas fa-database',
      skills: [
        { name: 'MySQL', icon: 'devicon-mysql-plain colored', tooltip: 'MySQL' },
        { name: 'Oracle', icon: 'devicon-oracle-original colored', tooltip: 'Oracle' },
        { name: 'MongoDB', icon: 'devicon-mongodb-plain colored', tooltip: 'MongoDB' },
        { name: 'SQLite', icon: 'devicon-sqlite-plain colored', tooltip: 'SQLite' },
      ]
    },
    {
      label: 'skills.cat.web',
      icon: 'fas fa-globe',
      skills: [
        { name: 'HTML', icon: 'devicon-html5-plain colored', tooltip: 'HTML5' },
        { name: 'CSS', icon: 'devicon-css3-plain colored', tooltip: 'CSS3' },
        { name: 'JavaScript', icon: 'devicon-javascript-plain colored', tooltip: 'JavaScript' },
        { name: 'Bootstrap', icon: 'devicon-bootstrap-plain colored', tooltip: 'Bootstrap' },
        { name: 'Angular', icon: 'devicon-angular-plain colored', tooltip: 'Angular' },
        { name: 'Streamlit', icon: 'devicon-python-plain', tooltip: 'Streamlit (Python)' },
        { name: 'Flask', icon: 'devicon-flask-original colored', tooltip: 'Flask' },
        { name: 'Spring Boot', icon: 'devicon-spring-plain colored', tooltip: 'Spring Boot' },
      ]
    },
    {
      label: 'skills.cat.datascience',
      icon: 'fas fa-brain',
      skills: [
        { name: 'Machine Learning', icon: 'devicon-scikitlearn-plain colored', tooltip: 'Machine Learning' },
        { name: 'Deep Learning', icon: 'devicon-tensorflow-original colored', tooltip: 'Deep Learning' },
      ]
    },
    {
      label: 'skills.cat.integration',
      icon: 'fas fa-plug',
      skills: [
        { name: 'Talend', icon: 'fas fa-project-diagram', tooltip: 'Talend Data Integration' },
        { name: 'Data Warehousing', icon: 'fas fa-warehouse', tooltip: 'Enterprise Data Warehousing' },
        { name: 'ETL', icon: 'fas fa-random', tooltip: 'ETL Processes' },
      ]
    },
    {
      label: 'skills.cat.bigdata',
      icon: 'fas fa-server',
      skills: [
        { name: 'Hadoop', icon: '/assets/media/tech-icons/Apache Hadoop.svg', tooltip: 'Hadoop', isCustomIcon: true },
        { name: 'Hive', icon: '/assets/media/tech-icons/apachehive-svgrepo-com.svg', tooltip: 'Hive', isCustomIcon: true },
        { name: 'Sqoop', icon: '/assets/media/tech-icons/Apache_Sqoop_logo.svg', tooltip: 'Apache Sqoop', isCustomIcon: true },
        { name: 'Kafka', icon: 'devicon-apachekafka-original colored', tooltip: 'Apache Kafka' },
      ]
    },
    {
      label: 'skills.cat.visualization',
      icon: 'fas fa-chart-bar',
      skills: [
        { name: 'Power BI', icon: '/assets/media/tech-icons/bi-2021.svg', tooltip: 'Power BI', isCustomIcon: true },
        { name: 'Google Looker', icon: '/assets/media/tech-icons/Looker.svg', tooltip: 'Google Looker', isCustomIcon: true },
      ]
    },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeScrollObserver();
  }

  ngAfterViewInit() {
    // FadeIn Animation Observer
    const fadeInObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.skillsSection.nativeElement) {
            if (entry.isIntersecting) {
              this.skillsInView = true;
              this.cdr.detectChanges();
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    if (this.skillsSection?.nativeElement) {
      fadeInObserver.observe(this.skillsSection.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // SCROLL ANIMATIONS
  // ========================

  private initializeScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.visibleSections.add('header');
            this.visibleSections.add('grid');
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
      const skillsSection = document.getElementById('skills');
      if (skillsSection) {
        observer.observe(skillsSection);
      }
    }, 100);
  }
}
