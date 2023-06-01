import {
  Controller,
  Get,
  Post,
  Req,
  // Body,
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
import { PairQuizGameQueryRepository } from './pairQuizGame.query.repository';
import { PairQuizGameViewModel } from './types';

@UseGuards(AuthBearerGuard)
@Controller('api/pair-game-quiz/pairs')
export class PairQuizGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pairQuizGameQueryRepository: PairQuizGameQueryRepository,
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

    return myCurrentPairQuizGame;
  }
  // Получание игровой пары по идентификатору
  @Get(':pairQuizGameId')
  @HttpCode(HttpStatus.OK)
  async findPairQuizGameById(
    @Param('pairQuizGameId') pairQuizGameId: string,
  ): Promise<PairQuizGameViewModel> {
    const foundPairQuizGameById =
      await this.pairQuizGameQueryRepository.findPairQuizGameById(
        pairQuizGameId,
      );

    if (!foundPairQuizGameById) {
      throw new NotFoundException();
    }

    return foundPairQuizGameById;
  }
  // Подключение текущего пользователя к существующей игровой паре
  // Или создание новой игровой пары, которая будет ждать второго игрока
  @Post('connection')
  @HttpCode(HttpStatus.CREATED)
  async connectionPairQuizGame(
    @Req() request: Request & { userId: string },
  ): Promise</*PairQuizGameViewModel*/ any> {
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
}
