import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DeviceSqlRepository } from '../device.sql.repository';

export class DeleteSqlAllDevicesCommand {
  constructor(public currentDeviceId: string, public userId: string) {}
}

@CommandHandler(DeleteSqlAllDevicesCommand)
export class DeleteSqlAllDevicesUseCase
  implements ICommandHandler<DeleteSqlAllDevicesCommand>
{
  constructor(private readonly deviceSqlRepository: DeviceSqlRepository) {}
  // Удаление всех устройств, кроме текущего устройства
  async execute(command: DeleteSqlAllDevicesCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { currentDeviceId, userId } = command;
    // Если идентификатор пользователя или идентификатор текущего устройства не передан
    // Возвращаем ошибку 401
    if (!userId || !currentDeviceId) {
      return { statusCode: HttpStatus.UNAUTHORIZED };
    }
    // Удаляем все устройства, кроме текущего устройства
    const isDeleteAllDevices = await this.deviceSqlRepository.deleteAllDevices(
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
