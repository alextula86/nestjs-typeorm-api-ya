import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { formatISO } from 'date-fns';

import { validateOrRejectModel } from '../../../validate';
import { getNextStrId } from '../../../utils';

import { AuthService } from '../auth.service';
import { UserRepository } from '../../user/user.repository';
import { DeviceSqlRepository } from '../../device/device.sql.repository';

import { AuthUserDto } from '../dto';

export class LoginCommand {
  constructor(
    public ip: string,
    public deviceTitle: string,
    public authUserDto: AuthUserDto,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly deviceSqlRepository: DeviceSqlRepository,
  ) {}
  // Аутентификация пользователя
  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const { ip, deviceTitle, authUserDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(authUserDto, AuthUserDto);
    // Получаем loginOrEmail, password из DTO
    const { loginOrEmail, password } = authUserDto;
    // Ищем пользователя по логину или емайлу
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);
    // Если пользователь не найден, то вернем null для возрвата 401 ошибки
    if (
      !user ||
      this.authService.checkUserBanned(user.isBanned, user.banDate)
    ) {
      return null;
    }
    // Проверка учетных данных по паролю
    const isCheckCredentialsUser = await this.authService.isCheckCredentials(
      user.passwordHash,
      password,
    );
    // Если пароль не верен, то вернем null для возрвата 401 ошибки
    if (!isCheckCredentialsUser) {
      return null;
    }
    // Формируем id устройства
    const deviceId = getNextStrId();
    // Формируем accessToken, refreshToken и дату истекания срока refreshToken
    const authTokens = await this.authService.generateAuthTokens(
      user.id,
      deviceId,
    );
    // Если возникла ошибка в формировании токенов, то вернем null для возрвата 401 ошибки
    if (!authTokens) {
      return null;
    }
    const { accessToken, refreshToken, iatRefreshToken } = authTokens;
    // Создаем документ устройства
    await this.deviceSqlRepository.createDevice({
      deviceId,
      ip: ip,
      title: deviceTitle,
      lastActiveDate: formatISO(new Date(iatRefreshToken)),
      userId: user.id,
    });
    // Обновляем refreshToken пользователя
    await this.userRepository.updateRefreshToken(user.id, refreshToken);
    // Возвращаем access и refresh токены
    return { accessToken, refreshToken };
  }
}
