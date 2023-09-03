import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { BlogSubscriptionStatus } from '../../../types';
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
    // Если подписка на блог со статусом Подписано уже добавлена, возвращаем статус 204
    if (
      !isEmpty(foundBlogSubscription) &&
      foundBlogSubscription.status === BlogSubscriptionStatus.SUBSCRIBED
    ) {
      return { statusCode: HttpStatus.NO_CONTENT };
    }
    // Если подписка на блог не добавлена, создаем ее иначе обновляем
    if (isEmpty(foundBlogSubscription)) {
      await this.blogSubscriptionRepository.subscribeCreate(userId, blogId);
    } else {
      await this.blogSubscriptionRepository.subscribeUpdate(
        userId,
        blogId,
        BlogSubscriptionStatus.SUBSCRIBED,
      );
    }
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
