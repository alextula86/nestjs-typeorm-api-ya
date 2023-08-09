import { PostMainImageType } from '../../../types';

export type UpdatePostMainImageModel = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
  type: PostMainImageType;
};
