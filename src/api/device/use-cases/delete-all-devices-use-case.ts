import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DeviceRepository } from '../device.repository';

export class DeleteAllDevicesCommand {
  constructor(public currentDeviceId: string, public userId: string) {}
}

@CommandHandler(DeleteAllDevicesCommand)
export class DeleteAllDevicesUseCase
  implements ICommandHandler<DeleteAllDevicesCommand>
{
  constructor(private readonly deviceRepository: DeviceRepository) {}
  // Удаление всех устройств, кроме текущего устройства
  async execute(command: DeleteAllDevicesCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { currentDeviceId, userId } = command;
    // Если идентификатор пользователя или идентификатор текущего устройства не передан
    // Возвращаем ошибку 401
    if (!userId || !currentDeviceId) {
      return { statusCode: HttpStatus.UNAUTHORIZED };
    }
    // Удаляем все устройства, кроме текущего устройства
    const isDeleteAllDevices = await this.deviceRepository.deleteAllDevices(
      currentDeviceId,
      userId,
    );
    // Если устройства не удалились, возвращаем ошибку
    if (!isDeleteAllDevices) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }

    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
