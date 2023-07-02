import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
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
}