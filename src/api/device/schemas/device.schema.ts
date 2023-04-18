import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

import { DeviceEntity } from '../entity';
import { MakeDeviceModel, DeviceStaticsType } from '../types';

@Schema()
export class Device {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

  @Prop({
    type: String,
    required: [true, 'The deviceId field is required'],
  })
  deviceId: string;

  @Prop({
    type: String,
    required: [true, 'The ip field is required'],
  })
  ip: string;

  @Prop({
    type: String,
    required: [true, 'The title field is required'],
  })
  title: string;

  @Prop({
    type: String,
    required: [true, 'The userId field is required'],
  })
  userId: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  active: boolean;

  @Prop({
    type: String,
    required: [true, 'The lastActiveDate field is required'],
    trim: true,
  })
  lastActiveDate: string;

  setlastActiveDate(lastActiveDate: string) {
    if (!lastActiveDate) throw new Error('Bad lastActiveDate value!');
    this.lastActiveDate = lastActiveDate;
  }

  updateLastActiveDate(lastActiveDate) {
    this.setlastActiveDate(lastActiveDate);
  }

  static async make(
    { deviceId, ip, title, userId, lastActiveDate }: MakeDeviceModel,
    DeviceModel: DeviceModelType,
  ): Promise<DeviceDocument> {
    const device = new DeviceEntity(
      deviceId,
      ip,
      title,
      userId,
      lastActiveDate,
    );

    return new DeviceModel(device);
  }
}

export type DeviceDocument = HydratedDocument<Device>;
export type DeviceModelType = Model<DeviceDocument> & DeviceStaticsType;
export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.methods = {
  setlastActiveDate: Device.prototype.setlastActiveDate,
  updateLastActiveDate: Device.prototype.updateLastActiveDate,
};

DeviceSchema.statics = {
  make: Device.make,
};
