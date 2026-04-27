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
        { name: 'Python',     icon: 'devicon-python-plain colored',     tooltip: 'Python' },
        { name: 'Java',       icon: 'devicon-java-plain colored',       tooltip: 'Java' },
        { name: 'TypeScript', icon: 'devicon-typescript-plain colored', tooltip: 'TypeScript' },
        { name: 'JavaScript', icon: 'devicon-javascript-plain colored', tooltip: 'JavaScript' },
      ]
    },
    {
      label: 'skills.cat.aiengineering',
      icon: 'fas fa-robot',
      skills: [
        { name: 'LangChain',  icon: '/assets/media/tech-icons/langgraph.svg',                   tooltip: 'LangChain',  isCustomIcon: true },
        { name: 'LangGraph',  icon: '/assets/media/tech-icons/langgraph.svg',                   tooltip: 'LangGraph',  isCustomIcon: true },
        { name: 'LangFlow',   icon: '/assets/media/tech-icons/langflow.svg',                    tooltip: 'LangFlow',   isCustomIcon: true },
        { name: 'FastMCP',    icon: '/assets/media/tech-icons/Model_Context_Protocol_logo.svg', tooltip: 'FastMCP',    isCustomIcon: true },
        { name: 'OpenAI API', icon: '/assets/media/tech-icons/openai.svg',                      tooltip: 'OpenAI API', isCustomIcon: true },
        { name: 'Gemini API', icon: '/assets/media/tech-icons/Google_Gemini_icon_2025.svg',     tooltip: 'Gemini API', isCustomIcon: true },
        { name: 'RAG',        icon: 'fas fa-search',                                            tooltip: 'Retrieval-Augmented Generation' },
      ]
    },
    {
      label: 'skills.cat.datascience',
      icon: 'fas fa-brain',
      skills: [
        { name: 'Machine Learning', icon: 'devicon-scikitlearn-plain colored',   tooltip: 'Machine Learning' },
        { name: 'Deep Learning',    icon: 'devicon-tensorflow-original colored', tooltip: 'Deep Learning' },
        { name: 'NLP',              icon: 'devicon-python-plain colored',        tooltip: 'Natural Language Processing' },
      ]
    },
    {
      label: 'skills.cat.web',
      icon: 'fas fa-globe',
      skills: [
        { name: 'HTML',        icon: 'devicon-html5-plain colored',       tooltip: 'HTML5' },
        { name: 'CSS',         icon: 'devicon-css3-plain colored',        tooltip: 'CSS3' },
        { name: 'Bootstrap',   icon: 'devicon-bootstrap-plain colored',   tooltip: 'Bootstrap' },
        { name: 'Angular',     icon: 'devicon-angular-plain colored',     tooltip: 'Angular', color: '#dd0031' },
        { name: 'Flask',       icon: 'devicon-flask-original colored',    tooltip: 'Flask' },
        { name: 'FastAPI',     icon: 'devicon-fastapi-plain colored',     tooltip: 'FastAPI' },
        { name: 'Spring Boot', icon: 'devicon-spring-plain colored',      tooltip: 'Spring Boot' },
        { name: 'Streamlit',   icon: 'devicon-streamlit-plain colored',   tooltip: 'Streamlit' },
        { name: 'Gradio',      icon: '/assets/media/tech-icons/gradio.svg', tooltip: 'Gradio', isCustomIcon: true },
      ]
    },
    {
      label: 'skills.cat.databases',
      icon: 'fas fa-database',
      skills: [
        { name: 'MySQL',      icon: 'devicon-mysql-plain colored',      tooltip: 'MySQL' },
        { name: 'PostgreSQL', icon: 'devicon-postgresql-plain colored', tooltip: 'PostgreSQL' },
        { name: 'MongoDB',    icon: 'devicon-mongodb-plain colored',    tooltip: 'MongoDB' },
        { name: 'SQLite',     icon: 'devicon-sqlite-plain colored',     tooltip: 'SQLite' },
      ]
    },
    // ---- Uncomment when Data Engineer certification is obtained ----
    // {
    //   label: 'skills.cat.integration',
    //   icon: 'fas fa-plug',
    //   skills: [
    //     { name: 'Talend',           icon: 'fas fa-project-diagram', tooltip: 'Talend Data Integration' },
    //     { name: 'Data Warehousing', icon: 'fas fa-warehouse',       tooltip: 'Enterprise Data Warehousing' },
    //     { name: 'ETL',              icon: 'fas fa-random',          tooltip: 'ETL Processes' },
    //   ]
    // },
    // {
    //   label: 'skills.cat.bigdata',
    //   icon: 'fas fa-server',
    //   skills: [
    //     { name: 'Hadoop', icon: '/assets/media/tech-icons/Apache Hadoop.svg',          tooltip: 'Hadoop',        isCustomIcon: true },
    //     { name: 'Hive',   icon: '/assets/media/tech-icons/apachehive-svgrepo-com.svg', tooltip: 'Hive',          isCustomIcon: true },
    //     { name: 'Sqoop',  icon: '/assets/media/tech-icons/Apache_Sqoop_logo.svg',      tooltip: 'Apache Sqoop',  isCustomIcon: true },
    //     { name: 'Kafka',  icon: 'devicon-apachekafka-original colored',                tooltip: 'Apache Kafka' },
    //   ]
    // },
    // {
    //   label: 'skills.cat.visualization',
    //   icon: 'fas fa-chart-bar',
    //   skills: [
    //     { name: 'Power BI',      icon: '/assets/media/tech-icons/bi-2021.svg', tooltip: 'Power BI',      isCustomIcon: true },
    //     { name: 'Google Looker', icon: '/assets/media/tech-icons/Looker.svg',  tooltip: 'Google Looker', isCustomIcon: true },
    //   ]
    // },
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
      { threshold: 0.02, 
        rootMargin: '0px 0px -5% 0px'
       }
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
