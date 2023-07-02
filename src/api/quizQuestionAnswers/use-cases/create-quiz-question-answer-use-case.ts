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
    const secondPlayerAnswersCount = !isEmpty(secondPlayerAnswers)
      ? secondPlayerAnswers.length
      : 0;
    const questionsCount = questions.length;
    if (currentPlayerAnswersCount === questionsCount) {
      return {
        quizQuestionAnswerId: null,
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Получаем текущий вопрос, в зависимости от количества ответов, т.е. если ответов 0,
    // то получаем вопрос под индексом 0
    const questionItem = questions[currentPlayerAnswersCount];
    // Из текущего вопроса получаем ответы
    const correctAnswersModel = JSON.parse(questionItem.correctAnswers);
    const correctAnswers = correctAnswersModel.answers;
    // Получаем поля из DTO
    const { answer } = answerPairQuizGameDto;
    // Производим сравнение ответа пользователя с вариантом ответов в вопросе
    const isCorrectAnswer = correctAnswers.includes(answer);
    // Начисляем баллы за ответ
    const score = isCorrectAnswer ? 1 : 0;
    // Если текущий игрок ответил на последний вопрос и второй игрок еще не отвечал на последний вопрос,
    // значит первый игрок закончил игру быстрее и ему начисляется бонусный бал
    /*console.log(
      'currentPlayerAnswersCount === questionsCount - 1',
      currentPlayerAnswersCount === questionsCount - 1,
    );
    console.log(
      'secondPlayerAnswersCount !== questionsCount',
      secondPlayerAnswersCount !== questionsCount,
    );*/
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
    // console.log('bonus', bonus);
    const resultScore = score + bonus;
    // console.log('resultScore', resultScore);
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

    // Если количество ответов текущего игрока и количество ответов второго игрока равна количесмтву вопросов
    // (количество ответов текущего игрока + 1, т.к. необходимо учитывать текущий ответ),
    // Запканчиваем игру, записав дату окончания игры и статус Finished
    console.log('currentPlayerAnswersCount', currentPlayerAnswersCount + 1);
    console.log('secondPlayerAnswersCount', secondPlayerAnswersCount);
    if (
      currentPlayerAnswersCount + 1 === questionsCount &&
      secondPlayerAnswersCount === questionsCount
    ) {
      await this.pairQuizGameRepository.finishedPairQuizGame(
        foundActivePairQuizGame.id,
      );
    }

    return {
      quizQuestionAnswerId: createdQuizQuestionAnswers.id,
      statusCode: HttpStatus.OK,
    };
  }
}
