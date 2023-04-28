import {
  Controller,
  Get,
  Put,
  Delete,
  Req,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthBearerGuard, AuthPublicGuard } from '../../guards';

// import { UpdateLikeStatusCommentCommand } from '../likeStatus/use-cases';
// import { AddLikeStatusDTO } from '../likeStatus/dto';

import { UpdateCommentCommand, DeleteCommentCommand } from './use-cases';
import { CommentQueryRepository } from './comment.query.repository';
import { UpdateCommentDto } from './dto';
import { CommentViewModel } from './types';

@Controller('api/comments')
export class CommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly commentQueryRepository: CommentQueryRepository,
  ) {}
  // Получение конкретного комментария по его идентификатору
  @Get(':commentId')
  @UseGuards(AuthPublicGuard)
  @HttpCode(HttpStatus.OK)
  async findCommentById(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
  ): Promise<CommentViewModel> {
    // Получаем комментарий по идентификатору
    const foundComment = await this.commentQueryRepository.findCommentById(
      commentId,
      request.userId,
    );
    // Если комментарий не найден возвращаем ошибку 404
    if (!foundComment) {
      throw new NotFoundException();
    }
    // Возвращаем комментарий в формате ответа пользователю
    return foundComment;
  }
  // Обновление комментария
  @Put(':commentId')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<boolean> {
    // Обновляем комментарий
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new UpdateCommentCommand(request.userId, commentId, updateCommentDto),
    );
    // Если комментарий не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если пользователь не найден, возвращаем ошибку 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Проверяем принадлежит ли обновляемый комментарий пользователю
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException(statusMessage);
    }
    // Иначе возвращаем статус 204
    return true;
  }
  // Удаление комментария
  @Delete(':commentId')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCommentById(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
  ): Promise<boolean> {
    // Удаляем комментарий
    const { statusCode } = await this.commandBus.execute(
      new DeleteCommentCommand(commentId, request.userId),
    );

    // Если комментарий не найден, возвращаем ошиюку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Если удаляется комментарий, который не принадлежит пользователю
    // Возвращаем 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Иначе возвращаем статус 204
    return true;
  }
  // Обновление лайк статуса комментария
  /*@Put(':commentId/like-status')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCommentLikeStatus(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
    @Body() addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<void> {
    // Обновляем лайк статус комментария
    const { statusCode, statusMessage } = await this.commandBus.execute(
      new UpdateLikeStatusCommentCommand(
        request.userId,
        commentId,
        addLikeStatusDTO,
      ),
    );

    // Если комментарий не найден, возращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }

    // Если при обновлении лайк статуса комментария возникли ошибки
    // Возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }*/
}
