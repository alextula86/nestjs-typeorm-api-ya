import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { BlogRepository } from '../../blog/blog.repository';
import { UserRepository } from '../../user/user.repository';

import { PostRepository } from '../post.repository';
import { UpdatePostDto } from '../dto';

export class UpdatePostCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postId: string,
    public updatePostDto: UpdatePostDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление блогера
  async execute(command: UpdatePostCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId, postId, updatePostDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(updatePostDto, UpdatePostDto);
    // Ищем пост по идентификатору
    const foundPost = await this.postRepository.findPostById(postId);
    // Если пост не найден возвращаем ошибку 404
    if (!foundPost) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем блогера, к которому прикреплен пост
    const foundBlog = await this.blogRepository.findBlogById(blogId);
    // Если блогер не найден, возвращаем ошибку 400
    if (isEmpty(foundBlog)) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
      };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Проверяем принадлежит блогер обновляемого поста пользователю
    if (foundBlog.userId !== foundUser.id) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Обновляем пост
    await this.postRepository.updatePost(postId, updatePostDto);
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
