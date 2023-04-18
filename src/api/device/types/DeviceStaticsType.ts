import { DeviceDocument, DeviceModelType } from '../schemas';
import { MakeDeviceModel } from '../types';

export type DeviceStaticsType = {
  make: (
    makeDeviceModel: MakeDeviceModel,
    DeviceModel: DeviceModelType,
  ) => DeviceDocument;
};
