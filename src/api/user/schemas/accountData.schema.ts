import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class AccountDataSchema {
  @Prop({
    type: String,
    required: [true, 'The login field is required'],
    trim: true,
    minLength: [3, 'The login field must be at least 3, got {VALUE}'],
    maxLength: [10, 'The login field must be no more than 10, got {VALUE}'],
    match: /^[a-zA-Z0-9_-]*$/,
  })
  login: string;

  @Prop({
    type: String,
    required: [true, 'The email field is required'],
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'The passwordHash field is required'],
  })
  passwordHash: string;

  @Prop({
    type: String,
    required: [true, 'The createdAt field is required'],
  })
  createdAt: string;
}
