import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { validateOrRejectModel } from '../../../validate';

import { UserRepository } from '../../user/user.repository';

import { CreateQuizQuestionDto } from '../dto/quiz.questions.dto';
import { QuizQuestionRepository } from '../quizQuestion.repository';

export class CreateQuizQuestionCommand {
  constructor(public createQuizQuestionsDto: CreateQuizQuestionDto) {}
}

@CommandHandler(CreateQuizQuestionCommand)
export class CreateQuizQuestionUseCase
  implements ICommandHandler<CreateQuizQuestionCommand>
{
  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Создание вопроса для квиза
  async execute(command: CreateQuizQuestionCommand): Promise<{
    quizQuestionId: string;
    statusCode: HttpStatus;
  }> {
    const { createQuizQuestionsDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(createQuizQuestionsDto, CreateQuizQuestionDto);
    // Получаем поля из DTO
    const { body, correctAnswers } = createQuizQuestionsDto;
    // Создаем вопроса для квиза
    const createdQuizQuestion =
      await this.quizQuestionRepository.createQuizQuestion({
        body,
        correctAnswers,
      });
    // Возвращаем идентификатор созданного вопроса для квиза и статус 201
    return {
      quizQuestionId: createdQuizQuestion.id,
      statusCode: HttpStatus.CREATED,
    };
  }
}
