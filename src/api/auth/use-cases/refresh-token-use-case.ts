import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEqual } from 'date-fns';
import { AuthService } from '../../auth/auth.service';
import { UserRepository } from '../../user/user.repository';
import { DeviceSqlRepository } from '../../device/device.sql.repository';

export class RefreshTokenCommand {
  constructor(
    public userId: string,
    public deviceId: string,
    public deviceIat: string,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly deviceSqlRepository: DeviceSqlRepository,
  ) {}
  // Получение access и refresh токена
  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const { userId, deviceId, deviceIat } = command;
    // Ищем пользователя по его идентификатору
    const user = await this.userRepository.findUserById(userId);
    // Ищем устройство пользователя по его идентификатору
    const device = await this.deviceSqlRepository.findDeviceById(deviceId);
    // Если пользователь не найден, то вернем null для возрвата 401 ошибки
    if (!user || !device) {
      return null;
    }
    // Если даты создания устройства не совпадают, возвращаем ошибку 401
    if (!isEqual(new Date(deviceIat), new Date(device.lastActiveDate))) {
      return null;
    }
    // Обновляем access токен, refresh токен и дату истекания срока refreshToken
    const authTokens = await this.authService.generateAuthTokens(
      user.id,
      device.deviceId,
    );
    // Если возникла ошибка в формировании токенов, то вернем null для возрвата 401 ошибки
    if (!authTokens) {
      return null;
    }
    const { accessToken, refreshToken, iatRefreshToken } = authTokens;
    // Обновляем refresh токен пользователя
    await this.userRepository.updateRefreshToken(user.id, refreshToken);
    // Обновляем дату у устройства
    this.deviceSqlRepository.updateLastActiveDate(
      device.deviceId,
      new Date(iatRefreshToken).toISOString(),
    );
    // Возвращаем access и refresh токены
    return { accessToken, refreshToken };
  }
}
