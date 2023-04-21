import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { SessionEntity } from '../entity';
import { MakeSessionModel, SessionStaticsType } from '../types';

@Schema()
export class Session {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

  @Prop({
    type: String,
    required: [true, 'The ip field is required'],
  })
  ip: string;

  @Prop({
    type: String,
    required: [true, 'The deviceTitle field is required'],
  })
  deviceTitle: string;

  @Prop({
    type: String,
    required: [true, 'The url field is required'],
  })
  url: string;

  @Prop({
    type: String,
    required: [true, 'The issuedAtt field is required'],
    trim: true,
  })
  issuedAtt: string;

  @Prop({
    type: Number,
    default: true,
  })
  attempt: number;

  // Увеличиваем поле attempt на единицу
  increaseAttempt() {
    this.attempt += 1;
  }
  // Сбрасываем поле attempt в исходное состояние
  resetAttempt() {
    this.attempt = 1;
    this.issuedAtt = new Date().toISOString();
  }

  static async make(
    { ip, deviceTitle, url }: MakeSessionModel,
    DeviceModel: SessionModelType,
  ): Promise<SessionDocument> {
    const device = new SessionEntity(ip, deviceTitle, url);

    return new DeviceModel(device);
  }
}

export type SessionDocument = HydratedDocument<Session>;
export type SessionModelType = Model<SessionDocument> & SessionStaticsType;
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.methods = {
  increaseAttempt: Session.prototype.increaseAttempt,
  resetAttempt: Session.prototype.resetAttempt,
};

SessionSchema.statics = {
  make: Session.make,
};
