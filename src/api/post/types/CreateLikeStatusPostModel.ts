import { LikeStatuses } from '../../../types';

export type CreateLikeStatusPostModel = {
  userId: string;
  userLogin: string;
  likeStatus: LikeStatuses;
};
