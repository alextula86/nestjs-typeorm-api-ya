import { Injectable } from '@nestjs/common';
import { LikeStatuses } from '../../types';
import { CommentLikeStatusRepository } from './commentLikeStatus.repository';

@Injectable()
export class CommentLikeStatusService {
  constructor(
    private readonly commentLikeStatusRepository: CommentLikeStatusRepository,
  ) {}
  // Получить лайк статус комментария пользователя
  async gettLikeStatusOfUser(
    userId: string | null,
    commentId: string,
  ): Promise<LikeStatuses> {
    if (!userId) {
      return LikeStatuses.NONE;
    }

    const foundLikeStatusOfUser =
      await this.commentLikeStatusRepository.findLikeStatusOfUser(
        userId,
        commentId,
      );

    if (!foundLikeStatusOfUser) {
      return LikeStatuses.NONE;
    }

    return foundLikeStatusOfUser.likeStatus;
  }
}
