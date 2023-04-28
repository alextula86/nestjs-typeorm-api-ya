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

export type CommentByPostViewModel = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  postInfo: PostInfo;
};
