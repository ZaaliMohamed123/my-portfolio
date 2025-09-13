import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiProjectDetail } from './ai-project-detail';

describe('AiProjectDetail', () => {
  let component: AiProjectDetail;
  let fixture: ComponentFixture<AiProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiProjectDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
