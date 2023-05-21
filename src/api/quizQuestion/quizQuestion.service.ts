import { Injectable } from '@nestjs/common';
import { PublishedStatus } from '../../types';
import { QuizQuestionRepository } from './quizQuestion.repository';

@Injectable()
export class QuizQuestionService {
  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
  ) {}
  // Поиск конкретного вопроса для квиза по его идентификатору
  async findQuizQuestionById(quizQuestionId: string): Promise<{
    id: string;
    body: string;
    correctAnswers: string[];
    published: PublishedStatus;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const foundQuizQuestionById =
      await this.quizQuestionRepository.findQuizQuestionById(quizQuestionId);

    if (!foundQuizQuestionById) {
      return null;
    }

    return foundQuizQuestionById;
  }
}
