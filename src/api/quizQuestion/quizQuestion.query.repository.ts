import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  PublishedStatus,
  ResponseViewModelDetail,
  SortDirection,
} from '../../types';
import { QueryQuizQuestionModel, QuizQuestionViewModel } from './types';

@Injectable()
export class QuizQuestionQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllQuizQuestions({
    bodySearchTerm,
    publishedStatus,
    pageNumber,
    pageSize,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
  }: QueryQuizQuestionModel): Promise<
    ResponseViewModelDetail<QuizQuestionViewModel>
  > {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];

    if (bodySearchTerm) {
      terms.push(`"body" ILIKE '%${bodySearchTerm}%'`);
    }

    if (publishedStatus) {
      terms.push(`"published" = '${publishedStatus}'`);
    }

    const where = !isEmpty(terms) ? `WHERE ${terms.join(' OR ')}` : '';

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM quiz_questions ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        "id", 
        "body", 
        "correctAnswers",
        "published",
        "createdAt",
        "updatedAt"
      FROM quiz_questions
      ${where}
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const quizQuestions = await this.dataSource.query(query);

    return this._getQuizQuestionViewModelDetail({
      items: quizQuestions,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  async findQuizQuestionById(quizQuestionId: string): Promise<{
    id: string;
    body: string;
    correctAnswers: string[];
    published: PublishedStatus;
    createdAt: string;
    updatedAt: string;
  } | null> {
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

    const foundQuizQuestion = await this.dataSource.query(query);

    if (isEmpty(foundQuizQuestion)) {
      return null;
    }

    return this._getQuizQuestionViewModel(foundQuizQuestion[0]);
  }
  _getQuizQuestionViewModel(quizQuestion: any): QuizQuestionViewModel {
    const correctAnswers = JSON.parse(quizQuestion.correctAnswers);
    return {
      id: quizQuestion.id,
      body: quizQuestion.body,
      correctAnswers: correctAnswers.answers,
      published: quizQuestion.published,
      createdAt: quizQuestion.createdAt,
      updatedAt: quizQuestion.updatedAt,
    };
  }
  _getQuizQuestionViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<QuizQuestionViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => {
        const correctAnswers = JSON.parse(item.correctAnswers);
        return {
          id: item.id,
          body: item.body,
          correctAnswers: correctAnswers.answers,
          published: item.published,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
    };
  }
}
