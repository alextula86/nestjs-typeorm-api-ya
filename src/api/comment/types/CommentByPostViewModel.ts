import { LikeStatuses } from '../../../types';

type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

type PostInfo = {
  id: string;
  title: string;
  blogId: string;
  blogName: string;
};

type LikesInfo = {
  likesCount?: number;
  dislikesCount: number;
  myStatus: LikeStatuses;
};

export type CommentByPostViewModel = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  postInfo: PostInfo;
  likesInfo: LikesInfo;
};
