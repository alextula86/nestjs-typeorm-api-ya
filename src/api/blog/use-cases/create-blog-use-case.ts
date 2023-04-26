import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';

import { CreateBlogDto } from '../dto/blog.dto';
import { BlogRepository } from '../blog.repository';

export class CreateBlogCommand {
  constructor(public userId: string, public createBlogDto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Создание блогера
  async execute(command: CreateBlogCommand): Promise<{
    blogId: string;
    statusCode: HttpStatus;
  }> {
    const { userId, createBlogDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(createBlogDto, CreateBlogDto);
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return {
        blogId: null,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    // Получаем поля из DTO
    const { name, description, websiteUrl } = createBlogDto;
    // Создаем блогера
    const createdBlog = await this.blogRepository.createBlog({
      name,
      description,
      websiteUrl,
      userId: foundUser.id,
    });
    // Возвращаем идентификатор созданного блогера и статус 201
    return {
      blogId: createdBlog.id,
      statusCode: HttpStatus.CREATED,
    };
  }
}
