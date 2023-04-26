import { PostDocument, PostModelType } from '../schemas';
import { MakePostModel } from '../types';

export type PostStaticsType = {
  make: (
    makePostModel: MakePostModel,
    PostModel: PostModelType,
  ) => PostDocument;
};
