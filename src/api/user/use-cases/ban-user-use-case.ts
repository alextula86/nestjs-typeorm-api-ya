import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { validateOrRejectModel } from '../../../validate';
import { validateUUID } from '../../../utils';

import { DeviceSqlRepository } from '../../device/device.sql.repository';
import { CommentRepository } from '../../comment/comment.repository';
import { PostLikeStatusRepository } from '../../postLikeStatus/postLikeStatus.repository';
import { CommentLikeStatusRepository } from '../../commentLikeStatus/commentLikeStatus.repository';

import { UserRepository } from '../user.repository';
import { BanUserDto } from '../dto/user.dto';

export class BanUserCommand {
  constructor(public userId: string, public banUserDto: BanUserDto) {}
}

@CommandHandler(BanUserCommand)
export class BanUserUseCase implements ICommandHandler<BanUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly deviceSqlRepository: DeviceSqlRepository,
    private readonly commentRepository: CommentRepository,
    private readonly postLikeStatusRepository: PostLikeStatusRepository,
    private readonly commentLikeStatusRepository: CommentLikeStatusRepository,
  ) {}
  // Бан пользователя
  async execute(command: BanUserCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, banUserDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(banUserDto, BanUserDto);
    // Проверяем является ли идентификатор пользователя UUID
    if (!validateUUID(userId)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Получаем поля из DTO
    const { isBanned, banReason } = banUserDto;
    // Проверяем добавлен ли пользователь с переданным идентификатором
    const foundUserById = await this.userRepository.findUserById(userId);
    // Если пользователь с переданным идентификатором не добавлен в базе, возвращаем ошибку 404
    if (!foundUserById) {
      return { statusCode: HttpStatus.UNAUTHORIZED };
    }
    // Баним пользователя
    await this.userRepository.banUser(isBanned, banReason, foundUserById.id);
    // Банним комментарии пользователя
    await this.commentRepository.banCommentsByUserId(userId, isBanned);
    // Банним лайк статусы постов пользователя
    await this.postLikeStatusRepository.banUserLikeStatuses(userId, isBanned);
    // Банним лайк статусы комментарий пользователя
    await this.commentLikeStatusRepository.banUserLikeStatuses(
      userId,
      isBanned,
    );
    // Удаляем все устройства пользователя
    await this.deviceSqlRepository.deleteAllUserDevices(userId);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
