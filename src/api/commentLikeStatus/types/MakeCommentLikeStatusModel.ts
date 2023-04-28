import { LikeStatuses } from '../../../types';

export type MakeCommentLikeStatusModel = {
  likeStatus: LikeStatuses;
  userId: string;
  commentId: string;
};
