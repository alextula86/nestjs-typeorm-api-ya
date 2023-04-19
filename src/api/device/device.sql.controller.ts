import {
  Controller,
  Get,
  Delete,
  Req,
  Param,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthRefreshTokenGuard } from '../../guards';

import {
  DeleteSqlAllDevicesCommand,
  DeleteSqlDeviceByIdCommand,
} from './use-cases';
import { DeviceSqlQueryRepository } from './device.sql.query.repository';
import { DeviceViewModel } from './types';

@UseGuards(AuthRefreshTokenGuard)
@Controller('api/security/devices')
export class DeviceSqlController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly deviceSqlQueryRepository: DeviceSqlQueryRepository,
  ) {}
  // Получение списка устройств
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllDevices(
    @Req() request: Request & { userId: string },
  ): Promise<DeviceViewModel[]> {
    // Получаем идентификатор пользователя
    const userId = request.userId;
    // Если идентификатор пользователя не определе, возвращаем ошибку 401
    if (!userId) {
      throw new UnauthorizedException();
    }
    // Получаем все устройства пользователя
    const allDevices = await this.deviceSqlQueryRepository.findAllDevices(
      userId,
    );
    // Возвращаем все устройства пользователя
    return allDevices;
  }
  // Удаление устройства
  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDeviceById(
    @Param('deviceId') deviceId: string,
    @Req() request: Request & { userId: string },
  ): Promise<boolean> {
    // Получаем идентификатор пользователя
    const userId = request.userId;
    // Удаляем устройство
    const { statusCode } = await this.commandBus.execute(
      new DeleteSqlDeviceByIdCommand(deviceId, userId),
    );
    if (statusCode === HttpStatus.UNAUTHORIZED) {
      throw new UnauthorizedException();
    }
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }

    return true;
  }
  // Удаление всех устройств, кроме текущего устройства
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllDevices(
    @Req() request: Request & { userId: string; deviceId: string },
  ): Promise<boolean> {
    // Получаем идентификатор пользователя
    const userId = request.userId;
    // Получаем текущее устройство
    const currentDeviceId = request.deviceId;
    // Удаляем устройства
    const { statusCode } = await this.commandBus.execute(
      new DeleteSqlAllDevicesCommand(currentDeviceId, userId),
    );
    // Если при удалении устройств вернулась ошибка, возвращаем ее
    if (statusCode === HttpStatus.UNAUTHORIZED) {
      throw new UnauthorizedException();
    }
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Иначе возвращаем true
    return true;
  }
}
