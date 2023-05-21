import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthdBasicGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import {
  CreateQuizQuestionCommand,
  DeleteQuizQuestionCommand,
  UpdateQuizQuestionCommand,
  PublishQuizQuestionCommand,
} from './use-cases';
import { QuizQuestionQueryRepository } from './quizQuestion.query.repository';
import {
  PublishQuizQuestionDto,
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
} from './dto/quiz.questions.dto';
import { QuizQuestionViewModel, QueryQuizQuestionModel } from './types';

@UseGuards(AuthdBasicGuard)
@Controller('api/sa/quiz/questions')
export class QuizQuestionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQuestionQueryRepository: QuizQuestionQueryRepository,
  ) {}
  // Получение списка вопросов для квиза привязанных к пользователю
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllQuizQuestions(
    @Query()
    {
      bodySearchTerm,
      publishedStatus,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryQuizQuestionModel,
  ): Promise<ResponseViewModelDetail<QuizQuestionViewModel>> {
    const allQuizQuestion =
      await this.quizQuestionQueryRepository.findAllQuizQuestions({
        bodySearchTerm,
        publishedStatus,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      });

    return allQuizQuestion;
  }
  // Создание вопроса для квиза
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuizQuestion(
    @Body() сreateQuizQuestionDto: CreateQuizQuestionDto,
  ): Promise<QuizQuestionViewModel> {
    // Создаем вопрос для квиза
    const { quizQuestionId, statusCode } = await this.commandBus.execute(
      new CreateQuizQuestionCommand(сreateQuizQuestionDto),
    );
    // Если при создании вопроса для квиза возникли ошибки возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException();
    }
    // Порлучаем созданный вопрос для квиза в формате ответа пользователю
    const foundQuizQuestion =
      await this.quizQuestionQueryRepository.findQuizQuestionById(
        quizQuestionId,
      );
    // Возвращаем созданнsq вопрос для квиза
    return foundQuizQuestion;
  }
  // Обновление вопроса для квиза
  @Put(':quizQuestionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuizQuestion(
    @Param('quizQuestionId') quizQuestionId: string,
    @Body() updateQuizQuestionDto: UpdateQuizQuestionDto,
  ): Promise<boolean> {
    // Обновляем вопрос для квиза
    const { statusCode } = await this.commandBus.execute(
      new UpdateQuizQuestionCommand(quizQuestionId, updateQuizQuestionDto),
    );
    // Если при обновлении вопроса для квиза, он не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Возвращаем статус 204
    return true;
  }
  // Удаление вопроса для квиза
  @Delete(':quizQuestionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuizQuestionById(
    @Param('quizQuestionId') quizQuestionId: string,
  ): Promise<boolean> {
    // Удаляем вопрос для квиза
    const { statusCode } = await this.commandBus.execute(
      new DeleteQuizQuestionCommand(quizQuestionId),
    );
    // Если при удалении вопроса для квиза, он не был найден, возвращаем 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Возвращаем статус 204
    return true;
  }
  // Публикация вопроса для квиза
  @Put(':quizQuestionId/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishQuizQuestion(
    @Param('quizQuestionId') quizQuestionId: string,
    @Body() publishQuizQuestionDto: PublishQuizQuestionDto,
  ): Promise<void> {
    // Публикуем вопрос для квиза
    const { statusCode } = await this.commandBus.execute(
      new PublishQuizQuestionCommand(quizQuestionId, publishQuizQuestionDto),
    );
    // Если вопрос для квиза не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
  }
}
