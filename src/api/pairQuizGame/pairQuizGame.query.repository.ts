import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { GameStatuses } from '../../types';
import { PairQuizGameQuestionType, PairQuizGameViewModel } from './types';
import { isEmpty } from 'lodash';

@Injectable()
export class PairQuizGameQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findMyCurrentPairQuizGame(
    userId: string,
  ): Promise<PairQuizGameViewModel> {
    const query = `
      SELECT 
        pqg."id", 
        pqg."pairCreatedDate", 
        pqg."startGameDate",
        pqg."finishGameDate",
        pqg."status",
        fp."id" as "firstPlayerId",
        fp."login" as "firstPlayerLogin",
        sp."id" as "secondPlayerId",
        sp."login" as "secondPlayerLogin",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              qq."id",
              qq."body"
            FROM quiz_questions AS qq
          ) e
        ) as "questions"
      FROM pair_quiz_game AS pqg
      LEFT JOIN users AS fp ON fp."id" = pqg."firstPlayerId"
      LEFT JOIN users AS sp ON sp."id" = pqg."secondPlayerId"
      WHERE ("firstPlayerId" = '${userId}' OR "secondPlayerId" = '${userId}')
      AND ("status" = '${GameStatuses.ACTIVE}' OR "status" = '${GameStatuses.PENDINGSECONDPLAYER}')
    `;

    const myCurrentPairQuizGame = await this.dataSource.query(query);

    if (isEmpty(myCurrentPairQuizGame)) {
      return null;
    }

    return this._getPairQuizGameViewModel(myCurrentPairQuizGame[0]);
  }
  async findPairQuizGameById(
    pairQuizGameId: string,
  ): Promise<PairQuizGameViewModel> {
    const query = `
      SELECT 
        pqg."id", 
        pqg."pairCreatedDate", 
        pqg."startGameDate",
        pqg."finishGameDate",
        pqg."status",
        fp."id" as "firstPlayerId",
        fp."login" as "firstPlayerLogin",
        sp."id" as "secondPlayerId",
        sp."login" as "secondPlayerLogin",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              qq."id",
              qq."body"
            FROM quiz_questions AS qq
          ) e
        ) as "questions"
      FROM pair_quiz_game AS pqg
      LEFT JOIN users AS fp ON fp."id" = pqg."firstPlayerId"
      LEFT JOIN users AS sp ON sp."id" = pqg."secondPlayerId"
      WHERE pqg."id" = '${pairQuizGameId}'
    `;

    const foundPairQuizGameById = await this.dataSource.query(query);

    if (isEmpty(foundPairQuizGameById)) {
      return null;
    }

    return this._getPairQuizGameViewModel(foundPairQuizGameById[0]);
  }
  _getPairQuizGameViewModel(pairQuizGame: any): PairQuizGameViewModel {
    return {
      id: pairQuizGame.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: pairQuizGame.firstPlayerId,
          login: pairQuizGame.firstPlayerLogin,
        },
        score: 0,
      },
      secondPlayerProgress: pairQuizGame.secondPlayerId
        ? {
            answers: [],
            player: {
              id: pairQuizGame.secondPlayerId,
              login: pairQuizGame.secondPlayerLogin,
            },
            score: 0,
          }
        : null,
      questions: !isEmpty(pairQuizGame.questions)
        ? pairQuizGame.questions.map((i: PairQuizGameQuestionType) => ({
            id: i.id,
            body: i.body,
          }))
        : null,
      status: pairQuizGame.status,
      pairCreatedDate: pairQuizGame.pairCreatedDate,
      startGameDate: pairQuizGame.startGameDate,
      finishGameDate: pairQuizGame.finishGameDate,
    };
  }
}
