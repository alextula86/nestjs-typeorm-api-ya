import { BlogSubscriptionStatus } from '../../../types';

export type BlogSubscriptionModel = {
  id: string;
  blogId: string;
  userId: string;
  status: BlogSubscriptionStatus;
};
