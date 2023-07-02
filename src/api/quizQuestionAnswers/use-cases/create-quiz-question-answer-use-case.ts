import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';

import { validateOrRejectModel } from '../../../validate';
import { AnswerStatus } from '../../../types';

import { AnswerPairQuizGameDto } from '../../pairQuizGame/dto';
import { PairQuizGameRepository } from '../../pairQuizGame/pairQuizGame.repository';

import { QuizQuestionAnswerRepository } from '../quizQuestionAnswer.repository';

export class CreateQuizQuestionAnswerCommand {
  constructor(
    public userId: string,
    public answerPairQuizGameDto: AnswerPairQuizGameDto,
  ) {}
}

@CommandHandler(CreateQuizQuestionAnswerCommand)
export class CreateQuizQuestionAnswerUseCase
  implements ICommandHandler<CreateQuizQuestionAnswerCommand>
{
  constructor(
    private readonly quizQuestionAnswerRepository: QuizQuestionAnswerRepository,
    private readonly pairQuizGameRepository: PairQuizGameRepository,
  ) {}

  async execute(command: CreateQuizQuestionAnswerCommand): Promise<{
    quizQuestionAnswerId: string;
    statusCode: HttpStatus;
  }> {
    const { userId, answerPairQuizGameDto } = command;
    // Валидируем DTO
    await validateOrRejectModel(answerPairQuizGameDto, AnswerPairQuizGameDto);
    // Получаем игровую пару по текущему пользователю со статусом активная, т.е игра уже начата.
    const foundActivePairQuizGame =
      await this.pairQuizGameRepository.findActivePairQuizGame(userId);
    console.log('foundActivePairQuizGame', foundActivePairQuizGame);
    // Если активной игровой пары нет, т.е. игровая пара еще не создана или ее статус еще не активен
    // Возвращаем ошибку 403
    if (!foundActivePairQuizGame) {
      return {
        quizQuestionAnswerId: null,
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Получаем список вопросов
    const questionsModel = JSON.parse(foundActivePairQuizGame.questions);
    const questions =
      !isEmpty(questionsModel) && !isEmpty(questionsModel.quizQuestions)
        ? questionsModel.quizQuestions
        : [];
    console.log('questions', questions);
    // Если вопросов нет, то возвращаем ошибку 403
    if (isEmpty(questions)) {
      return {
        quizQuestionAnswerId: null,
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Получаем ответы текущего пользователя
    const currentPlayerAnswers =
      foundActivePairQuizGame.firstPlayerId === userId
        ? foundActivePairQuizGame.firstPlayerQuizQuestionAnswer
        : foundActivePairQuizGame.secondPlayerQuizQuestionAnswer;
    console.log('currentPlayerAnswers', currentPlayerAnswers);
    // Получаем ответы второго игрока
    const secondPlayerAnswers =
      foundActivePairQuizGame.firstPlayerId !== userId
        ? foundActivePairQuizGame.firstPlayerQuizQuestionAnswer
        : foundActivePairQuizGame.secondPlayerQuizQuestionAnswer;
    console.log('secondPlayerAnswers', secondPlayerAnswers);
    // Если количество ответов текущего пользователя равно количеству вопросов
    // Значит на все вопросы были уже данны ответы, возвращаем ошибку 403
    const currentPlayerAnswersCount = !isEmpty(currentPlayerAnswers)
      ? currentPlayerAnswers.length
      : 0;
    console.log('currentPlayerAnswersCount', currentPlayerAnswersCount);
    const secondPlayerAnswersCount = !isEmpty(secondPlayerAnswers)
      ? secondPlayerAnswers.length
      : 0;
    const questionsCount = questions.length;
    console.log('questionsCount', questionsCount);
    if (currentPlayerAnswersCount === questionsCount) {
      return {
        quizQuestionAnswerId: '',
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Получаем текущий вопрос, в зависимости от количества ответов, т.е. если ответов 0,
    // то получаем вопрос под индексом 0
    const questionItem = questions[currentPlayerAnswersCount];
    console.log('questionItem', questionItem);
    // Из текущего вопроса получаем ответы
    const correctAnswersModel = JSON.parse(questionItem.correctAnswers);
    console.log('correctAnswersModel', correctAnswersModel);
    const correctAnswers = correctAnswersModel.answers;
    console.log('correctAnswers', correctAnswers);
    // Получаем поля из DTO
    const { answer } = answerPairQuizGameDto;
    console.log('answer', answer);
    // Производим сравнение ответа пользователя с вариантом ответов в вопросе
    const isCorrectAnswer = correctAnswers.includes(answer);
    console.log('isCorrectAnswer', isCorrectAnswer);
    // Начисляем баллы за ответ
    const score = isCorrectAnswer ? 1 : 0;

    console.log('score', score);
    // Если текущий игрок ответил на последний вопрос и второй игрок еще не отвечал на последний вопрос,
    // значит первый игрок закончил игру быстрее и ему начисляется бонусный бал
    console.log(
      'currentPlayerAnswersCount === questionsCount - 1',
      currentPlayerAnswersCount === questionsCount - 1,
    );
    console.log(
      'secondPlayerAnswersCount !== questionsCount',
      secondPlayerAnswersCount !== questionsCount,
    );
    /*console.log(
      'currentPlayerAnswers.find((i) => i.answerStatus === AnswerStatus.CORRECT)',
      currentPlayerAnswers.find((i) => i.answerStatus === AnswerStatus.CORRECT),
    );
    const bonus =
      currentPlayerAnswersCount === questionsCount - 1 &&
      secondPlayerAnswersCount !== questionsCount &&
      currentPlayerAnswers.find((i) => i.answerStatus === AnswerStatus.CORRECT)
        ? 1
        : 0;*/
    const bonus = 0;
    console.log('bonus', bonus);
    const resultScore = score + bonus;
    console.log('resultScore', resultScore);
    // Сохраняем ответ в таблице ответов и начисляем баллы за ответ
    const createdQuizQuestionAnswers =
      await this.quizQuestionAnswerRepository.createQuizQuestionAnswers({
        userId,
        pairQuizGameId: foundActivePairQuizGame.id,
        quizQuestionId: questionItem.id,
        answer,
        answerStatus: isCorrectAnswer
          ? AnswerStatus.CORRECT
          : AnswerStatus.INCORRECT,
        score: resultScore,
      });

    return {
      quizQuestionAnswerId: createdQuizQuestionAnswers.id,
      statusCode: HttpStatus.CREATED,
    };
  }
}
