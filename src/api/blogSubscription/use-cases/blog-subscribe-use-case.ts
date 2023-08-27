import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { BlogRepository } from '../../blog/blog.repository';

import { BlogSubscriptionRepository } from '../blogSubscription.repository';

export class BlogSubscribeCommand {
  constructor(public userId: string, public blogId: string) {}
}

@CommandHandler(BlogSubscribeCommand)
export class BlogSubscribeUseCase
  implements ICommandHandler<BlogSubscribeCommand>
{
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly blogSubscriptionRepository: BlogSubscriptionRepository,
  ) {}
  // Подписаться на блог
  async execute(command: BlogSubscribeCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId } = command;
    console.log('userId', userId);
    console.log('blogId', blogId);
    // Ищем блогера, на которого подписываемся
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Подписываемся на блог
    await this.blogSubscriptionRepository.subscribe(userId, blogId);
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
