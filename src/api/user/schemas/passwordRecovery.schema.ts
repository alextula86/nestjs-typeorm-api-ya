import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class PasswordRecoverySchema {
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  recoveryCode: string;

  @Prop({
    type: Date,
    required: [true, 'The expirationDate field is required'],
  })
  expirationDate: Date;

  @Prop({
    type: Boolean,
    default: true,
  })
  isRecovered: boolean;
}
