import { SortDirection } from '../../../types';

export type QueryVannedUserModel = {
  searchLoginTerm: string;
  pageNumber: string;
  pageSize: string;
  sortBy: string;
  sortDirection: SortDirection;
};
