import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { trim } from 'lodash';
import { HydratedDocument, Model } from 'mongoose';

import { BlogEntity } from '../entity';
import { BlogStaticsType, MakeBlogModel, UpdateBlogModel } from '../types';

@Schema()
export class Blog {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

  @Prop({
    type: String,
    required: [true, 'The name field is required'],
    trim: true,
    minLength: [3, 'The name field must be at least 3, got {VALUE}'],
    maxLength: [15, 'The name field must be no more than 15, got {VALUE}'],
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'The description field is required'],
    trim: true,
    minLength: [3, 'The description field must be at least 3, got {VALUE}'],
    maxLength: [
      500,
      'The description field must be no more than 500, got {VALUE}',
    ],
  })
  description: string;

  @Prop({
    type: String,
    required: [true, 'The websiteUrl field is required'],
  })
  websiteUrl: string;

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
    type: Boolean,
    default: false,
  })
  isMembership: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isBanned: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  banDate: Date;

  @Prop({
    type: String,
    required: [true, 'The createdAt field is required'],
    trim: true,
  })
  createdAt: string;

  setName(name: string) {
    if (!trim(name)) {
      throw new Error('The name field is required');
    }
    if (trim(name).length < 3) {
      throw new Error(`The name field must be at least 3, got ${name}`);
    }
    if (trim(name).length > 15) {
      throw new Error(`The name field must be no more than 15, got ${name}`);
    }
    this.name = name;
  }

  setDescription(description: string) {
    if (!trim(description)) {
      throw new Error('The description field is required');
    }
    if (trim(description).length < 3) {
      throw new Error(
        `The description field must be at least 3, got ${description}`,
      );
    }
    if (trim(description).length > 500) {
      throw new Error(
        `The description field must be no more than 500, got ${description}`,
      );
    }
    this.description = description;
  }

  setWebsiteUrl(websiteUrl: string) {
    if (!trim(websiteUrl)) {
      throw new Error('The websiteUrl field is required');
    }
    if (trim(websiteUrl).length > 100) {
      throw new Error(
        `The websiteUrl field must be no more than 100, got ${websiteUrl}`,
      );
    }
    this.websiteUrl = websiteUrl;
  }

  setUserId(userId: string) {
    if (!trim(userId)) {
      throw new Error('The userId field is required');
    }
    this.userId = userId;
  }

  setUserLogin(userLogin: string) {
    if (!trim(userLogin)) {
      throw new Error('The userLogin field is required');
    }
    this.userLogin = userLogin;
  }

  updateAllBlog({ name, description, websiteUrl }: UpdateBlogModel) {
    this.setName(name);
    this.setDescription(description);
    this.setWebsiteUrl(websiteUrl);
  }

  bindWithUser(userId: string, userLogin: string) {
    this.setUserId(userId);
    this.setUserLogin(userLogin);
  }
  // Бан блоггера
  banBlog(isBanned: boolean) {
    // Устанавливаем флаг бана блогера
    this.isBanned = isBanned;
    // Записываем дату бана блогера
    this.banDate = isBanned ? new Date() : null;
  }

  static make(
    { name, description, websiteUrl, userId, userLogin }: MakeBlogModel,
    BlogModel: BlogModelType,
  ): BlogDocument {
    const bloggerName = trim(String(name));
    const bloggerDescription = trim(String(description));
    const bloggerWebsiteUrl = trim(String(websiteUrl));
    const bloggerUserId = trim(String(userId));
    const bloggerUserLogin = trim(String(userLogin));
    const blog = new BlogEntity(
      bloggerName,
      bloggerDescription,
      bloggerWebsiteUrl,
      bloggerUserId,
      bloggerUserLogin,
    );

    return new BlogModel(blog);
  }
}

export type BlogDocument = HydratedDocument<Blog>;
export type BlogModelType = Model<BlogDocument> & BlogStaticsType;
export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.methods = {
  setName: Blog.prototype.setName,
  setDescription: Blog.prototype.setDescription,
  setWebsiteUrl: Blog.prototype.setWebsiteUrl,
  setUserId: Blog.prototype.setUserId,
  setUserLogin: Blog.prototype.setUserLogin,
  updateAllBlog: Blog.prototype.updateAllBlog,
  bindWithUser: Blog.prototype.bindWithUser,
  banBlog: Blog.prototype.banBlog,
};

BlogSchema.statics = {
  make: Blog.make,
};
