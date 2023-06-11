import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  Param,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthBearerGuard } from '../../guards';

import { ConnectionPairQuizGameCommand } from './use-cases';
import { CreateQuizQuestionAnswerCommand } from '../quizQuestionAnswers/use-cases';
import { QuizQuestionAnswerQueryRepository } from '../quizQuestionAnswers/quizQuestionAnswer.query.repository';
import { PairQuizGameQueryRepository } from './pairQuizGame.query.repository';
import { PairQuizGameViewModel } from './types';
import { AnswerPairQuizGameDto } from './dto';

@UseGuards(AuthBearerGuard)
@Controller('api/pair-game-quiz/pairs')
export class PairQuizGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pairQuizGameQueryRepository: PairQuizGameQueryRepository,
    private readonly quizQuestionAnswerQueryRepository: QuizQuestionAnswerQueryRepository,
  ) {}
  // Получание активной или ожидающей игровой пары пользователя
  @Get()
  @HttpCode(HttpStatus.OK)
  async findMyCurrentPairQuizGame(
    @Req() request: Request & { userId: string },
  ): Promise<PairQuizGameViewModel> {
    const myCurrentPairQuizGame =
      await this.pairQuizGameQueryRepository.findMyCurrentPairQuizGame(
        request.userId,
      );

    if (!myCurrentPairQuizGame) {
      throw new NotFoundException();
    }

    return myCurrentPairQuizGame;
  }
  // Получание игровой пары по идентификатору
  @Get(':pairQuizGameId')
  @HttpCode(HttpStatus.OK)
  async findPairQuizGameById(
    @Req() request: Request & { userId: string },
    @Param('pairQuizGameId') pairQuizGameId: string,
  ): Promise<PairQuizGameViewModel> {
    const { data, statusCode } =
      await this.pairQuizGameQueryRepository.findPairQuizGameById(
        request.userId,
        pairQuizGameId,
      );

    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }

    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }

    return data;
  }
  // Подключение текущего пользователя к существующей игровой паре
  // Или создание новой игровой пары, которая будет ждать второго игрока
  @Post('connection')
  @HttpCode(HttpStatus.CREATED)
  async connectionPairQuizGame(
    @Req() request: Request & { userId: string },
  ): Promise<PairQuizGameViewModel> {
    // Подключение текущего пользователя к игровой паре
    const { pairQuizGameId, statusCode } = await this.commandBus.execute(
      new ConnectionPairQuizGameCommand(request.userId),
    );
    // Если пользователь подключается к существующей с ним игровой паре, возращаем статус ошибки 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Получаем подключенную игровую пару по идентификатору
    const { data } =
      await this.pairQuizGameQueryRepository.findPairQuizGameById(
        request.userId,
        pairQuizGameId,
      );
    // Возвращаем подключенную игровую пару
    return data;
  }
  @Post('my-current/answers')
  @HttpCode(HttpStatus.CREATED)
  async answerPairQuizGame(
    @Req() request: Request & { userId: string },
    @Body() answerPairQuizGameDto: AnswerPairQuizGameDto,
  ): Promise</*PairQuizGameViewModel*/ any> {
    // Подключение текущего пользователя к игровой паре
    const { quizQuestionAnswerId, statusCode } = await this.commandBus.execute(
      new CreateQuizQuestionAnswerCommand(
        request.userId,
        answerPairQuizGameDto,
      ),
    );
    // Если пользователь подключается к существующей с ним игровой паре, возращаем статус ошибки 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }

    // Получаем подключенную игровую пару по идентификатору
    const foundQuizQuestionAnswerById =
      await this.quizQuestionAnswerQueryRepository.findQuizQuestionAnswerById(
        quizQuestionAnswerId,
      );
    // Возвращаем подключенную игровую пару
    return foundQuizQuestionAnswerById;
  }
}
