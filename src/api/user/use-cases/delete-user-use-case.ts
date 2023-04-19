import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { validateUUID } from '../../../utils';
import { UserRepository } from '../user.repository';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}
  // Создание пользователя
  async execute(command: DeleteUserCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId } = command;
    // Проверяем является ли идентификатор пользователя UUID
    if (!validateUUID(userId)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем пользователя по идентификатору
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 404
    if (!foundUser) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Удаляем пользователя
    await this.userRepository.deleteUserById(userId);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
