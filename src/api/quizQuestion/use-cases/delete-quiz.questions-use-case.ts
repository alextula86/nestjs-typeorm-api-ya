import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { UserRepository } from '../../user/user.repository';

import { QuizQuestionRepository } from '../quizQuestion.repository';

export class DeleteQuizQuestionCommand {
  constructor(public quizQuestionId: string) {}
}

@CommandHandler(DeleteQuizQuestionCommand)
export class DeleteQuizQuestionUseCase
  implements ICommandHandler<DeleteQuizQuestionCommand>
{
  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Удаление вопроса для квиза
  async execute(command: DeleteQuizQuestionCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { quizQuestionId } = command;
    // Ищем вопрос для квиза
    const foundQuizQuestion =
      await this.quizQuestionRepository.findQuizQuestionById(quizQuestionId);
    // Если вопрос для квиза не найден, возвращаем ошибку 404
    if (isEmpty(foundQuizQuestion)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Удаляем вопрос для квиза
    const isDeleteQuizQuestionById =
      await this.quizQuestionRepository.deleteQuizQuestionById(quizQuestionId);
    // Если при удалении вопроса для квиза возникли ошибки, возвращаем ошибку 404
    if (!isDeleteQuizQuestionById) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
