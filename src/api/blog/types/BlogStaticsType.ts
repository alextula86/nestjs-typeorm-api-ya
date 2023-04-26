import { BlogDocument, BlogModelType } from '../schemas';
import { MakeBlogModel } from '../types';

export type BlogStaticsType = {
  make: (
    makeBlogModel: MakeBlogModel,
    BlogModel: BlogModelType,
  ) => BlogDocument;
};
