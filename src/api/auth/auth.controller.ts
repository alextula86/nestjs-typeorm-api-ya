import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Ip,
  Body,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';

import {
  AuthBearerGuard,
  AuthRefreshTokenGuard,
  AuthCountRequestsGuard,
} from '../../guards';

import {
  LoginCommand,
  LogoutCommand,
  RefreshTokenCommand,
  RegisterUserCommand,
  RegistrationConfirmationCommand,
  RegistrationEmailResendingCommand,
  PasswordRecoveryCommand,
  NewPasswordCommand,
} from './use-cases';

import { AuthQueryRepository } from './auth.query.repository';

import {
  AuthUserDto,
  ConfirmPasswordDto,
  RegistrationConfirmationDto,
  RegistrationEmailDto,
  RegistrationUserDto,
} from './dto';
import { UserAuthViewModel, AuthAccessTokenModel } from './types';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authQueryRepository: AuthQueryRepository,
  ) {}
  // Получение данных о пользователе
  @Get('me')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  async me(
    @Req() request: Request & { userId: string },
  ): Promise<UserAuthViewModel> {
    // Получаем конкретного аутентифицированного пользователя по его идентификатору
    const foundAuthUser = await this.authQueryRepository.findAuthUserById(
      request.userId,
    );
    // Если аутентифицированный пользователь не найден возвращаем ошибку
    if (!foundAuthUser) {
      throw new UnauthorizedException();
    }
    // Возвращаем аутентифицированного пользователя в формате ответа пользователю
    return foundAuthUser;
  }
  // Аутентификация пользователя
  @Post('/login')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() request: Request,
    @Ip() ip: string,
    @Body() authUserDto: AuthUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthAccessTokenModel> {
    // Формируем наименование устройства
    const deviceTitle = request.headers['user-agent'] || '';
    // Формируем токены
    const authUserTokens = await this.commandBus.execute(
      new LoginCommand(ip, deviceTitle, authUserDto),
    );
    // Если аутентифицированный пользователь не найден возвращаем ошибку 401
    if (!authUserTokens) {
      throw new UnauthorizedException();
    }
    // Получаем токены
    const { accessToken, refreshToken } = authUserTokens;
    // Сохраняем новый refresh токен в cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });
    // Возвращаем сформированный access токен
    return { accessToken };
  }
  // Logout пользователя
  @Post('/logout')
  @UseGuards(AuthRefreshTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req()
    request: Request & { userId: string; deviceId: string; deviceIat: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    // Выполняем logout пользователя
    const { statusCode } = await this.commandBus.execute(
      new LogoutCommand(request.userId, request.deviceId, request.deviceIat),
    );
    // Если при logout возникли ошибки возращаем статус ошибки 401
    if (statusCode === HttpStatus.UNAUTHORIZED) {
      throw new UnauthorizedException();
    }
    // Удаляем refresh токен из cookie
    response.clearCookie('refreshToken');
  }
  // Получение access и refresh токена
  @Post('refresh-token')
  @UseGuards(AuthRefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req()
    request: Request & { userId: string; deviceId: string; deviceIat: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthAccessTokenModel> {
    // Формируем токены
    const authUserTokens = await this.commandBus.execute(
      new RefreshTokenCommand(
        request.userId,
        request.deviceId,
        request.deviceIat,
      ),
    );
    // Если при получении токенов возникли ошибки возращаем статус ошибки 401
    if (!authUserTokens) {
      throw new UnauthorizedException();
    }
    // Получаем токены
    const { accessToken, refreshToken } = authUserTokens;
    // Пишем новый refresh токен в cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });
    // Возвращаем access токен
    return { accessToken };
  }
  // Регистрация пользователя
  @Post('registration')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(
    @Body() registrationUserDto: RegistrationUserDto,
  ): Promise<void> {
    // Регестрируем пользователя
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new RegisterUserCommand(registrationUserDto),
    );
    // Если при регистрации пользователя возникли ошибки возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
  // Подтверждение email по коду
  @Post('/registration-confirmation')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() registrationConfirmationDto: RegistrationConfirmationDto,
  ): Promise<void> {
    // Проверяем код подтверждения email
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new RegistrationConfirmationCommand(registrationConfirmationDto),
    );
    // Если при проверке кода подтверждения email возникли ошибки возвращаем статус и текст ошибки
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
  // Повторная отправка кода подтверждения email
  @Post('/registration-email-resending')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() registrationEmailDto: RegistrationEmailDto,
  ): Promise<void> {
    // Повторно формируем код подтверждения email, обновляем код у пользователя и отправляем письмо
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new RegistrationEmailResendingCommand(registrationEmailDto),
    );
    // Если новый код подтверждения email не сформирован или не сохранен для пользователя или письмо не отправлено,
    // возвращаем статус 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
  // Восстановление пароля с помощью подтверждения по электронной почте.
  @Post('/password-recovery')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() registrationEmailDto: RegistrationEmailDto,
  ): Promise<void> {
    // Повторно формируем код востановления пароля, обновляем код у пользователя и отправляем письмо
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new PasswordRecoveryCommand(registrationEmailDto),
    );
    // Если код востановления пароля не сформирован или не сохранен для пользователя или письмо не отправлено,
    // возвращаем статус 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
  // Подтверждение восстановление пароля
  @Post('/new-password')
  @UseGuards(AuthCountRequestsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(
    @Body() confirmPasswordDto: ConfirmPasswordDto,
  ): Promise<void> {
    // Обновляем пароль пользователя
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new NewPasswordCommand(confirmPasswordDto),
    );
    // Если пароль не обновился возвращаем статус 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
}
