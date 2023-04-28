import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';

import { CommentRepository } from '../comment.repository';
import { UpdateCommentDto } from '../dto/comment.dto';

export class UpdateCommentCommand {
  constructor(
    public userId: string,
    public commentId: string,
    public updateCommentDto: UpdateCommentDto,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновить комментарий
  async execute(command: UpdateCommentCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { userId, commentId, updateCommentDto } = command;
    await validateOrRejectModel(updateCommentDto, UpdateCommentDto);
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
            message: `UserId incorrect`,
          },
        ],
      };
    }
    // Проверяем принадлежит ли обновляемый комментарий пользователю
    if (foundComment.userId !== foundUser.id) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [{ message: `FORBIDDEN` }],
      };
    }
    // Получаем поля из DTO
    const { content } = updateCommentDto;
    // Обновляем комментарий
    await this.commentRepository.updateComment(commentId, { content });
    // Возвращаем статус 204
    return {
      statusCode: HttpStatus.NO_CONTENT,
      statusMessage: [
        {
          message: `Comment updated`,
        },
      ],
    };
  }
}
