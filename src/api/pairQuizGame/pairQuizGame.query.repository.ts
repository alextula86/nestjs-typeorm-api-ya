import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty, isArray } from 'lodash';

import {
  GameStatuses,
  ResultGameStatus,
  ResponseViewModelDetail,
  SortDirection,
} from '../../types';

import {
  QueryPairQuizGameModel,
  QueryTopStatisticPairQuizGame,
  PairQuizGameQuestionType,
  PairQuizGameViewModel,
} from './types';

@Injectable()
export class PairQuizGameQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findMyPairQuizGames(
    userId: string,
    {
      pageNumber,
      pageSize,
      sortBy = 'pairCreatedDate',
      sortDirection = SortDirection.DESC,
    }: QueryPairQuizGameModel,
  ): Promise<ResponseViewModelDetail<PairQuizGameViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const where = `     
      WHERE (pqg."firstPlayerId" = '${userId}' OR pqg."secondPlayerId" = '${userId}')
      AND (pqg."status" = '${GameStatuses.ACTIVE}' OR pqg."status" = '${GameStatuses.FINISHED}')
    `;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM pair_quiz_game AS pqg ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;
    const orderBy =
      sortBy === 'status'
        ? `ORDER BY "${sortBy}" ${sortDirection}, "pairCreatedDate" desc`
        : `ORDER BY "${sortBy}" ${sortDirection}`;

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
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const pairQuizGame = await this.dataSource.query(query);

    return this._getMyPairQuizGamesViewModelDetail({
      items: pairQuizGame,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
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
      WHERE pqg."id" = '${pairQuizGameId}'
    `;

    const foundPairQuizGameById = await this.dataSource.query(query);

    if (isEmpty(foundPairQuizGameById)) {
      return null;
    }

    return this._getPairQuizGameViewModel(foundPairQuizGameById[0]);
  }
  async findMyStatisticPairQuizGame(userId: string): Promise<any> {
    const query = `
      SELECT	  
        COUNT(pqg."id") AS "gamesCount",
        (
          SELECT SUM(qqa."score")
          FROM quiz_question_answer AS qqa
          WHERE qqa."userId" = '${userId}'
        ) AS "sumScore",
        (		
          SELECT AVG("sumScore") AS "avgScores"
          FROM (
            SELECT qqa."pairQuizGameId", SUM(qqa."score") AS "sumScore"
            FROM quiz_question_answer AS qqa
            WHERE qqa."userId" = '${userId}'
            GROUP BY qqa."pairQuizGameId"
          ) as "avgScores"			
        ),
        (
          SELECT COUNT(pqgr."id")
          FROM pair_quiz_game_result AS pqgr
          WHERE pqgr."userId" = '${userId}'
          AND pqgr."status" = '${ResultGameStatus.WIN}'
        ) AS "winsCount",
        (
          SELECT COUNT(pqgr."id")
          FROM pair_quiz_game_result AS pqgr
          WHERE pqgr."userId" = '${userId}'
          AND pqgr."status" = '${ResultGameStatus.LOSSES}'
        ) AS "lossesCount",
        (
          SELECT COUNT(pqgr."id")
          FROM pair_quiz_game_result AS pqgr
          WHERE pqgr."userId" = '${userId}'
          AND pqgr."status" = '${ResultGameStatus.DRAW}'
        ) AS "drawsCount"        
        FROM pair_quiz_game AS pqg
        WHERE ("firstPlayerId" = '${userId}' OR "secondPlayerId" = '${userId}')
        AND ("status" = '${GameStatuses.FINISHED}')
    `;

    const myCurrentPairQuizGame = await this.dataSource.query(query);

    return this._getPairQuizGameStaticViewModel(myCurrentPairQuizGame[0]);
  }
  async findTopStatisticPairQuizGame({
    pageNumber,
    pageSize,
    sort = '?sort=avgScores desc',
  }: QueryTopStatisticPairQuizGame): Promise<any> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const where = `     
      WHERE "pairQuizGameId" IN (SELECT id FROM pair_quiz_game WHERE status = '${GameStatuses.FINISHED}')
    `;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(DISTINCT "userId") FROM quiz_question_answer ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const formalizeSort = isArray(sort)
      ? sort
          .map((item) => `"${item.split(' ')[0]}" ${item.split(' ')[1]}`)
          .join(', ')
      : sort
          .split(' ')
          .map((item, index) => (index === 0 ? `"${item}"` : item))
          .join(' ');

    const orderBy = `ORDER BY ${formalizeSort}`;

    const query = `
      SELECT 
        DISTINCT qqa."userId" AS "userId",
        u."login" as "userLogin",
        (
          SELECT COUNT(*) as "gamesCount"
          FROM pair_quiz_game
          WHERE "firstPlayerId" = qqa."userId" OR "secondPlayerId" = qqa."userId"
        ),
        (
          SELECT COUNT(*) AS "winsCount"
          FROM pair_quiz_game_result
          WHERE "userId" = qqa."userId"
          AND "status" = '${ResultGameStatus.WIN}'
        ),
        (
          SELECT COUNT(*) AS "lossesCount"
          FROM pair_quiz_game_result
          WHERE "userId" = qqa."userId"
          AND "status" = '${ResultGameStatus.LOSSES}'
        ),
        (
          SELECT COUNT(*) AS "drawsCount"
          FROM pair_quiz_game_result
          WHERE "userId" = qqa."userId"
          AND "status" = '${ResultGameStatus.DRAW}'
        ),        
        (
          SELECT SUM(score) AS "sumScore"
          FROM quiz_question_answer
          WHERE "userId" = qqa."userId"
          GROUP BY "userId"
        ),
        (		
          SELECT round(AVG("sumScore"), 2) AS "avgScores"
            FROM (
            SELECT "pairQuizGameId", SUM("score") AS "sumScore"
            FROM quiz_question_answer
            WHERE "userId" = qqa."userId"
            GROUP BY "pairQuizGameId"
          ) as "avgScores"			
        )      
      FROM quiz_question_answer AS qqa
      LEFT JOIN users as u ON u."id" = "userId"
      ${where}
      ${orderBy}
      ${offset}
      ${limit}
    ;`;

    const topStatisticPairQuizGame = await this.dataSource.query(query);

    return {
      items: topStatisticPairQuizGame.map((item) => {
        return {
          player: {
            id: item.userId,
            login: item.userLogin,
          },
          gamesCount: +item.gamesCount,
          winsCount: +item.winsCount,
          lossesCount: +item.lossesCount,
          drawsCount: +item.drawsCount,
          sumScore: +item.sumScore,
          avgScores: +item.avgScores,
        };
      }),
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    };
  }
  _getMyPairQuizGamesViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<PairQuizGameViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => {
        const questions = !isEmpty(item.questions)
          ? JSON.parse(item.questions)
          : null;
        return {
          id: item.id,
          firstPlayerProgress: {
            answers: !isEmpty(item.firstPlayerQuizQuestionAnswer)
              ? item.firstPlayerQuizQuestionAnswer.map((i) => ({
                  questionId: i.quizQuestionId,
                  answerStatus: i.answerStatus,
                  addedAt: i.addedAt,
                }))
              : [],
            player: {
              id: item.firstPlayerId,
              login: item.firstPlayerLogin,
            },
            score: item.firstPlayerScore ? Number(item.firstPlayerScore) : 0,
          },
          secondPlayerProgress: item.secondPlayerId
            ? {
                answers: !isEmpty(item.secondPlayerQuizQuestionAnswer)
                  ? item.secondPlayerQuizQuestionAnswer.map((i) => ({
                      questionId: i.quizQuestionId,
                      answerStatus: i.answerStatus,
                      addedAt: i.addedAt,
                    }))
                  : [],
                player: {
                  id: item.secondPlayerId,
                  login: item.secondPlayerLogin,
                },
                score: item.secondPlayerScore
                  ? Number(item.secondPlayerScore)
                  : 0,
              }
            : null,
          questions:
            !isEmpty(questions) && !isEmpty(questions.quizQuestions)
              ? questions.quizQuestions.map((i: PairQuizGameQuestionType) => ({
                  id: i.id,
                  body: i.body,
                }))
              : null,
          status: item.status,
          pairCreatedDate: item.pairCreatedDate,
          startGameDate: item.startGameDate,
          finishGameDate: item.finishGameDate,
        };
      }),
    };
  }
  _getPairQuizGameViewModel(pairQuizGame: any): PairQuizGameViewModel {
    const questions = !isEmpty(pairQuizGame.questions)
      ? JSON.parse(pairQuizGame.questions)
      : null;

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
      questions:
        !isEmpty(questions) && !isEmpty(questions.quizQuestions)
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
  _getPairQuizGameStaticViewModel(pairQuizGameStatic: any): any {
    return {
      gamesCount: pairQuizGameStatic.gamesCount
        ? Number(pairQuizGameStatic.gamesCount)
        : 0,
      sumScore: pairQuizGameStatic.sumScore
        ? Number(pairQuizGameStatic.sumScore)
        : 0,
      avgScores: pairQuizGameStatic.avgScores
        ? Math.round(Number(pairQuizGameStatic.avgScores) * 100) / 100
        : 0,
      winsCount: pairQuizGameStatic.winsCount
        ? Number(pairQuizGameStatic.winsCount)
        : 0,
      lossesCount: pairQuizGameStatic.lossesCount
        ? Number(pairQuizGameStatic.lossesCount)
        : 0,
      drawsCount: pairQuizGameStatic.drawsCount
        ? Number(pairQuizGameStatic.drawsCount)
        : 0,
    };
  }
}
