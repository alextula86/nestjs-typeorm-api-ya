import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { PostRepository } from '../../post/post.repository';

import { BlogRepository } from '../blog.repository';
import { BanBlogDto } from '../dto';

export class BanBlogCommand {
  constructor(public blogId: string, public banBlogDto: BanBlogDto) {}
}

@CommandHandler(BanBlogCommand)
export class BanBlogUseCase implements ICommandHandler<BanBlogCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly postRepository: PostRepository,
  ) {}
  // Бан блогера
  async execute(command: BanBlogCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { blogId, banBlogDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(banBlogDto, BanBlogDto);
    // Получаем поля из DTO
    const { isBanned } = banBlogDto;
    // Ищем блогера
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Баним блог
    await this.blogRepository.banBlog(blogId, isBanned);
    // Банним посты блогера
    await this.postRepository.banPostsByBlogId(blogId, isBanned);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
