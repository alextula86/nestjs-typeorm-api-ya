import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { trim } from 'lodash';
import { Document, HydratedDocument, Model } from 'mongoose';
import { PostEntity, NewestLikesEntity } from '../entity';
import { PostStaticsType, MakePostModel, UpdatePostModel } from '../types';

@Schema()
export class NewestLikes {
  @Prop({
    type: String,
    required: [true, 'The userId field is required'],
  })
  userId: string;

  @Prop({
    type: String,
    required: [true, 'The userLogin field is required'],
    trim: true,
    minLength: [3, 'The userLogin field must be at least 3, got {VALUE}'],
    maxLength: [10, 'The userLogin field must be no more than 10, got {VALUE}'],
    match: /^[a-zA-Z0-9_-]*$/,
  })
  userLogin: string;

  @Prop({
    type: String,
    required: [true, 'The createdAt field is required'],
    trim: true,
  })
  createdAt: string;
}

export const NewestLikesSchema = SchemaFactory.createForClass(NewestLikes);

@Schema()
export class Post extends Document {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

  @Prop({
    type: String,
    required: [true, 'The title field is required'],
    trim: true,
    minLength: [3, 'The title field must be at least 3, got {VALUE}'],
    maxLength: [30, 'The title field must be no more than 30, got {VALUE}'],
  })
  title: string;

  @Prop({
    type: String,
    required: [true, 'The shortDescription field is required'],
    trim: true,
    minLength: [
      3,
      'The shortDescription field must be at least 3, got {VALUE}',
    ],
    maxLength: [
      100,
      'The shortDescription field must be no more than 100, got {VALUE}',
    ],
  })
  shortDescription: string;

  @Prop({
    type: String,
    required: [true, 'The content field is required'],
    trim: true,
    minLength: [3, 'The content field must be at least 3, got {VALUE}'],
    maxLength: [
      1000,
      'The content field must be no more than 100, got {VALUE}',
    ],
  })
  content: string;

  @Prop({
    type: String,
    required: [true, 'The blogId field is required'],
    trim: true,
    minLength: [1, 'The blogId field must be at least 1, got {VALUE}'],
    maxLength: [50, 'The blogId field must be no more than 50, got {VALUE}'],
  })
  blogId: string;

  @Prop({
    type: String,
    required: [true, 'The blogName field is required'],
    trim: true,
    minLength: [3, 'The blogName field must be at least 3, got {VALUE}'],
    maxLength: [15, 'The blogName field must be no more than 15, got {VALUE}'],
  })
  blogName: string;

  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  userId: string;

  @Prop({
    type: String,
    required: [true, 'The login field is required'],
    trim: true,
    minLength: [3, 'The login field must be at least 3, got {VALUE}'],
    maxLength: [10, 'The login field must be no more than 10, got {VALUE}'],
    match: /^[a-zA-Z0-9_-]*$/,
  })
  userLogin: string;

  @Prop({
    type: String,
    required: [true, 'The createdAt field is required'],
    trim: true,
  })
  createdAt: string;

  @Prop({
    type: Number,
    default: 0,
  })
  likesCount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  dislikesCount: number;

  @Prop({ type: [NewestLikesSchema], default: [] })
  newestLikes: NewestLikesEntity[];

  @Prop({
    type: Boolean,
    default: false,
  })
  isBanned: boolean;

  setTitle(title: string) {
    if (!trim(title)) {
      throw new Error('The title field is required');
    }
    if (trim(title).length < 3) {
      throw new Error(`The title field must be at least 3, got ${title}`);
    }
    if (trim(title).length > 30) {
      throw new Error(`The title field must be no more than 30, got ${title}`);
    }
    this.title = title;
  }

  setShortDescription(shortDescription: string) {
    if (!trim(shortDescription)) {
      throw new Error('The shortDescription field is required');
    }
    if (trim(shortDescription).length < 3) {
      throw new Error(
        `The shortDescription field must be at least 3, got ${shortDescription}`,
      );
    }
    if (trim(shortDescription).length > 100) {
      throw new Error(
        `The shortDescription field must be no more than 100, got ${shortDescription}`,
      );
    }
    this.shortDescription = shortDescription;
  }

  setContent(content: string) {
    if (!trim(content)) {
      throw new Error('The content field is required');
    }
    if (trim(content).length < 3) {
      throw new Error(`The content field must be at least 3, got ${content}`);
    }
    if (trim(content).length > 1000) {
      throw new Error(
        `The content field must be no more than 1000, got ${content}`,
      );
    }
    this.content = content;
  }

  updateAllPost({ title, shortDescription, content }: UpdatePostModel) {
    this.setTitle(title);
    this.setShortDescription(shortDescription);
    this.setContent(content);
  }

  static make(
    {
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      userId,
      userLogin,
    }: MakePostModel,
    PostModel: PostModelType,
  ): PostDocument {
    const postTitle = trim(String(title));
    const postShortDescription = trim(String(shortDescription));
    const postContent = trim(String(content));
    const postUserId = trim(String(userId));
    const postUserLogin = trim(String(userLogin));
    const post = new PostEntity(
      postTitle,
      postShortDescription,
      postContent,
      blogId,
      blogName,
      postUserId,
      postUserLogin,
    );

    return new PostModel(post);
  }
}

export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & PostStaticsType;
export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.methods = {
  setTitle: Post.prototype.setTitle,
  setShortDescription: Post.prototype.setShortDescription,
  setContent: Post.prototype.setContent,
  updateAllPost: Post.prototype.updateAllPost,
  // updateLikeStatusesCount: Post.prototype.updateLikeStatusesCount,
};

PostSchema.statics = {
  make: Post.make,
};
