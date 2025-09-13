import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebProjectDetail } from './web-project-detail';

describe('WebProjectDetail', () => {
  let component: WebProjectDetail;
  let fixture: ComponentFixture<WebProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebProjectDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
