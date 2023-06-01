import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { UserRepository } from '../../user/user.repository';
import { BlogRepository } from '../../blog/blog.repository';

import { PostRepository } from '../post.repository';

export class DeletePostCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postId: string,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly postRepository: PostRepository,
    // private readonly likeStatusRepository: LikeStatusRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Обновление блогера
  async execute(command: DeletePostCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { userId, blogId, postId } = command;
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
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 403
    if (isEmpty(foundUser)) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Проверяем принадлежит блогер обновляемого поста пользователю
    if (foundBlog.userId !== foundUser.id) {
      return { statusCode: HttpStatus.FORBIDDEN };
    }
    // Удаляем пост
    const isDeletePostById = await this.postRepository.deletePostById(postId);
    // Если удаление не произошло, возвращаем ошибку 404
    if (!isDeletePostById) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
