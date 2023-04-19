import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import { MakeDeviceModel } from './types';

@Injectable()
export class DeviceSqlRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа конкретного устройства по его идентификатору
  async findDeviceById(deviceId: string): Promise<{
    deviceId: string;
    ip: string;
    title: string;
    userId: string;
    lastActiveDate: string;
  } | null> {
    const foundDevice = await this.dataSource.query(
      `SELECT * FROM devices WHERE "deviceId" = '${deviceId}';`,
    );

    if (!foundDevice) {
      return null;
    }

    return foundDevice[0];
  }
  // Создаем документ пользователя
  async createDevice({
    deviceId,
    ip,
    title,
    userId,
    lastActiveDate,
  }: MakeDeviceModel): Promise<{
    deviceId: string;
    ip: string;
    title: string;
    userId: string;
    lastActiveDate: string;
  }> {
    const query = `
      INSERT INTO devices
        ("deviceId", "ip", "title", "lastActiveDate", "userId")
        VALUES ('${deviceId}', '${ip}', '${title}', '${lastActiveDate}', ${+userId})
        RETURNING *;
    `;

    const madeDevice = await this.dataSource.query(query);

    return madeDevice[0];
  }
  // Удаление устройства
  async deleteDeviceById(deviceId: string, userId: string): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM devices
      WHERE "deviceId" = '${deviceId}' AND "userId" = '${userId}';
    `);

    return true;
  }
  // Удаление всех устройств, кроме текущего устройства
  async deleteAllDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM devices
      WHERE "deviceId" != '${currentDeviceId}' AND "userId" = '${userId}';
    `);

    return true;
  }
  // Удаление всех устройств пользователя
  async deleteAllUserDevices(userId: string): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM devices
      WHERE "userId" = '${userId}';
    `);

    return true;
  }
  // Обновление даты у устройства
  async updateLastActiveDate(
    deviceId: string,
    lastActiveDate: string,
  ): Promise<boolean> {
    const query = `
      UPDATE devices
      SET "lastActiveDate" = '${lastActiveDate}'
      WHERE "deviceId" = '${deviceId}';
    `;
    await this.dataSource.query(query);

    return true;
  }
  // Очистка таблицы
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE devices;`);

    return true;
  }
}
