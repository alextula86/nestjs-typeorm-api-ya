import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { PublishedStatus } from '../../types';
import { MakeQuizQuestionModel, UpdateQuizQuestionModel } from './types';
import { QuizQuestions } from './entities';

@Injectable()
export class QuizQuestionRepository {
  constructor(
    @InjectRepository(QuizQuestions)
    private readonly quizQuestionRepository: Repository<QuizQuestions>,
  ) {}
  // Поиск n-количества рандомных вопросов
  async findRandomQuizQuestions(limit: number): Promise<QuizQuestions[]> {
    const query = `
      SELECT 
        "id", 
        "body",
        "correctAnswers"
      FROM quiz_questions
      WHERE "published" = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    const foundRandomQuizQuestions = await this.quizQuestionRepository.query(
      query,
    );

    return foundRandomQuizQuestions;
  }
  // Поиск конкретного вопроса для квиза по его идентификатору
  async findQuizQuestionById(quizQuestionId: string): Promise<{
    id: string;
    body: string;
    correctAnswers: string[];
    published: PublishedStatus;
    createdAt: string;
    updatedAt: string;
  }> {
    const query = `
      SELECT 
        "id", 
        "body", 
        "correctAnswers",
        "published",
        "createdAt",
        "updatedAt"
      FROM quiz_questions
      WHERE "id" = '${quizQuestionId}';
    `;

    const foundQuizQuestion = await this.quizQuestionRepository.query(query);

    if (isEmpty(foundQuizQuestion)) {
      return null;
    }

    return foundQuizQuestion[0];
  }
  // Создание вопроса для квиза
  async createQuizQuestion({
    body,
    correctAnswers,
  }: MakeQuizQuestionModel): Promise<{
    id: string;
    body: string;
    correctAnswers: string[];
    published: PublishedStatus;
    createdAt: string;
    updatedAt: string;
  }> {
    const madeQuizQuestion = await this.quizQuestionRepository
      .createQueryBuilder()
      .insert()
      .into(QuizQuestions)
      .values({
        body,
        correctAnswers: { answers: correctAnswers },
        updatedAt: null,
      })
      .returning(['id'])
      .execute();

    return madeQuizQuestion.raw[0];
  }
  // Обновление вопроса для квиза
  async updateQuizQuestion(
    quizQuestionId: string,
    { body, correctAnswers }: UpdateQuizQuestionModel,
  ): Promise<boolean> {
    await this.quizQuestionRepository
      .createQueryBuilder()
      .update(QuizQuestions)
      .set({
        body,
        correctAnswers: { answers: correctAnswers },
        updatedAt: new Date(),
      })
      .where('id = :quizQuestionId', { quizQuestionId })
      .execute();

    return true;
  }
  // Удаление вопроса для квиза
  async deleteQuizQuestionById(quizQuestionId: string): Promise<boolean> {
    await this.quizQuestionRepository.query(`
      DELETE FROM quiz_questions WHERE "id" = '${quizQuestionId}';
    `);

    return true;
  }
  // Публикация вопроса для квиза
  async publishQuizQuestion(
    quizQuestionId: string,
    published: boolean,
  ): Promise<boolean> {
    await this.quizQuestionRepository
      .createQueryBuilder()
      .update(QuizQuestions)
      .set({ published, updatedAt: new Date() })
      .where('id = :quizQuestionId', { quizQuestionId })
      .execute();

    return true;
  }
}
