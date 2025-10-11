import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificationsGallery } from './certifications-gallery';

describe('CertificationsGallery', () => {
  let component: CertificationsGallery;
  let fixture: ComponentFixture<CertificationsGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificationsGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificationsGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
