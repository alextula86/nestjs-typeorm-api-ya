import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class EmailConfirmationSchema {
  @Prop({
    type: String,
    required: [true, 'The confirmationCode field is required'],
    trim: true,
  })
  confirmationCode: string;

  @Prop({
    type: Date,
    required: [true, 'The expirationDate field is required'],
  })
  expirationDate: Date;

  @Prop({
    type: Boolean,
    default: true,
  })
  isConfirmed: boolean;
}
