import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { BanRepository } from '../../ban/ban.repository';
import { BlogRepository } from '../../blog/blog.repository';
import { UserRepository } from '../../user/user.repository';

import { BanUserDto } from '../dto/blog.dto';

export class BanUserForBlogCommand {
  constructor(
    public authUserId: string,
    public userId: string,
    public banUserDto: BanUserDto,
  ) {}
}

@CommandHandler(BanUserForBlogCommand)
export class BanUserForBlogUseCase
  implements ICommandHandler<BanUserForBlogCommand>
{
  constructor(
    private readonly banRepository: BanRepository,
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Бан пользователя для блога
  async execute(command: BanUserForBlogCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { authUserId, userId, banUserDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(banUserDto, BanUserDto);
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Получаем поля из DTO
    const { blogId, isBanned, banReason } = banUserDto;
    // Ищем блогера
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Проверяем принадлежит ли блог пользователю
    if (foundBlog.userId !== authUserId) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Ищем забаненного пользователя в базе
    const foundBanUserForBlog = await this.banRepository.findBanUserForBlogById(
      userId,
      blogId,
    );
    // Если забаненного пользователя в базе нет, создаем его
    if (!foundBanUserForBlog) {
      // Создаем документ забаненного пользователя
      await this.banRepository.createBanUserForBlogId({
        userId: foundUser.id,
        blogId: foundBlog.id,
        isBanned,
        banReason,
      });
    } else {
      // Обновляем статус бана пользователя
      await this.banRepository.updateBanUserForBlogId(
        userId,
        blogId,
        isBanned,
        banReason,
      );
    }
    // Возвращаем идентификатор созданного блогера и статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
