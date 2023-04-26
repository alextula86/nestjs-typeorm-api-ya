import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { UserRepository } from '../../user/user.repository';

import { BlogRepository } from '../blog.repository';

export class DeleteBlogCommand {
  constructor(public userId: string, public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Удаление блогера
  async execute(command: DeleteBlogCommand): Promise<{
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
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю
    if (foundBlog.userId !== foundUser.id) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Удаляем блогера
    const isDeleteBlogById = await this.blogRepository.deleteBlogById(blogId);
    // Если при удалении блогера возникли ошибки, возвращаем ошибку 404
    if (!isDeleteBlogById) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
