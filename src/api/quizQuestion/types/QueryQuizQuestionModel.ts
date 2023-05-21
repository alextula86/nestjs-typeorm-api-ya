import { PublishedStatus, SortDirection } from '../../../types';

export type QueryQuizQuestionModel = {
  bodySearchTerm: string;
  publishedStatus: PublishedStatus;
  pageNumber: string;
  pageSize: string;
  sortBy: string;
  sortDirection: SortDirection;
};
