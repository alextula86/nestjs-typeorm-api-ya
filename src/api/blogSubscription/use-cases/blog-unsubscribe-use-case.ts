import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { BlogSubscriptionStatus } from '../../../types';
import { BlogRepository } from '../../blog/blog.repository';
import { BlogSubscriptionRepository } from '../blogSubscription.repository';

export class BlogUnSubscribeCommand {
  constructor(public userId: string, public blogId: string) {}
}

@CommandHandler(BlogUnSubscribeCommand)
export class BlogUnSubscribeUseCase
  implements ICommandHandler<BlogUnSubscribeCommand>
{
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly blogSubscriptionRepository: BlogSubscriptionRepository,
  ) {}
  // Отписаться от блога
  async execute(command: BlogUnSubscribeCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId } = command;
    // Ищем блогера, на которого подписываемся
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем подписку пользователя на блог
    const foundBlogSubscription =
      await this.blogSubscriptionRepository.findBlogSubscription(
        userId,
        blogId,
      );
    // Если подписка на блог не найден, возвращаем ошибку 404
    if (isEmpty(foundBlogSubscription)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Отписываемся от блога
    await this.blogSubscriptionRepository.subscribeUpdate(
      userId,
      blogId,
      BlogSubscriptionStatus.UNSUBSCRIBED,
    );
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
