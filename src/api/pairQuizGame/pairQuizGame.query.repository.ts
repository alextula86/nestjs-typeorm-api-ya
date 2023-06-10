import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import { GameStatuses } from '../../types';
import { PairQuizGameQuestionType, PairQuizGameViewModel } from './types';

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
              qqa."answerStatus",
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
        ) as "secondPlayerQuizQuestionAnswer",
        (
          SELECT SUM(qqa."score")
          FROM quiz_question_answer AS qqa
          WHERE pqg."id" = qqa."pairQuizGameId" AND fp."id" = qqa."userId"
        ) as "firstPlayerScore",
        (
          SELECT SUM(qqa."score")
          FROM quiz_question_answer AS qqa
          WHERE pqg."id" = qqa."pairQuizGameId" AND sp."id" = qqa."userId"
        ) as "secondPlayerScore"        
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
        pqg."questions",
        fp."id" as "firstPlayerId",
        fp."login" as "firstPlayerLogin",
        sp."id" as "secondPlayerId",
        sp."login" as "secondPlayerLogin"
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
    console.log('pairQuizGame', pairQuizGame);
    const questions = JSON.parse(pairQuizGame.questions);
    return {
      id: pairQuizGame.id,
      firstPlayerProgress: {
        answers: !isEmpty(pairQuizGame.firstPlayerQuizQuestionAnswer)
          ? pairQuizGame.firstPlayerQuizQuestionAnswer.map((i) => ({
              questionId: i.quizQuestionId,
              answerStatus: i.answerStatus,
              addedAt: i.addedAt,
            }))
          : [],
        player: {
          id: pairQuizGame.firstPlayerId,
          login: pairQuizGame.firstPlayerLogin,
        },
        score: pairQuizGame.firstPlayerScore
          ? Number(pairQuizGame.firstPlayerScore)
          : 0,
      },
      secondPlayerProgress: pairQuizGame.secondPlayerId
        ? {
            answers: !isEmpty(pairQuizGame.secondPlayerQuizQuestionAnswer)
              ? pairQuizGame.secondPlayerQuizQuestionAnswer.map((i) => ({
                  questionId: i.quizQuestionId,
                  answerStatus: i.answerStatus,
                  addedAt: i.addedAt,
                }))
              : [],
            player: {
              id: pairQuizGame.secondPlayerId,
              login: pairQuizGame.secondPlayerLogin,
            },
            score: pairQuizGame.secondPlayerScore
              ? Number(pairQuizGame.secondPlayerScore)
              : 0,
          }
        : null,
      questions: !isEmpty(questions.quizQuestions)
        ? questions.quizQuestions.map((i: PairQuizGameQuestionType) => ({
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
