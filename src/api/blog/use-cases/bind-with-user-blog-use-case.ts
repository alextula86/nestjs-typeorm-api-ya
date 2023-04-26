import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { UserRepository } from '../../user/user.repository';

import { BlogRepository } from '../blog.repository';

export class BindWithUserBlogCommand {
  constructor(public userId: string, public blogId: string) {}
}

@CommandHandler(BindWithUserBlogCommand)
export class BindWithUserBlogUseCase
  implements ICommandHandler<BindWithUserBlogCommand>
{
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление блогера
  async execute(command: BindWithUserBlogCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId } = command;
    // Ищем блогера
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 403
    if (isEmpty(foundUser)) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Привязываем пользователя к блогу
    await this.blogRepository.bindWithUser(foundUser.id, blogId);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
