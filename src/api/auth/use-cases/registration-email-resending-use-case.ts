import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';

import { validateOrRejectModel } from '../../../validate';
import { EmailManager } from '../../../managers';
import { generateUUID } from '../../../utils';

import { AuthService } from '../../auth/auth.service';
import { UserRepository } from '../../user/user.repository';

import { RegistrationEmailDto } from '../dto';

export class RegistrationEmailResendingCommand {
  constructor(public registrationEmailDto: RegistrationEmailDto) {}
}

@CommandHandler(RegistrationEmailResendingCommand)
export class RegistrationEmailResendingUseCase
  implements ICommandHandler<RegistrationEmailResendingCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly emailManager: EmailManager,
  ) {}
  // Повторная отправка кода подтверждения аккаунта на email
  async execute(command: RegistrationEmailResendingCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { registrationEmailDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(registrationEmailDto, RegistrationEmailDto);
    // Получаем код из DTO
    const { email } = registrationEmailDto;
    // Ищем пользователя по email
    const user = await this.userRepository.findByLoginOrEmail(email);
    // Если пользователь по email не найден, возвращаем ошибку 400
    if (!user) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: 'The user is not registered in the system',
            field: 'email',
          },
        ],
      };
    }
    // Если дата для подтверждения email по коду просрочена
    // Если email уже подтвержден
    // Возвращаем ошибку 400
    if (
      !this.authService.canBeConfirmed(
        user.emailExpirationDate,
        user.isConfirmed,
      )
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `Account can't be confirm!`,
            field: 'email',
          },
        ],
      };
    }
    // Проверяем был ли подтвержден аккаунт
    this.authService.confirm(user.emailExpirationDate, user.isConfirmed);
    // Генерируем код для подтверждения пользователя
    const confirmationCode = generateUUID();
    // Обновляем код для подтверждения email
    this.userRepository.updateConfirmationCode(user.id, confirmationCode);
    // Отправляем письмо с новым кодом подтверждения аккаунта
    try {
      // Если обновление кода подтверждения email прошло успешно, отправляем письмо
      await this.emailManager.sendEmailCreatedUser(email, confirmationCode);
      // Возвращаем результат обнорвления кода подтверждения email
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [
          { message: 'The update confirmation code has been executed' },
        ],
      };
    } catch (error) {
      // Если письмо по какой-либо причине не было отправлено
      // Возвращаем ошибку 400
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          { message: 'The update confirmation code has not been executed' },
        ],
      };
    }
  }
}
