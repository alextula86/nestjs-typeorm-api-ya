import { SortDirection } from '../../../types';

export type QueryCommentModel = {
  pageNumber: string;
  pageSize: string;
  sortBy: string;
  sortDirection: SortDirection;
};
