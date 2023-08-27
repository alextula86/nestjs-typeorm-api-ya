import {
  Controller,
  Get,
  Req,
  Query,
  Param,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
  Delete,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthPublicGuard, AuthBearerGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import { PostQueryRepository } from '../post/post.query.repository';
import { PostViewModel, QueryPostModel } from '../post/types';

import {
  BlogSubscribeCommand,
  BlogUnSubscribeCommand,
} from '../blogSubscription/use-cases';

import { BlogService } from './blog.service';
import { BlogQueryRepository } from './blog.query.repository';
import { QueryBlogModel, BlogViewModel } from './types';

@Controller('api/blogs')
export class BlogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogService: BlogService,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly blogQueryRepository: BlogQueryRepository,
  ) {}
  // Получение списка блогеров
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllBlogs(
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryBlogModel,
  ): Promise<ResponseViewModelDetail<BlogViewModel>> {
    const allBlogs = await this.blogQueryRepository.findAllBlogs({
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    });

    return allBlogs;
  }
  // Получение конкретного блогера по его идентификатору
  @Get(':blogId')
  @HttpCode(HttpStatus.OK)
  // Получаем конкретного блогера по его идентификатору
  async findBlogById(@Param('blogId') blogId: string): Promise<BlogViewModel> {
    // Получаем блдогера по идентификатору
    const foundBlog = await this.blogQueryRepository.findBlogById(blogId);
    // Если блог не найден возвращаем ошибку
    if (!foundBlog) {
      throw new NotFoundException();
    }
    // Возвращаем блогера в формате ответа пользователю
    return foundBlog;
  }
  // Получение списка постов по идентификатору блогера
  @Get(':blogId/posts')
  @UseGuards(AuthPublicGuard)
  @HttpCode(HttpStatus.OK)
  // Получение списка постов конкретного блогера
  async findPostsByBlogId(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryPostModel,
  ): Promise<ResponseViewModelDetail<PostViewModel>> {
    // Если идентификатор блогера не передан возвращаем ошибку 404
    if (!blogId) {
      throw new NotFoundException();
    }
    // Получаем блогера по идентификатору
    const foundBlog = await this.blogService.findBlogById(blogId);
    // Если блогер не найден возвращаем ошибку
    if (!foundBlog) {
      throw new NotFoundException();
    }
    // Получаем пост по идентификатору блогера
    const postsByBlogId = await this.postQueryRepository.findPostsByBlogId(
      blogId,
      request.userId,
      {
        searchNameTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      },
    );

    return postsByBlogId;
  }
  // Подписаться на блог
  @Post(':blogId/subscription')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async blogSubscription(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
  ): Promise<void> {
    // Подписываемся на блог
    const { statusCode } = await this.commandBus.execute(
      new BlogSubscribeCommand(request.userId, blogId),
    );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
  }
  // Отписаться от блога
  @Delete(':blogId/subscription')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async blogUnSubscription(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
  ): Promise<void> {
    // Отписываемся от блога
    const { statusCode } = await this.commandBus.execute(
      new BlogUnSubscribeCommand(request.userId, blogId),
    );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
  }
}
