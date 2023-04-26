import { SortDirection } from '../../../types';

export type QueryPostModel = {
  searchNameTerm: string;
  pageNumber: string;
  pageSize: string;
  sortBy: string;
  sortDirection: SortDirection;
};
