import { getNextStrId } from '../../../utils';

export class DeviceEntity {
  id: string;
  active: boolean;
  constructor(
    public deviceId: string,
    public ip: string,
    public title: string,
    public userId: string,
    public lastActiveDate: string,
  ) {
    this.id = getNextStrId();
    this.active = true;
  }
}
