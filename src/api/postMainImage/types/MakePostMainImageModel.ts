import { PostMainImageType } from '../../../types';

export type MakePostMainImageModel = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
  postId: string;
  type: PostMainImageType;
};
