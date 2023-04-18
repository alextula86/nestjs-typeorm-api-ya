import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';

import { validateOrRejectModel } from '../../../validate';
import { EmailManager } from '../../../managers';

import { UserRepository } from '../../user/user.repository';

import { RegistrationUserDto } from '../dto';

export class RegisterUserCommand {
  constructor(public registrationUserDto: RegistrationUserDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailManager: EmailManager,
  ) {}
  // Регистрация пользователя
  async execute(command: RegisterUserCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { registrationUserDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(registrationUserDto, RegistrationUserDto);
    // Получаем поля из DTO
    const { login, password, email } = registrationUserDto;
    // Проверяем добавлен ли пользователь с переданным логином
    const foundUserByLogin = await this.userRepository.findByLoginOrEmail(
      login,
    );
    // Если пользователь с переданным логином уже добавлен в базе, возвращаем ошибку 400
    if (foundUserByLogin) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `The user is already registered in the system`,
            field: 'login',
          },
        ],
      };
    }
    // Проверяем добавлен ли пользователь с переданным email
    const foundUserByEmail = await this.userRepository.findByLoginOrEmail(
      email,
    );
    // Если пользователь с переданным email уже добавлен в базе, возвращаем ошибку 400
    if (foundUserByEmail) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `The user is already registered in the system`,
            field: 'email',
          },
        ],
      };
    }
    // Создаем документ пользователя
    const registeredUser = await this.userRepository.createUser({
      login,
      password,
      email,
    });
    // Ищем созданного пользователя в базе
    const foundRegisteredUser = await this.userRepository.findUserById(
      registeredUser.id,
    );
    // Если пользователя нет, т.е. он не сохранился, возвращаем ошибку 400
    if (!foundRegisteredUser) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [{ message: 'User creation error' }],
      };
    }
    try {
      // Отправляем код подтверждения email
      await this.emailManager.sendEmailCreatedUser(
        foundRegisteredUser.email,
        foundRegisteredUser.confirmationCode,
      );
      // Возвращаем статус 204
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [{ message: 'User registered' }],
      };
    } catch (error) {
      // Если письмо не отправилось, то удаляем добавленного пользователя
      await this.userRepository.deleteUserById(foundRegisteredUser.id);
      // Возвращаем ошибку 400
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [{ message: 'User creation error' }],
      };
    }
  }
}
