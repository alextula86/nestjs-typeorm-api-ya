import { LikeStatuses } from '../../../types';

import { LikeStatusPostEntity } from '../entity';

type NewestLikes = {
  addedAt: string;
  userId: string;
  login: string;
};

type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatuses;
  newestLikes: NewestLikes[];
  likes?: LikeStatusPostEntity[];
};

export type PostViewModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;
};
