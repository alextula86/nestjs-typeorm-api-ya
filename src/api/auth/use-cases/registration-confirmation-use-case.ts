import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';

import { validateOrRejectModel } from '../../../validate';

import { AuthService } from '../../auth/auth.service';
import { UserRepository } from '../../user/user.repository';

import { RegistrationConfirmationDto } from '../dto';

export class RegistrationConfirmationCommand {
  constructor(
    public registrationConfirmationDto: RegistrationConfirmationDto,
  ) {}
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationUseCase
  implements ICommandHandler<RegistrationConfirmationCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
  ) {}
  // Подтверждение email по коду
  async execute(command: RegistrationConfirmationCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { registrationConfirmationDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(
      registrationConfirmationDto,
      RegistrationConfirmationDto,
    );
    // Получаем код из DTO
    const { code } = registrationConfirmationDto;
    // Ищем пользователя по коду подтверждения email
    const user = await this.userRepository.findByConfirmationCode(code);
    // Если пользователь по коду подтверждения email не найден, возвращаем ошибку 400
    if (!user) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: 'The user is not registered in the system',
            field: 'code',
          },
        ],
      };
    }
    // Если дата для подтверждения email по коду просрочена
    // Если email уже подтвержден
    // Возвращаем ошибку
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
            message: 'Code is incorrectly',
            field: 'code',
          },
        ],
      };
    }
    // Проверяем был ли подтвержден аккаунт
    this.authService.confirm(user.emailExpirationDate, user.isConfirmed);
    // Если аккаунт не был подтвержден, то подтверждаем его
    await this.userRepository.updateEmailConfirmation(user.id, true);
    // Возвращаем статус 204
    return {
      statusCode: HttpStatus.NO_CONTENT,
      statusMessage: [{ message: 'Registration confirmation done' }],
    };
  }
}
