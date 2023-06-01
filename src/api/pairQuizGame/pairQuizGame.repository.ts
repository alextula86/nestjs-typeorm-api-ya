import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { GameStatuses } from '../../types';
import { PairQuizGame } from './entities';

@Injectable()
export class PairQuizGameRepository {
  constructor(
    @InjectRepository(PairQuizGame)
    private readonly pairQuizGameRepository: Repository<PairQuizGame>,
  ) {}
  async findPairQuizGameByCurrentUser(userId: string): Promise<{
    id: string;
    pairCreatedDate: Date;
    startGameDate: Date;
    finishGameDate: Date;
    status: GameStatuses;
    firstPlayerId: string;
    secondPlayerId: string;
  }> {
    const query = `
      SELECT 
        "id", 
        "pairCreatedDate", 
        "startGameDate",
        "finishGameDate",
        "status",
        "firstPlayerId",
        "secondPlayerId"
      FROM pair_quiz_game
      WHERE "firstPlayerId" = '${userId}'
      AND ("status" = '${GameStatuses.ACTIVE}' OR "status" = '${GameStatuses.PENDINGSECONDPLAYER}')
    `;

    const foundPairQuizGame = await this.pairQuizGameRepository.query(query);

    if (isEmpty(foundPairQuizGame)) {
      return null;
    }

    return foundPairQuizGame[0];
  }
  async findActivePairQuizGame(): Promise<any> {
    const query = `
      SELECT 
        "id", 
        "pairCreatedDate", 
        "startGameDate",
        "finishGameDate",
        "status",
        "firstPlayerId",
        "secondPlayerId"
      FROM pair_quiz_game
      WHERE "status" = '${GameStatuses.PENDINGSECONDPLAYER}'
      LIMIT 1
    `;

    const foundActivePairQuizGame = await this.pairQuizGameRepository.query(
      query,
    );

    if (isEmpty(foundActivePairQuizGame)) {
      return null;
    }

    return foundActivePairQuizGame[0];
  }
  async createPairQuizGame(userId: string): Promise<{
    id: string;
    pairCreatedDate: Date;
    startGameDate: Date;
    finishGameDate: Date;
    status: GameStatuses;
    firstPlayerId: string;
    secondPlayerId: string;
  }> {
    const madePairQuizGame = await this.pairQuizGameRepository
      .createQueryBuilder()
      .insert()
      .into(PairQuizGame)
      .values({ firstPlayerId: userId })
      .returning(['id'])
      .execute();

    return madePairQuizGame.raw[0];
  }
  async activatePairQuizGame(
    userId: string,
    pairQuizGameId: string,
  ): Promise<boolean> {
    await this.pairQuizGameRepository
      .createQueryBuilder()
      .update(PairQuizGame)
      .set({
        secondPlayerId: userId,
        status: GameStatuses.ACTIVE,
        startGameDate: new Date().toISOString(),
      })
      .where('id = :pairQuizGameId', { pairQuizGameId })
      .execute();

    return true;
  }
}
