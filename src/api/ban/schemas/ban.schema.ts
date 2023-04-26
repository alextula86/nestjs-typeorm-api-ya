import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { BanEntity } from '../entity';
import { MakeBanModel, BanStaticsType } from '../types';

@Schema()
export class Ban implements BanEntity {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

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
  login: string;

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
    trim: true,
    default: null,
  })
  banReason: string;

  @Prop({
    type: String,
    required: [true, 'The createdAt field is required'],
    trim: true,
  })
  createdAt: string;

  // Бан блоггера
  banUserForBlog(isBanned: boolean, banReason: string) {
    // Устанавливаем флаг бана блогера
    this.isBanned = isBanned;
    // Обновляем причину бана
    this.banReason = isBanned ? banReason : null;
    // Записываем дату бана блогера
    this.banDate = isBanned ? new Date() : null;
  }

  static async make(
    { userId, login, blogId, blogName, isBanned, banReason }: MakeBanModel,
    BanModel: BanModelType,
  ): Promise<BanDocument> {
    const ban = new BanEntity(
      userId,
      login,
      blogId,
      blogName,
      isBanned,
      banReason,
    );

    return new BanModel(ban);
  }
}

export type BanDocument = HydratedDocument<Ban>;
export type BanModelType = Model<BanDocument> & BanStaticsType;
export const BanSchema = SchemaFactory.createForClass(Ban);

BanSchema.methods = {
  banUserForBlog: Ban.prototype.banUserForBlog,
};

BanSchema.statics = {
  make: Ban.make,
};
