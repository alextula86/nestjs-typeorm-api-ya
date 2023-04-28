import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

// import { PageType } from '../../../types';

// import { LikeStatusRepository } from '../../likeStatus/likeStatus.repository';

import { CommentRepository } from '../comment.repository';

export class DeleteCommentCommand {
  constructor(public commentId: string, public userId: string) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(
    //private readonly likeStatusRepository: LikeStatusRepository,
    private readonly commentRepository: CommentRepository,
  ) {}
  // Удаление комментария
  async execute(
    command: DeleteCommentCommand,
  ): Promise<{ statusCode: HttpStatus }> {
    const { commentId, userId } = command;
    // Ищем комментарий
    const foundComment = await this.commentRepository.findCommentById(
      commentId,
    );
    // Если комментарий не найден, возвращаем ошибку 404
    if (isEmpty(foundComment)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }

    if (foundComment.userId !== userId) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }

    await this.commentRepository.deleteCommentById(commentId);

    /*await this.likeStatusRepository.deleteLikeStatusesByParentId(
      commentId,
      PageType.COMMENT,
    );*/

    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
