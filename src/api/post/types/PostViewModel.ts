import { LikeStatuses, ImageType } from '../../../types';

export type NewestLikes = {
  addedAt: string;
  userId: string;
  login: string;
};

type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatuses;
  newestLikes: NewestLikes[];
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
  images: {
    main: ImageType[];
  };
};
