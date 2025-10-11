import { CertificationTag } from './certificationTag.enum';
import { SubCertification } from './subCertification.model';

export interface Certification {
  id: number;
  type: 'standalone' | 'skill-track';
  title: string;
  provider: string;
  description: string;
  credentialUrl: string;
  skills: string[];
  tags: CertificationTag[];
  subCertifications?: SubCertification[]; // Optional, only for skill-tracks
}