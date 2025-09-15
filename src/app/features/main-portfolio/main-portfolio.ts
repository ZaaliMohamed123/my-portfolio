import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// Import the Home component
import { Home } from './components/home/home';

@Component({
  selector: 'app-main-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    Home  // Add Home component here
    // Remove other placeholder imports for now
    // About, Education, etc. - we'll add them later
  ],
  template: `
    <!-- Single Page Portfolio Layout -->
    <div class="portfolio-container">
      <!-- Replace test content with actual Home component -->
      <app-home id="home" class="portfolio-section"></app-home>
      
      <!-- Keep other test sections for now -->
      <section id="about" class="test-section">
        <div class="container-custom">
          <h2>About Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
      
      <section id="education" class="test-section">
        <div class="container-custom">
          <h2>Education Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
      
      <section id="experience" class="test-section">
        <div class="container-custom">
          <h2>Experience Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
      
      <section id="projects" class="test-section">
        <div class="container-custom">
          <h2>Projects Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
      
      <section id="skills" class="test-section">
        <div class="container-custom">
          <h2>Skills Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
      
      <section id="contact" class="test-section">
        <div class="container-custom">
          <h2>Contact Section</h2>
          <p>Coming soon...</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portfolio-container {
      min-height: 100vh;
    }
    
    .portfolio-section {
      // Remove the min-height and padding since Home handles its own layout
      display: block;
    }
    
    .test-section {
      padding: 4rem 0;
      min-height: 80vh;
      display: flex;
      align-items: center;
      
      h2 {
        font-size: 2rem;
        margin-bottom: 1.5rem;
        color: var(--text-primary);
      }
      
      p {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }
      
      // Keep the colored backgrounds for other sections
      &#about { background: rgba(16, 185, 129, 0.03); }
      &#education { background: rgba(59, 130, 246, 0.03); }
      &#experience { background: rgba(236, 72, 153, 0.03); }
      &#projects { background: rgba(6, 182, 212, 0.03); }
      &#skills { background: rgba(139, 92, 246, 0.03); }
      &#contact { background: rgba(34, 197, 94, 0.03); }
    }
    
    .dark-mode {
      .test-section {
        &#about { background: rgba(34, 197, 94, 0.05); }
        &#education { background: rgba(96, 165, 250, 0.05); }
        &#experience { background: rgba(244, 114, 182, 0.05); }
        &#projects { background: rgba(34, 211, 238, 0.05); }
        &#skills { background: rgba(167, 139, 250, 0.05); }
        &#contact { background: rgba(52, 211, 153, 0.05); }
      }
    }
  `]
})
export class MainPortfolio implements OnInit, AfterViewInit {

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Handle direct section navigation
    this.route.params.subscribe(params => {
      const section = params['section'];
      if (section) {
        setTimeout(() => this.scrollToSection(section), 100);
      }
    });
  }

  ngAfterViewInit() {
    // Handle fragment-based navigation
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => this.scrollToSection(fragment), 100);
      }
    });
  }

  private scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const offsetTop = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }
}
