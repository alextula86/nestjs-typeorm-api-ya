import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';
import { CommentRepository } from '../../comment/comment.repository';

import { CommentLikeStatusRepository } from '../commentLikeStatus.repository';
import { AddLikeStatusDTO } from '../dto/likeStatus.dto';

export class UpdateLikeStatusCommentCommand {
  constructor(
    public userId: string,
    public commentId: string,
    public addLikeStatusDTO: AddLikeStatusDTO,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommentCommand)
export class UpdateLikeStatusCommentUseCase
  implements ICommandHandler<UpdateLikeStatusCommentCommand>
{
  constructor(
    private readonly commentLikeStatusRepository: CommentLikeStatusRepository,
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление лайк статуса коментария
  async execute(command: UpdateLikeStatusCommentCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { userId, commentId, addLikeStatusDTO } = command;
    // Валидируем DTO
    await validateOrRejectModel(addLikeStatusDTO, AddLikeStatusDTO);
    // Ищем комментарий
    const foundComment = await this.commentRepository.findCommentById(
      commentId,
    );
    // Если комментарий не найден, возвращаем ошибку 404
    if (isEmpty(foundComment)) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `Comment with id ${commentId} was not found`,
            field: 'commentId',
          },
        ],
      };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `User with id ${userId} was not found`,
            field: 'userId',
          },
        ],
      };
    }
    // Получаем лайк статус из DTO
    const { likeStatus } = addLikeStatusDTO;
    // Находим лайк статус коментария пользователя
    const foundLikeStatusOfUser =
      await this.commentLikeStatusRepository.findLikeStatusOfUser(
        userId,
        commentId,
      );
    // Если пользователь не лайкал комментарий, то создаем инстанс лайк статуса и добавляем его для комментария
    if (!foundLikeStatusOfUser) {
      await this.commentLikeStatusRepository.createLikeStatus({
        likeStatus,
        userId: foundUser.id,
        commentId,
      });
      // Возвращаем статус 204
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [{ message: `Like status update` }],
      };
    }
    // Если лайк статус пользователя равен переданому лайк статусу не производим обновление лайк статуса
    if (foundLikeStatusOfUser.likeStatus === likeStatus) {
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [{ message: `Like status update` }],
      };
    }
    // Обновляем лайк статус
    await this.commentLikeStatusRepository.updateLikeStatus({
      likeStatus,
      userId: foundUser.id,
      commentId,
    });
    // Возвращаем статус 204
    return {
      statusCode: HttpStatus.NO_CONTENT,
      statusMessage: [
        {
          message: `Like status update`,
        },
      ],
    };
  }
}
