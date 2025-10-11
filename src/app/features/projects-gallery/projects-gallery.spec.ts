import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsGallery } from './projects-gallery';

describe('ProjectsGallery', () => {
  let component: ProjectsGallery;
  let fixture: ComponentFixture<ProjectsGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
