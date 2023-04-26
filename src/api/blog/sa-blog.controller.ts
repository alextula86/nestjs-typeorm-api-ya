import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthdBasicGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import { BanBlogCommand, BindWithUserBlogCommand } from './use-cases';
import { BlogQueryRepository } from './blog.query.repository';
import { BanBlogDto } from './dto';
import { BlogViewAdminModel, QueryBlogModel } from './types';

@UseGuards(AuthdBasicGuard)
@Controller('api/sa/blogs')
export class SABlogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogQueryRepository: BlogQueryRepository,
  ) {}
  // Получение списка блогеров
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllBlogsForAdmin(
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryBlogModel,
  ): Promise<ResponseViewModelDetail<BlogViewAdminModel>> {
    const allBlogsByUserId =
      await this.blogQueryRepository.findAllBlogsForAdmin({
        searchNameTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      });

    return allBlogsByUserId;
  }
  // Привязка пользователя к блогу
  @Put(':blogId/bind-with-user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bindWithUser(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ): Promise<boolean> {
    // Обновляем блогера
    const { statusCode } = await this.commandBus.execute(
      new BindWithUserBlogCommand(userId, blogId),
    );
    // Если при привязки пользователя к блогу, блог не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Возвращаем статус 204
    return true;
  }
  // Бан блогера
  @Put(':blogId/ban/')
  @HttpCode(HttpStatus.NO_CONTENT)
  async banBlog(
    @Param('blogId') blogId: string,
    @Body() banBlogDto: BanBlogDto,
  ): Promise<boolean> {
    // Баним блогера
    const { statusCode } = await this.commandBus.execute(
      new BanBlogCommand(blogId, banBlogDto),
    );
    // Если при обновлении блогера, он не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Возвращаем статус 204
    return true;
  }
}
