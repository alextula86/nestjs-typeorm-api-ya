import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthBearerGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import {
  CreatePostsCommand,
  UpdatePostCommand,
  DeletePostCommand,
} from '../post/use-cases';
import { PostQueryRepository } from '../post/post.query.repository';
import { CreatePostDto, UpdatePostDto } from '../post/dto/post.dto';
import { PostViewModel } from '../post/types';

import { CommentQueryRepository } from '../comment/comment.query.repository';
import { QueryCommentModel, CommentByPostViewModel } from '../comment/types';

import { BanQueryRepository } from '../ban/ban.query.repository';
import { QueryVannedUserModel, BannedUserViewModel } from '../ban/types';

import { WallpaperQueryRepository } from '../wallpaper/wallpaper.query.repository';
import { SaveWallpaperByBlogCommand } from '../wallpaper/use-cases';
import { WallpaperViewModel } from '../wallpaper/types';

import { BlogMainImageQueryRepository } from '../blogMainImage/blogMainImage.query.repository';
import { SaveBlogMainImageCommand } from '../blogMainImage/use-cases';
import { BlogMainImageViewModel } from '../blogMainImage/types';

import { PostMainImageQueryRepository } from '../postMainImage/postMainImage.query.repository';
import { SavePostMainImageCommand } from '../postMainImage/use-cases';
import { PostMainImageViewModel } from '../postMainImage/types';

import {
  CreateBlogCommand,
  DeleteBlogCommand,
  UpdateBlogCommand,
  BanUserForBlogCommand,
} from './use-cases';
import { BlogService } from './blog.service';
import { BlogQueryRepository } from './blog.query.repository';
import { BanUserDto, CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { BlogViewModel, QueryBlogModel } from './types';

@UseGuards(AuthBearerGuard)
@Controller('api/blogger')
export class BloggerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogService: BlogService,
    private readonly blogQueryRepository: BlogQueryRepository,
    private readonly commentQueryRepository: CommentQueryRepository,
    private readonly banQueryRepository: BanQueryRepository,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly wallpaperQueryRepository: WallpaperQueryRepository,
    private readonly blogMainImageQueryRepository: BlogMainImageQueryRepository,
    private readonly postMainImageQueryRepository: PostMainImageQueryRepository,
  ) {}
  // Получение списка блогеров привязанных к пользователю
  @Get('blogs')
  @HttpCode(HttpStatus.OK)
  async findAllBlogsByUserId(
    @Req() request: Request & { userId: string },
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryBlogModel,
  ): Promise<ResponseViewModelDetail<BlogViewModel>> {
    const allBlogsByUserId =
      await this.blogQueryRepository.findAllBlogsByUserId(request.userId, {
        searchNameTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      });

    return allBlogsByUserId;
  }
  // Получение списка комментария по всем постам блогера
  @HttpCode(HttpStatus.OK)
  @Get('blogs/comments')
  async findCommentsByAllPosts(
    @Req() request: Request & { userId: string },
    @Query()
    { pageNumber, pageSize, sortBy, sortDirection }: QueryCommentModel,
  ): Promise<ResponseViewModelDetail<CommentByPostViewModel>> {
    const commentsByAllPosts =
      await this.commentQueryRepository.findCommentsByAllPosts(request.userId, {
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      });

    return commentsByAllPosts;
  }
  // Создание блогера
  @Post('blogs')
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Req() request: Request & { userId: string },
    @Body() createBlogDto: CreateBlogDto,
  ): Promise<BlogViewModel> {
    // Создаем блогера
    const { blogId, statusCode } = await this.commandBus.execute(
      new CreateBlogCommand(request.userId, createBlogDto),
    );
    // Если при создании блогера возникли ошибки возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Порлучаем созданный блог в формате ответа пользователю
    const foundBlog = await this.blogQueryRepository.findBlogById(
      blogId,
      request.userId,
    );
    // Возвращаем созданного блогера
    return foundBlog;
  }
  // Обновление блогера
  @Put('blogs/:blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ): Promise<boolean> {
    // Обновляем блогера
    const { statusCode } = await this.commandBus.execute(
      new UpdateBlogCommand(request.userId, blogId, updateBlogDto),
    );
    // Если при обновлении блогера, он не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли обновляемый комментарий пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Возвращаем статус 204
    return true;
  }
  // Удаление блогера
  @Delete('blogs/:blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
  ): Promise<boolean> {
    // Удаляем блогера
    const { statusCode } = await this.commandBus.execute(
      new DeleteBlogCommand(request.userId, blogId),
    );
    // Если при удалении блогера, он не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли обновляемый комментарий пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Возвращаем статус 204
    return true;
  }
  // Создание поста
  @Post('blogs/:blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPostsByBlogId(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Body() сreatePostDto: CreatePostDto,
  ): Promise<PostViewModel> {
    // Создаем пост
    const { postId, statusCode } = await this.commandBus.execute(
      new CreatePostsCommand(request.userId, blogId, сreatePostDto),
    );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли добавляемый пост пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Порлучаем созданный пост в формате ответа пользователю
    const foundPost = await this.postQueryRepository.findPostById(postId, null);
    // Возвращаем созданный пост
    return foundPost;
  }
  // Обновление поста
  @Put('blogs/:blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<void> {
    // Обновляем пост
    const { statusCode } = await this.commandBus.execute(
      new UpdatePostCommand(request.userId, blogId, postId, updatePostDto),
    );
    // Если пост не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли блогер обновляемого поста пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
  }
  // Удаление поста
  @Delete('blogs/:blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    // Удаляем пост и связанные с ним комментарии
    const { statusCode } = await this.commandBus.execute(
      new DeletePostCommand(request.userId, blogId, postId),
    );
    // Если пост не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли блогер удаляемого поста пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
  }
  // Получение списка забаненных пользователей для блогера
  @Get('users/blog/:blogId')
  @HttpCode(HttpStatus.OK)
  async findAllBannedUsersForBlog(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Query()
    {
      searchLoginTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryVannedUserModel,
  ): Promise<ResponseViewModelDetail<BannedUserViewModel>> {
    // Проверяем существование блогера
    const foundBlog = await this.blogService.findBlogById(blogId);
    // Если блогер не существует, возвращаем ошибку 404
    if (!foundBlog) {
      throw new NotFoundException();
    }
    // Проверяем принадлежит ли блог пользователю
    if (foundBlog.userId !== request.userId) {
      throw new ForbiddenException();
    }
    // Ищем всех забаненных пользователь для конкретного блога
    const allBannedUsersForBlog =
      await this.banQueryRepository.findAllBannedUsersForBlog(blogId, {
        searchLoginTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      });

    return allBannedUsersForBlog;
  }
  // Бан пользователя для блога
  @Put('users/:userId/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUserForBlog(
    @Req() request: Request & { userId: string },
    @Param('userId') userId: string,
    @Body() banUserDto: BanUserDto,
  ): Promise<void> {
    const authUserId = request.userId;
    // Обновляем бан пользователя для блога
    const { statusCode } = await this.commandBus.execute(
      new BanUserForBlogCommand(authUserId, userId, banUserDto),
    );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если блог не принадлежит авторизованному пользователю, возвращаем ошибку 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
  }
  // Загрузка картинки обоев для блогера
  @Post('blogs/:blogId/images/wallpaper')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async UploadWallpaperByBlogId(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<WallpaperViewModel> {
    // Сохраняем загруженную картинку обоев для блогера
    const { wallpaperId, statusCode, statusMessage } =
      await this.commandBus.execute(
        new SaveWallpaperByBlogCommand(request.userId, blogId, file),
      );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Если возникли ошибки валидации файла, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
    // Порлучаем созданную запись по картинке в формате ответа пользователю
    const foundWallpaper =
      await this.wallpaperQueryRepository.findBloggerImages(
        blogId,
        wallpaperId,
      );
    // Возвращаем созданную запись по картинке
    return foundWallpaper;
  }
  // Загрузка иконки для блогера
  @Post('blogs/:blogId/images/main')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async UploadMainImagesByBlogId(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BlogMainImageViewModel> {
    // Сохраняем загруженную иконку для блогера
    const { blogMainImageId, statusCode, statusMessage } =
      await this.commandBus.execute(
        new SaveBlogMainImageCommand(request.userId, blogId, file),
      );
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Если возникли ошибки валидации файла, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
    // Порлучаем созданную запись по иконке в формате ответа пользователю
    const foundBlogMainImage =
      await this.blogMainImageQueryRepository.findBloggerImages(
        blogId,
        blogMainImageId,
      );
    // Возвращаем созданную запись по иконке
    return foundBlogMainImage;
  }
  // Загрузка иконки для поста
  @Post('blogs/:blogId/posts/:postId/images/main')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async UploadMainImagesByPostId(
    @Req() request: Request & { userId: string },
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostMainImageViewModel> {
    // Сохраняем загруженную иконку для поста
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new SavePostMainImageCommand(request.userId, blogId, postId, file),
    );
    // Если пост не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если блогер не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Проверяем принадлежит ли обновляемый блогер пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Если возникли ошибки валидации файла, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
    // Порлучаем созданную запись по иконке в формате ответа пользователю
    const foundPostMainImages =
      await this.postMainImageQueryRepository.findPostImages(postId);
    // Возвращаем созданную запись по иконке
    return foundPostMainImages;
  }
}
