import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogSubscription } from './entities';
import { BlogSubscriptionStatus } from '../../types';
import { BlogSubscriptionModel } from './types';

@Injectable()
export class BlogSubscriptionRepository {
  constructor(
    @InjectRepository(BlogSubscription)
    private readonly blogSubscriptionRepository: Repository<BlogSubscription>,
  ) {}
  async findBlogSubscription(
    userId: string,
    blogId: string,
  ): Promise<BlogSubscriptionModel | null> {
    const foundBlogSubscription = await this.blogSubscriptionRepository.query(
      `SELECT * FROM blog_subscription WHERE "blogId" = '${blogId}' AND "userId" = '${userId}';`,
    );

    if (!foundBlogSubscription) {
      return null;
    }

    return foundBlogSubscription[0];
  }
  async subscribeCreate(userId: string, blogId: string): Promise<void> {
    await this.blogSubscriptionRepository
      .createQueryBuilder()
      .insert()
      .into(BlogSubscription)
      .values({
        blogId,
        userId,
        status: BlogSubscriptionStatus.SUBSCRIBED,
      })
      .execute();
  }
  async subscribeUpdate(
    userId: string,
    blogId: string,
    status: BlogSubscriptionStatus,
  ): Promise<boolean> {
    await this.blogSubscriptionRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({ status })
      .where('blogId = :blogId', { blogId })
      .andWhere('userId = :userId', { userId })
      .execute();

    return true;
  }
}
