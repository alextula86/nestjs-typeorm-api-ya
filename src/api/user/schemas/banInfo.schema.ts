import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BanInfoSchema {
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
}
