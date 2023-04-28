import { CommentDocument, CommentModelType } from '../schemas';
import { MakeCommentModel } from '../types';

export type CommentStaticsType = {
  make: (
    makeCommentModel: MakeCommentModel,
    CommentModel: CommentModelType,
  ) => CommentDocument;
};
