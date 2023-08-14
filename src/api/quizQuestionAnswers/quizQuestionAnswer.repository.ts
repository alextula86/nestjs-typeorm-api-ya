import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { AnswerStatus } from '../../types';
import { QuizQuestionAnswer } from './entities';

@Injectable()
export class QuizQuestionAnswerRepository {
  constructor(
    @InjectRepository(QuizQuestionAnswer)
    private readonly quizQuestionAnswerRepository: Repository<QuizQuestionAnswer>,
  ) {}
  async findUserQuizQuestionAnswersByCurrentPairQuizGame(
    userId: string,
    pairQuizGameId: string,
  ): Promise<{
    id: string;
    quizQuestionId: string;
    answerStatus: AnswerStatus;
    addedAt: Date;
  }> {
    const query = `
      SELECT 
        "id", 
        "answer", 
        "answerStatus", 
        "addedAt",
        "pairQuizGameId",
        "quizQuestionId",
        "userId"
      FROM quiz_question_answer
      WHERE "userId" = '${userId}' AND "pairQuizGameId" = '${pairQuizGameId}'
    `;

    const foundQuizQuestionAnswers =
      await this.quizQuestionAnswerRepository.query(query);

    return foundQuizQuestionAnswers;
  }
  async findLastAnswersScore(
    userId: string,
    pairQuizGameId: string,
    quizQuestionId: string,
  ): Promise<{ score: string }> {
    const query = `
      SELECT "score"
      FROM quiz_question_answer
      WHERE "userId" = '${userId}'
      AND "pairQuizGameId" = '${pairQuizGameId}'
      AND "quizQuestionId" = '${quizQuestionId}'
    `;

    const foundLastAnswersScore = await this.quizQuestionAnswerRepository.query(
      query,
    );

    return foundLastAnswersScore[0];
  }
  async findPlayerSumScore(
    userId: string,
    pairQuizGameId: string,
  ): Promise<{
    sumScore: string;
  }> {
    const query = `
      SELECT SUM("score") AS "sumScore"
      FROM quiz_question_answer
      WHERE "userId" = '${userId}' AND "pairQuizGameId" = '${pairQuizGameId}'
    `;

    const foundPlayerSumScore = await this.quizQuestionAnswerRepository.query(
      query,
    );

    if (isEmpty(foundPlayerSumScore)) {
      return null;
    }

    return foundPlayerSumScore[0];
  }
  async createQuizQuestionAnswers({
    userId,
    pairQuizGameId,
    quizQuestionId,
    answer,
    answerStatus,
    score,
  }: {
    userId: string;
    pairQuizGameId: string;
    quizQuestionId: string;
    answer: string;
    answerStatus: AnswerStatus;
    score: number;
  }): Promise<{ id: string }> {
    const madeQuizQuestionAnswers = await this.quizQuestionAnswerRepository
      .createQueryBuilder()
      .insert()
      .into(QuizQuestionAnswer)
      .values({
        userId,
        pairQuizGameId,
        quizQuestionId,
        answer,
        answerStatus,
        score,
      })
      .returning(['id'])
      .execute();

    return madeQuizQuestionAnswers.raw[0];
  }
  async updateQuizQuestionAnswerScore({
    userId,
    pairQuizGameId,
    quizQuestionId,
    score,
  }: {
    userId: string;
    pairQuizGameId: string;
    quizQuestionId: string;
    score: number;
  }): Promise<{ id: string }> {
    const updatedQuizQuestionAnswerScore =
      await this.quizQuestionAnswerRepository
        .createQueryBuilder()
        .update(QuizQuestionAnswer)
        .set({ score })
        .where('userId = :userId', { userId })
        .andWhere('pairQuizGameId = :pairQuizGameId', { pairQuizGameId })
        .andWhere('quizQuestionId = :quizQuestionId', { quizQuestionId })
        .execute();
    return updatedQuizQuestionAnswerScore.raw[0];
  }
  async resetQuizQuestionAnswerUser({
    userId,
    pairQuizGameId,
  }: {
    userId: string;
    pairQuizGameId: string;
  }): Promise<{ id: string }> {
    const resetedQuizQuestionAnswerUser =
      await this.quizQuestionAnswerRepository
        .createQueryBuilder()
        .update(QuizQuestionAnswer)
        .set({ score: 0 })
        .where('userId = :userId', { userId })
        .andWhere('pairQuizGameId = :pairQuizGameId', { pairQuizGameId })
        .execute();
    return resetedQuizQuestionAnswerUser.raw[0];
  }
}
