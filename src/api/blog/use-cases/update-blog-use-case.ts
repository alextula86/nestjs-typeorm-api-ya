import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';

import { UpdateBlogDto } from '../dto/blog.dto';
import { BlogRepository } from '../blog.repository';

export class UpdateBlogCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public updateBlogDto: UpdateBlogDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление блогера
  async execute(command: UpdateBlogCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId, updateBlogDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(updateBlogDto, UpdateBlogDto);
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
      return { statusCode: HttpStatus.BAD_REQUEST };
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю
    if (foundBlog.userId !== foundUser.id) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Обновляем блогера
    await this.blogRepository.updateBlog(blogId, updateBlogDto);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
