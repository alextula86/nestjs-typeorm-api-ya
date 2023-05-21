import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { QuizQuestionRepository } from '../quizQuestion.repository';
import { PublishQuizQuestionDto } from '../dto';

export class PublishQuizQuestionCommand {
  constructor(
    public quizQuestionId: string,
    public publishQuizQuestionDto: PublishQuizQuestionDto,
  ) {}
}

@CommandHandler(PublishQuizQuestionCommand)
export class PublishQuizQuestionUseCase
  implements ICommandHandler<PublishQuizQuestionCommand>
{
  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
  ) {}
  // Публикация вопроса для квиза
  async execute(command: PublishQuizQuestionCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { quizQuestionId, publishQuizQuestionDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(publishQuizQuestionDto, PublishQuizQuestionDto);
    // Получаем поля из DTO
    const { published } = publishQuizQuestionDto;
    // Ищем вопрос для квиза
    const foundQuizQuestion =
      await this.quizQuestionRepository.findQuizQuestionById(quizQuestionId);
    // Если вопроса для квиза не найден, возвращаем ошибку 404
    if (isEmpty(foundQuizQuestion)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Публикуем вопроса для квиза
    await this.quizQuestionRepository.publishQuizQuestion(
      quizQuestionId,
      published,
    );
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
