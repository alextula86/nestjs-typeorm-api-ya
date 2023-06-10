import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import { AnswerStatus } from '../../types';
import { QuizQuestionAnswerViewModel } from './types';

@Injectable()
export class QuizQuestionAnswerQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findQuizQuestionAnswerById(quizQuestionAnswerId: string): Promise<{
    questionId: string;
    answerStatus: AnswerStatus;
    addedAt: string;
  } | null> {
    const query = `
      SELECT
        "quizQuestionId", 
        "answerStatus", 
        "addedAt"
      FROM quiz_question_answer
      WHERE "id" = '${quizQuestionAnswerId}';
    `;

    const foundQuizQuestionAnswer = await this.dataSource.query(query);

    if (isEmpty(foundQuizQuestionAnswer)) {
      return null;
    }

    return this._getQuizQuestionAnswerViewModel(foundQuizQuestionAnswer[0]);
  }
  _getQuizQuestionAnswerViewModel(
    quizQuestionAnswer: any,
  ): QuizQuestionAnswerViewModel {
    return {
      questionId: quizQuestionAnswer.quizQuestionId,
      answerStatus: quizQuestionAnswer.answerStatus,
      addedAt: quizQuestionAnswer.addedAt,
    };
  }
}
