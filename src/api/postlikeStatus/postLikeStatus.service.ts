import { Injectable } from '@nestjs/common';
import { LikeStatuses } from '../../types';
import { PostLikeStatusRepository } from './postLikeStatus.repository';

@Injectable()
export class PostLikeStatusService {
  constructor(
    private readonly postLikeStatusRepository: PostLikeStatusRepository,
  ) {}
  // Получить лайк статус поста пользователя
  async getPostLikeStatusOfUser(
    userId: string | null,
    postId: string,
  ): Promise<LikeStatuses> {
    if (!userId) {
      return LikeStatuses.NONE;
    }

    const foundLikeStatusOfUser =
      await this.postLikeStatusRepository.findLikeStatusOfUser(userId, postId);

    if (!foundLikeStatusOfUser) {
      return LikeStatuses.NONE;
    }

    return foundLikeStatusOfUser.likeStatus;
  }
}
