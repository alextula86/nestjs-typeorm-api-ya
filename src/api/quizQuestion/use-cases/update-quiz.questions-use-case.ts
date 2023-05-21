import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';

import { UpdateQuizQuestionDto } from '../dto/quiz.questions.dto';
import { QuizQuestionRepository } from '../quizQuestion.repository';

export class UpdateQuizQuestionCommand {
  constructor(
    public quizQuestionId: string,
    public updateQuizQuestionDto: UpdateQuizQuestionDto,
  ) {}
}

@CommandHandler(UpdateQuizQuestionCommand)
export class UpdateQuizQuestionUseCase
  implements ICommandHandler<UpdateQuizQuestionCommand>
{
  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
  ) {}
  // Обновление вопроса для квиза
  async execute(command: UpdateQuizQuestionCommand): Promise<{
    statusCode: HttpStatus;
  }> {
    const { quizQuestionId, updateQuizQuestionDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(updateQuizQuestionDto, UpdateQuizQuestionDto);
    // Ищем вопрос для квиза
    const foundQuizQuestion =
      await this.quizQuestionRepository.findQuizQuestionById(quizQuestionId);
    // Если вопрос для квиза не найден, возвращаем ошибку 404
    if (isEmpty(foundQuizQuestion)) {
      return { statusCode: HttpStatus.NOT_FOUND };
    }
    // Обновляем вопрос для квиза
    await this.quizQuestionRepository.updateQuizQuestion(
      quizQuestionId,
      updateQuizQuestionDto,
    );
    // Возвращаем статус 204
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
