import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import { DeviceViewModel } from './types';

@Injectable()
export class DeviceSqlQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllDevices(userId: number): Promise<DeviceViewModel[]> {
    const devices = await this.dataSource.query(`
      SELECT "ip", "title", "lastActiveDate", "deviceId"
      FROM devices
      WHERE "userId" = ${userId}
    `);

    return this._getDevicesViewModel(devices);
  }
  _getDevicesViewModel(
    devices: {
      ip: string;
      title: string;
      lastActiveDate: string;
      deviceId: string;
    }[],
  ): DeviceViewModel[] {
    return devices.map((item) => ({
      ip: item.ip,
      title: item.title,
      lastActiveDate: item.lastActiveDate,
      deviceId: item.deviceId,
    }));
  }
}
