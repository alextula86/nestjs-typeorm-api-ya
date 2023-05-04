import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';
import { PostRepository } from '../../post/post.repository';

import { PostLikeStatusRepository } from '../postLikeStatus.repository';
import { AddLikeStatusDTO } from '../dto/likeStatus.dto';

export class UpdateLikeStatusPostCommand {
  constructor(
    public userId: string,
    public postId: string,
    public addLikeStatusDTO: AddLikeStatusDTO,
  ) {}
}

@CommandHandler(UpdateLikeStatusPostCommand)
export class UpdateLikeStatusPostUseCase
  implements ICommandHandler<UpdateLikeStatusPostCommand>
{
  constructor(
    private readonly postLikeStatusRepository: PostLikeStatusRepository,
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление лайк статуса поста
  async execute(command: UpdateLikeStatusPostCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { userId, postId, addLikeStatusDTO } = command;
    // Валидируем DTO
    await validateOrRejectModel(addLikeStatusDTO, AddLikeStatusDTO);
    // Ищем пост
    const foundPost = await this.postRepository.findPostById(postId);
    // Если пост не найден, возвращаем ошибку 404
    if (isEmpty(foundPost)) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `Comment with id ${postId} was not found`,
            field: 'postId',
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
    // Находим лайк статус поста пользователя
    const foundLikeStatusOfUser =
      await this.postLikeStatusRepository.findLikeStatusOfUser(userId, postId);
    // Если пользователь не лайкал пост, то создаем инстанс лайк статуса и добавляем его для поста
    if (!foundLikeStatusOfUser) {
      await this.postLikeStatusRepository.createLikeStatus({
        likeStatus,
        userId: foundUser.id,
        postId: postId,
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
    // Если лайк статус пользователя равен переданому лайк статусу не производим обновление лайк статуса
    if (foundLikeStatusOfUser.likeStatus === likeStatus) {
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [{ message: `Like status update` }],
      };
    }
    // Обновляем лайк статус
    await this.postLikeStatusRepository.updateLikeStatus({
      likeStatus,
      userId: foundUser.id,
      postId,
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
