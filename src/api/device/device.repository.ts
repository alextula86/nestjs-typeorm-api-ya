import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Devices } from './entities';
import { MakeDeviceModel } from './types';

@Injectable()
export class DeviceRepository {
  constructor(
    @InjectRepository(Devices)
    private readonly deviceRepository: Repository<Devices>,
  ) {}
  // Поиск документа конкретного устройства по его идентификатору
  async findDeviceById(deviceId: string): Promise<{
    deviceId: string;
    ip: string;
    title: string;
    userId: string;
    lastActiveDate: string;
  } | null> {
    const foundDevice = await this.deviceRepository.query(
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
    const madeDevice = await this.deviceRepository
      .createQueryBuilder()
      .insert()
      .into(Devices)
      .values({
        deviceId,
        ip,
        title,
        lastActiveDate,
        userId,
      })
      .returning(['deviceId', 'ip', 'title', 'lastActiveDate'])
      .execute();

    return madeDevice.raw[0];
  }
  // Удаление устройства
  async deleteDeviceById(deviceId: string, userId: string): Promise<boolean> {
    await this.deviceRepository
      .createQueryBuilder()
      .delete()
      .from(Devices)
      .where('deviceId = :deviceId', { deviceId })
      .andWhere('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Удаление всех устройств, кроме текущего устройства
  async deleteAllDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<boolean> {
    await this.deviceRepository
      .createQueryBuilder()
      .delete()
      .from(Devices)
      .where('deviceId != :currentDeviceId', { currentDeviceId })
      .andWhere('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Удаление всех устройств пользователя
  async deleteAllUserDevices(userId: string): Promise<boolean> {
    /*await this.deviceRepository.query(`
      DELETE FROM devices
      WHERE "userId" = '${userId}';
    `);*/

    await this.deviceRepository
      .createQueryBuilder()
      .delete()
      .from(Devices)
      .andWhere('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Обновление даты у устройства
  async updateLastActiveDate(
    deviceId: string,
    lastActiveDate: string,
  ): Promise<boolean> {
    /*const query = `
      UPDATE devices
      SET "lastActiveDate" = '${lastActiveDate}'
      WHERE "deviceId" = '${deviceId}';
    `;
    await this.deviceRepository.query(query);*/

    await this.deviceRepository
      .createQueryBuilder()
      .update(Devices)
      .set({ lastActiveDate })
      .where('deviceId = :deviceId', { deviceId })
      .execute();

    return true;
  }
}
