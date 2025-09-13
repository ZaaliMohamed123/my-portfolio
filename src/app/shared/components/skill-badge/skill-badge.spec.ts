import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillBadge } from './skill-badge';

describe('SkillBadge', () => {
  let component: SkillBadge;
  let fixture: ComponentFixture<SkillBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillBadge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
