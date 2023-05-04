import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthBearerGuard, AuthPublicGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import { CreateCommentCommand } from '../comment/use-cases';
import { CommentQueryRepository } from '../comment/comment.query.repository';
import { CreateCommentDto } from '../comment/dto';

import { UpdateLikeStatusPostCommand } from '../postLikeStatus/use-cases';
import { AddLikeStatusDTO } from '../postLikeStatus/dto';

import { PostService } from './post.service';
import { PostQueryRepository } from './post.query.repository';
import { PostViewModel, QueryPostModel } from './types';
import { CommentViewModel, QueryCommentModel } from '../comment/types';

@Controller('api/posts')
export class PostController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postService: PostService,
    private readonly commentQueryRepository: CommentQueryRepository,
    private readonly postQueryRepository: PostQueryRepository,
  ) {}
  @Get()
  @UseGuards(AuthPublicGuard)
  @HttpCode(HttpStatus.OK)
  // Получение списка постов
  async findAllPosts(
    @Req() request: Request & { userId: string },
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryPostModel,
  ): Promise<ResponseViewModelDetail<PostViewModel>> {
    const allPosts = await this.postQueryRepository.findAllPosts(
      request.userId,
      {
        searchNameTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      },
    );

    return allPosts;
  }
  // Получение конкретного поста по его идентификатору
  @Get(':postId')
  @UseGuards(AuthPublicGuard)
  @HttpCode(HttpStatus.OK)
  async findPostById(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
  ): Promise<PostViewModel> {
    // Получаем конкретный пост по его идентификатору
    const foundPost = await this.postQueryRepository.findPostById(
      postId,
      request.userId,
    );
    // Если пост не найден возвращаем ошибку 404
    if (!foundPost) {
      throw new NotFoundException();
    }
    // Возвращаем пост в формате ответа пользователю
    return foundPost;
  }
  // Получение списка комментариев по идентификатору поста
  @Get(':postId/comments')
  @UseGuards(AuthPublicGuard)
  @HttpCode(HttpStatus.OK)
  // Получение списка постов конкретного блогера
  async findCommentsByPostId(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Query()
    { pageNumber, pageSize, sortBy, sortDirection }: QueryCommentModel,
  ): Promise<ResponseViewModelDetail<CommentViewModel>> {
    // Ищем пост по идентификатору
    const foundPost = await this.postService.findPostById(postId);
    // Если блог не найден возвращаем ошибку
    if (!foundPost) {
      throw new NotFoundException();
    }

    const commentsByPostId =
      await this.commentQueryRepository.findCommentsByPostId(
        postId,
        request.userId,
        {
          pageNumber,
          pageSize,
          sortBy,
          sortDirection,
        },
      );

    return commentsByPostId;
  }
  // Создание комментария
  @Post(':postId/comments')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCommentsByPostId(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentViewModel> {
    // Создаем комментарий
    const { commentId, statusCode, statusMessage } =
      await this.commandBus.execute(
        new CreateCommentCommand(request.userId, postId, createCommentDto),
      );
    // Если пост для которого создается комментарий не найден
    // Возвращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException(statusMessage);
    }
    // Если при создании комментария возникли ошибки, возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
    // Если при создании комментария пользователь не был найден или забанен,
    // Возвращаем ошибку 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException(statusMessage);
    }
    // Порлучаем созданный комментарий в формате ответа пользователю
    const foundComment = await this.commentQueryRepository.findCommentById(
      commentId,
      request.userId,
    );
    // Возвращаем созданный комментарий
    return foundComment;
  }
  // Обновление лайк статуса поста
  @Put(':postId/like-status')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCommentLikeStatus(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Body() addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<void> {
    // Обновляем лайк статус поста
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new UpdateLikeStatusPostCommand(request.userId, postId, addLikeStatusDTO),
    );
    // Если пост не найден, возращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если при обновлении лайк статуса поста возникли ошибки
    // Возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
}
