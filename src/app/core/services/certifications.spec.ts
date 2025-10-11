import { TestBed } from '@angular/core/testing';

import { Certifications } from './certifications';

describe('Certifications', () => {
  let service: Certifications;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Certifications);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
