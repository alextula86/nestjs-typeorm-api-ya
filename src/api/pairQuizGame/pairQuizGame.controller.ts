import {
  Controller,
  Get,
  Post,
  Req,
  Query,
  Param,
  Body,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthBearerGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';
import { validateUUID } from '../../utils';

import { ConnectionPairQuizGameCommand } from './use-cases';
import { CreateQuizQuestionAnswerCommand } from '../quizQuestionAnswers/use-cases';
import { QuizQuestionAnswerQueryRepository } from '../quizQuestionAnswers/quizQuestionAnswer.query.repository';
import { PairQuizGameQueryRepository } from './pairQuizGame.query.repository';
import {
  QueryPairQuizGameModel,
  PairQuizGameViewModel,
  QueryTopStatisticPairQuizGame,
} from './types';
import { AnswerPairQuizGameDto } from './dto';

@Controller('api/pair-game-quiz')
export class PairQuizGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pairQuizGameQueryRepository: PairQuizGameQueryRepository,
    private readonly quizQuestionAnswerQueryRepository: QuizQuestionAnswerQueryRepository,
  ) {}
  @Get('pairs/my')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  // Получание всех активных и завершенных игр текущего пользователя
  async findMyPairQuizGames(
    @Req() request: Request & { userId: string },
    @Query()
    { pageNumber, pageSize, sortBy, sortDirection }: QueryPairQuizGameModel,
  ): Promise<ResponseViewModelDetail<PairQuizGameViewModel>> {
    const allMyPairQuizGames =
      await this.pairQuizGameQueryRepository.findMyPairQuizGames(
        request.userId,
        {
          pageNumber,
          pageSize,
          sortBy,
          sortDirection,
        },
      );

    return allMyPairQuizGames;
  }
  // Получание активной или ожидающей игровой пары пользователя
  @Get('pairs/my-current')
  @UseGuards(AuthBearerGuard)
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
  // Получание статистики игр текущего пользователя
  @Get('users/my-statistic')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  async findMyStatisticPairQuizGame(
    @Req() request: Request & { userId: string },
  ): Promise<PairQuizGameViewModel> {
    const myStatisticPairQuizGame =
      await this.pairQuizGameQueryRepository.findMyStatisticPairQuizGame(
        request.userId,
      );

    return myStatisticPairQuizGame;
  }
  // Получание статистики по всем играм - топ участников
  @Get('users/top')
  @HttpCode(HttpStatus.OK)
  async findTopStatisticPairQuizGame(
    @Query()
    { pageNumber, pageSize, sort }: QueryTopStatisticPairQuizGame,
  ): Promise<PairQuizGameViewModel> {
    const topStatisticPairQuizGame =
      await this.pairQuizGameQueryRepository.findTopStatisticPairQuizGame({
        pageNumber,
        pageSize,
        sort,
      });

    return topStatisticPairQuizGame;
  }
  // Получание игровой пары по идентификатору
  @Get('pairs/:pairQuizGameId')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  async findPairQuizGameById(
    @Req() request: Request & { userId: string },
    @Param('pairQuizGameId') pairQuizGameId: string,
  ): Promise<PairQuizGameViewModel> {
    if (!validateUUID(pairQuizGameId)) {
      throw new BadRequestException();
    }
    // Получаем игровую пару по идентификатору
    const foundPairQuizGameById =
      await this.pairQuizGameQueryRepository.findPairQuizGameById(
        pairQuizGameId,
      );
    // Если игровая пара по идентификатору не найдена, возвращаем ошибку 404
    if (!foundPairQuizGameById) {
      throw new NotFoundException();
    }
    // Если идентификатор первого игрока равен идентификатору пользователя возвращаем игровую пару
    if (
      foundPairQuizGameById.firstPlayerProgress &&
      foundPairQuizGameById.firstPlayerProgress.player.id === request.userId
    ) {
      return foundPairQuizGameById;
    }
    // Если идентификатор второго игрока равен идентификатору пользователя возвращаем игровую пару
    if (
      foundPairQuizGameById.secondPlayerProgress &&
      foundPairQuizGameById.secondPlayerProgress.player.id === request.userId
    ) {
      return foundPairQuizGameById;
    }
    // Если идентификаторы первого и второго игроков не совпадают с идентификатором пользователя,
    // Значит игровую пару запрашивает пользователь не участвующий в игре
    // Возвращаем ошибку 403
    throw new ForbiddenException();
  }
  // Подключение текущего пользователя к существующей игровой паре
  // Или создание новой игровой пары, которая будет ждать второго игрока
  @Post('pairs/connection')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
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
    const foundPairQuizGameById =
      await this.pairQuizGameQueryRepository.findPairQuizGameById(
        pairQuizGameId,
      );
    // Возвращаем подключенную игровую пару
    return foundPairQuizGameById;
  }
  @Post('pairs/my-current/answers')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  async answerPairQuizGame(
    @Req() request: Request & { userId: string },
    @Body() answerPairQuizGameDto: AnswerPairQuizGameDto,
  ): Promise</*PairQuizGameViewModel*/ any> {
    // Создаем ответ на вопрос
    const { quizQuestionAnswerId, statusCode } = await this.commandBus.execute(
      new CreateQuizQuestionAnswerCommand(
        request.userId,
        answerPairQuizGameDto,
      ),
    );
    // Если при ответе на вопрос возникли ошибки, возращаем статус ошибки 403
    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException();
    }
    // Получаем ответ на вопрос по его идентификатору
    const foundQuizQuestionAnswerById =
      await this.quizQuestionAnswerQueryRepository.findQuizQuestionAnswerById(
        quizQuestionAnswerId,
      );
    // Возвращаем ответ на вопрос
    return foundQuizQuestionAnswerById;
  }
}
