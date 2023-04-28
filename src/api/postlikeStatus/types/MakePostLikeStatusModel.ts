import { LikeStatuses } from '../../../types';

export type MakePostLikeStatusModel = {
  likeStatus: LikeStatuses;
  userId: string;
  postId: string;
};
