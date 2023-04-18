import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { validateOrRejectModel } from '../../../validate';

import { CreateUserDto } from '../dto/user.dto';
import { UserRepository } from '../user.repository';

export class CreateUserCommand {
  constructor(public createUserDto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}
  // Создание пользователя
  async execute(command: CreateUserCommand): Promise<{
    userId: string;
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { createUserDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(createUserDto, CreateUserDto);
    // Получаем поля из DTO
    const { login, password, email } = createUserDto;
    // Проверяем добавлен ли пользователь с переданным логином
    const foundUserByLogin = await this.userRepository.findByLoginOrEmail(
      login,
    );
    // Если пользователь с переданным логином уже добавлен в базе, возвращаем ошибку 400
    if (foundUserByLogin) {
      return {
        userId: null,
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
        userId: null,
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `The user is already registered in the system`,
            field: 'email',
          },
        ],
      };
    }
    // Создаем пользователя
    const createdUser = await this.userRepository.createUser({
      login,
      password,
      email,
    });
    // Возвращаем идентификатор созданного пользователя и статус CREATED
    return {
      userId: String(createdUser.id),
      statusCode: HttpStatus.CREATED,
      statusMessage: [{ message: 'User created' }],
    };
  }
}
