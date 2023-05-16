import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { DeviceRepository } from '../device.repository';

export class DeleteDeviceByIdCommand {
  constructor(public deviceId: string, public userId: string) {}
}

@CommandHandler(DeleteDeviceByIdCommand)
export class DeleteDeviceByIdUseCase
  implements ICommandHandler<DeleteDeviceByIdCommand>
{
  constructor(private readonly deviceRepository: DeviceRepository) {}
  // Удаление устройства
  async execute(command: DeleteDeviceByIdCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { deviceId, userId } = command;
    // Если идентификатор пользователя не передан, возвращаем ошибку 401
    if (!userId) {
      return { statusCode: HttpStatus.UNAUTHORIZED };
    }
    // Если идентификатор устройства не передан, возвращаем ошибку 404
    if (!deviceId) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем устройство по его идентификатору
    const foundDevice = await this.deviceRepository.findDeviceById(deviceId);
    // Если устройство не найдено, возвращаем ошибку 404
    if (isEmpty(foundDevice)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Если устройство пренадлежит другому пользователю возвращаем ошибку
    if (foundDevice.userId !== userId) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Удаляем устройство
    const isDeletedDevice = await this.deviceRepository.deleteDeviceById(
      deviceId,
      userId,
    );
    // Если устройство не было удалено, возвращаем ошибку 404
    if (!isDeletedDevice) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
