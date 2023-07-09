import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { GameStatuses } from '../../types';
import { PairQuizGame } from './entities';
import { QuizQuestions } from '../quizQuestion/entities';

@Injectable()
export class PairQuizGameRepository {
  constructor(
    @InjectRepository(PairQuizGame)
    private readonly pairQuizGameRepository: Repository<PairQuizGame>,
  ) {}
  async connectedUserToPairQuizGame(userId: string): Promise<{
    id: string;
    pairCreatedDate: Date;
    startGameDate: Date;
    finishGameDate: Date;
    status: GameStatuses;
    questions: QuizQuestions[];
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
        "questions",
        "firstPlayerId",
        "secondPlayerId"
      FROM pair_quiz_game
      WHERE ("firstPlayerId" = '${userId}' OR "secondPlayerId" = '${userId}')
      AND ("status" = '${GameStatuses.ACTIVE}' OR "status" = '${GameStatuses.PENDINGSECONDPLAYER}')
    `;

    const foundPairQuizGame = await this.pairQuizGameRepository.query(query);

    if (isEmpty(foundPairQuizGame)) {
      return null;
    }

    return foundPairQuizGame[0];
  }
  async findPendingSecondPlayerPairQuizGame(): Promise<any> {
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
  async findActivePairQuizGame(userId: string): Promise<any> {
    const query = `
      SELECT 
        pqg."id", 
        pqg."questions",
        fp."id" as "firstPlayerId",
        fp."login" as "firstPlayerLogin",
        sp."id" as "secondPlayerId",
        sp."login" as "secondPlayerLogin",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              qqa."quizQuestionId",
              qqa."answer",
              qqa."answerStatus",
              qqa."score",              
              qqa."addedAt"
            FROM quiz_question_answer AS qqa
            WHERE pqg."id" = qqa."pairQuizGameId" AND fp."id" = qqa."userId"
          ) e
        ) as "firstPlayerQuizQuestionAnswer",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              qqa."quizQuestionId",
              qqa."answerStatus",
              qqa."addedAt"
            FROM quiz_question_answer AS qqa
            WHERE pqg."id" = qqa."pairQuizGameId" AND sp."id" = qqa."userId"
          ) e
        ) as "secondPlayerQuizQuestionAnswer"       
      FROM pair_quiz_game AS pqg
      LEFT JOIN users AS fp ON fp."id" = pqg."firstPlayerId"
      LEFT JOIN users AS sp ON sp."id" = pqg."secondPlayerId"
      WHERE ("firstPlayerId" = '${userId}' OR "secondPlayerId" = '${userId}')
      AND "status" = '${GameStatuses.ACTIVE}'
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
    questions: QuizQuestions[];
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
    questions: QuizQuestions[],
  ): Promise<boolean> {
    await this.pairQuizGameRepository
      .createQueryBuilder()
      .update(PairQuizGame)
      .set({
        secondPlayerId: userId,
        questions: { quizQuestions: questions },
        status: GameStatuses.ACTIVE,
        startGameDate: new Date().toISOString(),
      })
      .where('id = :pairQuizGameId', { pairQuizGameId })
      .execute();

    return true;
  }
  async finishedPairQuizGame(pairQuizGameId: string): Promise<boolean> {
    await this.pairQuizGameRepository
      .createQueryBuilder()
      .update(PairQuizGame)
      .set({
        status: GameStatuses.FINISHED,
        finishGameDate: new Date().toISOString(),
      })
      .where('id = :pairQuizGameId', { pairQuizGameId })
      .execute();

    return true;
  }
}
