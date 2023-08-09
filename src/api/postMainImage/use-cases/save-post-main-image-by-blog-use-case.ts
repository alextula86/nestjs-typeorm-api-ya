import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { S3StorageAdapter, SharpAdapter } from '../../../adapters';
import { MessageType, PostMainImageType } from '../../../types';

import { UserRepository } from '../../user/user.repository';
import { BlogRepository } from '../../blog/blog.repository';
import { PostRepository } from '../../post/post.repository';

import { PostMainImageRepository } from '../postMainImage.repository';

export class SavePostMainImageCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postId: string,
    public file: Express.Multer.File,
  ) {}
}

@CommandHandler(SavePostMainImageCommand)
export class SavePostMainImageUseCase
  implements ICommandHandler<SavePostMainImageCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly blogRepository: BlogRepository,
    private readonly postRepository: PostRepository,
    private readonly postMainImageRepository: PostMainImageRepository,
    private readonly s3StorageAdapter: S3StorageAdapter,
    private readonly sharpAdapter: SharpAdapter,
  ) {}
  // Загрузка иконки для поста
  async execute(command: SavePostMainImageCommand): Promise<{
    statusCode: HttpStatus;
    statusMessage: MessageType[];
  }> {
    const { userId, blogId, postId, file } = command;
    // Ищем пост по идентификатору
    const foundPost = await this.postRepository.findPostById(postId);
    // Если пост не найден возвращаем ошибку 404
    if (!foundPost) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `post with id ${postId} was not found`,
            field: 'postId',
          },
        ],
      };
    }
    // Ищем блогера, к которому прикреплен иконку
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 404
    if (isEmpty(foundBlog)) {
      return {
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
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [
          {
            message: `User was not found`,
            field: 'userId',
          },
        ],
      };
    }
    // Проверяем принадлежит блогер обновляемого поста пользователю
    // Если не принадлежит возвращаем ошибку 403
    if (foundBlog.userId !== foundUser.id) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [
          {
            message: `The blog does not belong to the user`,
            field: 'userId',
          },
        ],
      };
    }
    // Массив для хранения ошибок валидации иконки
    const messages: MessageType[] = [] as unknown as MessageType[];
    // Получаем метадату иконки
    const metadata = await this.sharpAdapter.metadataFile(file.buffer);
    // Если размер иконки превышает 100KB, возвращаем ошибку 400
    if (metadata.size > 100000) {
      messages.push({
        message: `The image size should not exceed 100 KB`,
        field: 'file',
      });
    }
    // Если ширина иконки не равна 940px, возвращаем ошибку 400
    if (metadata.width !== 940) {
      messages.push({
        message: `The image width should be equal to 940 px`,
        field: 'file',
      });
    }
    // Если ширина иконки не равна 432px, возвращаем ошибку 400
    if (metadata.height !== 432) {
      messages.push({
        message: `The image height should be equal to 432 px`,
        field: 'file',
      });
    }
    // Если формат иконки не равен png, jpg, jpeg, возвращаем ошибку 400
    if (!['png', 'jpg', 'jpeg'].includes(metadata.format)) {
      messages.push({
        message: `The file format must be png or jpg or jpeg`,
        field: 'file',
      });
    }
    if (!isEmpty(messages)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: messages,
      };
    }
    // Конвертируем буфер original иконки в формат webp для хранения на сервере
    const webpOriginal = await this.sharpAdapter.convertToWebP(file.buffer);
    // Получаем метадату original иконки
    const metadataOriginal = await this.sharpAdapter.metadataFile(webpOriginal);
    // Формируем урл original иконки
    const urlOriginal = `content/posts_mains/${postId}/${postId}_main_original`;
    // Сохраняем иконку в storage s3
    await this.s3StorageAdapter.saveImage(webpOriginal, urlOriginal);

    // Ресайз иконки в middle варианте
    const mainMiddle = await this.sharpAdapter.resizeFile(
      file.buffer,
      300,
      180,
    );
    // Конвертируем буфер middle иконки в формат webp для хранения на сервере
    const webpMiddle = await this.sharpAdapter.convertToWebP(mainMiddle);
    // Получаем метадату middle иконки
    const metadataMiddle = await this.sharpAdapter.metadataFile(webpMiddle);
    // Формируем урл middle иконки
    const urlMiddle = `content/posts_mains/${postId}/${postId}_main_middle`;
    // Сохраняем иконку в storage s3
    await this.s3StorageAdapter.saveImage(webpMiddle, urlMiddle);

    // Ресайз иконки в small варианте
    const mainSmall = await this.sharpAdapter.resizeFile(file.buffer, 149, 96);
    // Конвертируем буфер small иконки в формат webp для хранения на сервере
    const webpSmall = await this.sharpAdapter.convertToWebP(mainSmall);
    // Получаем метадату small иконки
    const metadataSmall = await this.sharpAdapter.metadataFile(webpSmall);
    // Формируем урл small иконки
    const urlSmall = `content/posts_mains/${postId}/${postId}_main_small`;
    // Сохраняем иконку в storage s3
    await this.s3StorageAdapter.saveImage(webpSmall, urlSmall);

    // Ищем иконку для текущего поста
    const fondPostMainImages =
      await this.postMainImageRepository.findPostMainImage(postId);
    // Если иконка найдена, то обновляем ее в базе, чтобы не плодить разные иконки для одного поста
    if (!isEmpty(fondPostMainImages)) {
      await this.postMainImageRepository.updatePostMainImage(postId, {
        url: urlOriginal,
        width: metadataOriginal.width,
        height: metadataOriginal.height,
        fileSize: metadataOriginal.size,
        type: PostMainImageType.ORIGINAL,
      });

      await this.postMainImageRepository.updatePostMainImage(postId, {
        url: urlMiddle,
        width: metadataMiddle.width,
        height: metadataMiddle.height,
        fileSize: metadataMiddle.size,
        type: PostMainImageType.MIDDLE,
      });

      await this.postMainImageRepository.updatePostMainImage(postId, {
        url: urlSmall,
        width: metadataSmall.width,
        height: metadataSmall.height,
        fileSize: metadataSmall.size,
        type: PostMainImageType.SMALL,
      });

      return {
        statusCode: HttpStatus.CREATED,
        statusMessage: [{ message: `Files saved` }],
      };
    }
    // Если иконка для поста не найдена, то сохраняем ее в базе
    await this.postMainImageRepository.createPostMainImage({
      url: urlOriginal,
      width: metadataOriginal.width,
      height: metadataOriginal.height,
      fileSize: metadataOriginal.size,
      postId: foundPost.id,
      type: PostMainImageType.ORIGINAL,
    });

    await this.postMainImageRepository.createPostMainImage({
      url: urlMiddle,
      width: metadataMiddle.width,
      height: metadataMiddle.height,
      fileSize: metadataMiddle.size,
      postId: foundPost.id,
      type: PostMainImageType.MIDDLE,
    });

    await this.postMainImageRepository.createPostMainImage({
      url: urlSmall,
      width: metadataSmall.width,
      height: metadataSmall.height,
      fileSize: metadataSmall.size,
      postId: foundPost.id,
      type: PostMainImageType.SMALL,
    });

    // Возвращаем идентификатор сохраненной иконки обоев для бллогера
    return {
      statusCode: HttpStatus.CREATED,
      statusMessage: [{ message: `Files saved` }],
    };
  }
}
