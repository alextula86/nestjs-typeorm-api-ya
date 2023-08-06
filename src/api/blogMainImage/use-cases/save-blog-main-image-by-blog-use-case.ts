import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { S3StorageAdapter, SharpAdapter } from '../../../adapters';
import { MessageType } from '../../../types';

import { BlogRepository } from '../../blog/blog.repository';
import { UserRepository } from '../../user/user.repository';

import { BlogMainImageRepository } from '../blogMainImage.repository';

export class SaveBlogMainImageByBlogCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public file: Express.Multer.File,
  ) {}
}

@CommandHandler(SaveBlogMainImageByBlogCommand)
export class SaveBlogMainImageByBlogUseCase
  implements ICommandHandler<SaveBlogMainImageByBlogCommand>
{
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRepository: UserRepository,
    private readonly blogMainImageRepository: BlogMainImageRepository,
    private readonly s3StorageAdapter: S3StorageAdapter,
    private readonly sharpAdapter: SharpAdapter,
  ) {}
  // Загрузка иконки для блогера
  async execute(command: SaveBlogMainImageByBlogCommand): Promise<{
    blogMainImageId: string;
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    const { userId, blogId, file } = command;
    // Ищем блогера, к которому прикреплен иконку
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return {
        blogMainImageId: null,
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `blog with id ${blogId} was not found`,
            field: 'blogId',
          },
        ],
      };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 403
    if (isEmpty(foundUser)) {
      return {
        blogMainImageId: null,
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [
          {
            message: `User was not found`,
            field: 'userId',
          },
        ],
      };
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю,
    // Если не принадлежит возвращаем ошибку 403
    if (foundBlog.userId !== foundUser.id) {
      return {
        blogMainImageId: null,
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [
          {
            message: `The blog does not belong to the user`,
            field: 'userId',
          },
        ],
      };
    }
    // Массив для хранения ошибок валидации картинки
    const messages: MessageType[] = [] as unknown as MessageType[];
    // Получаем метадату картинки
    const metadata = await this.sharpAdapter.metadataFile(file.buffer);
    // Если размер картинки превышает 100KB, возвращаем ошибку 400
    if (metadata.size > 100000) {
      messages.push({
        message: `The image size should not exceed 100 KB`,
        field: 'file',
      });
    }
    // Если ширина картинки не равна 156px, возвращаем ошибку 400
    if (metadata.width !== 156) {
      messages.push({
        message: `The image width should be equal to 156 px`,
        field: 'file',
      });
    }
    // Если ширина картинки не равна 156px, возвращаем ошибку 400
    if (metadata.height !== 156) {
      messages.push({
        message: `The image height should be equal to 156 px`,
        field: 'file',
      });
    }
    // Если формат картинки не равен png, jpg, jpeg, возвращаем ошибку 400
    if (!['png', 'jpg', 'jpeg'].includes(metadata.format)) {
      messages.push({
        message: `The file format must be png or jpg or jpeg`,
        field: 'file',
      });
    }
    /*if (!isEmpty(messages)) {
      return {
        blogMainImageId: null,
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: messages,
      };
    }*/
    // Конвертируем буфер картинки в формат webp для хранения на сервере
    const webp = await this.sharpAdapter.convertToWebP(file.buffer);
    // Формируем урл картинки
    const url = `content/blogs_mains/${blogId}/${blogId}_main`;
    // Сохраняем картинку в storage s3
    await this.s3StorageAdapter.saveImage(webp, url);
    // Ищем картинку для текущего блогера
    const fondBlogMainImageByBlogId =
      await this.blogMainImageRepository.findBlogMainImageByBlogId(blogId);
    // Если картинка найдена, то обновляем ее в базе, чтобы не плодить разные картинки для одного блогера
    if (!isEmpty(fondBlogMainImageByBlogId)) {
      await this.blogMainImageRepository.updateBlogMainImageByBlogId(
        fondBlogMainImageByBlogId.id,
        {
          url,
          width: metadata.width,
          height: metadata.height,
          fileSize: metadata.size,
        },
      );

      return {
        blogMainImageId: fondBlogMainImageByBlogId.id,
        statusCode: HttpStatus.CREATED,
        statusMessage: [{ message: `File saved` }],
      };
    }
    // Если картинка для блогера не найдена, то сохраняем ее в базе
    const createdBlogMainImage =
      await this.blogMainImageRepository.createBlogMainImageByBlogId({
        url,
        width: metadata.width,
        height: metadata.height,
        fileSize: metadata.size,
        blogId: foundBlog.id,
        userId: foundUser.id,
      });

    // Возвращаем идентификатор сохраненной картинки обоев для бллогера
    return {
      blogMainImageId: createdBlogMainImage.id,
      statusCode: HttpStatus.CREATED,
      statusMessage: [{ message: `File saved` }],
    };
  }
}
