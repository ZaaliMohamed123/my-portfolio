import { CertificationTag } from './certificationTag.enum';

export type CertificationSortOption = 'latest' | 'oldest' | 'title-asc' | 'title-desc';
export type CertificationType = 'all' | 'standalone' | 'skill-track';

export interface CertificationFilters {
  sort: CertificationSortOption;
  tags: CertificationTag[];
  type: CertificationType;
  search: string;
}

export const DEFAULT_CERTIFICATION_FILTERS: CertificationFilters = {
  sort: 'latest',
  tags: [],
  type: 'all',
  search: ''
};
