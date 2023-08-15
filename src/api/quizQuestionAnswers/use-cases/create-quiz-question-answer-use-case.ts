import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty, differenceBy } from 'lodash';

import { validateOrRejectModel } from '../../../validate';
import { AnswerStatus, ResultGameStatus } from '../../../types';

import { AnswerPairQuizGameDto } from '../../pairQuizGame/dto';
import { PairQuizGameRepository } from '../../pairQuizGame/pairQuizGame.repository';
import { PairQuizGameBonusRepository } from '../../pairQuizGameBonus/pairQuizGameBonus.repository';
import { PairQuizGameResultRepository } from '../../pairQuizGameResult/pairQuizGameResult.repository';

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
    private readonly pairQuizGameBonusRepository: PairQuizGameBonusRepository,
    private readonly pairQuizGameResultRepository: PairQuizGameResultRepository,
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
    const questions = this._getQuestions(foundActivePairQuizGame.questions);
    // Если вопросов нет, то возвращаем ошибку 403
    if (isEmpty(questions)) {
      return {
        quizQuestionAnswerId: null,
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Получаем ответы игроков
    const { currentPlayerAnswers, secondPlayerAnswers } =
      this._getPlayersAnswers(userId, foundActivePairQuizGame);
    // Если количество ответов текущего игрока равно количеству вопросов
    // Значит на все вопросы были уже данны ответы, возвращаем ошибку 403
    const currentPlayerAnswersCount =
      this._getAnswersCount(currentPlayerAnswers);
    const secondPlayerAnswersCount = this._getAnswersCount(secondPlayerAnswers);
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
        score,
      });
    // Если текущий игрок ответил на все вопросы, а второй игрок нет
    if (
      currentPlayerAnswersCount + 1 === questionsCount &&
      secondPlayerAnswersCount !== questionsCount
    ) {
      setTimeout(() => this._isCompletedGameBySecondPlayer(userId), 3000);
    }
    // Если количество ответов текущего игрока и количество ответов второго игрока равна количеству вопросов
    // (количество ответов текущего игрока + 1, т.к. необходимо учитывать текущий ответ),
    // Запканчиваем игру, записав дату окончания игры и статус Finished
    if (
      currentPlayerAnswersCount + 1 === questionsCount &&
      secondPlayerAnswersCount === questionsCount
    ) {
      await this.pairQuizGameRepository.finishedPairQuizGame(
        foundActivePairQuizGame.id,
      );

      await this.pairQuizGameBonusRepository.createPairQuizGameBonus({
        userId: foundActivePairQuizGame.firstPlayerId,
        pairQuizGameId: foundActivePairQuizGame.id,
        bonus: 0,
      });

      await this.pairQuizGameBonusRepository.createPairQuizGameBonus({
        userId: foundActivePairQuizGame.secondPlayerId,
        pairQuizGameId: foundActivePairQuizGame.id,
        bonus: 0,
      });

      // Определяем есть ли хоть один правильный ответ у текущего игрока
      const isCorrectCurrentPlayerAnswer =
        this._isCorrectPlayerAnswer(currentPlayerAnswers);
      // Определяем есть ли хоть один правильный ответ у второго игрока
      const isCorrectSecondPlayerAnswer =
        this._isCorrectPlayerAnswer(secondPlayerAnswers);

      const currentPlayerId =
        foundActivePairQuizGame.firstPlayerId === userId
          ? foundActivePairQuizGame.firstPlayerId
          : foundActivePairQuizGame.secondPlayerId;
      const secondPlayerId =
        foundActivePairQuizGame.firstPlayerId !== userId
          ? foundActivePairQuizGame.firstPlayerId
          : foundActivePairQuizGame.secondPlayerId;
      // Получаем запись моследнего вопроса
      const questionLastItem = questions[questions.length - 1];
      // Если текущий игрок ответил на последний вопрос и второй игрок еще не отвечал на последний вопрос,
      // значит текущий игрок закончил игру быстрее и ему начисляется бонусный балл
      // Если у текущего игрока есть хоть один правильный ответ
      // И второй игрок еще не ответил на все вопросы
      // Бонус начисляется текущему игроку
      if (
        isCorrectCurrentPlayerAnswer &&
        secondPlayerAnswersCount !== questionsCount
      ) {
        await this.pairQuizGameBonusRepository.updatePairQuizGameBonus({
          userId: currentPlayerId,
          pairQuizGameId: foundActivePairQuizGame.id,
          bonus: 1,
        });
        // Находим балл полученный на ответ последнего вопроса
        const foundCurrentPlayerLastAnswerScore =
          await this.quizQuestionAnswerRepository.findLastAnswersScore(
            currentPlayerId,
            foundActivePairQuizGame.id,
            questionLastItem.id,
          );
        // Обновляем итоговый балл за ответ увеличив его на бонусный балл
        await this.quizQuestionAnswerRepository.updateQuizQuestionAnswerScore({
          userId: currentPlayerId,
          pairQuizGameId: foundActivePairQuizGame.id,
          quizQuestionId: questionLastItem.id,
          score: Number(foundCurrentPlayerLastAnswerScore.score) + 1,
        });
      }
      // Если у второго игрока есть хоть один правильный ответ
      // И второй игрок уже ответил на все вопросы
      // Бонус начисляется второму игроку
      if (
        isCorrectSecondPlayerAnswer &&
        secondPlayerAnswersCount === questionsCount
      ) {
        await this.pairQuizGameBonusRepository.updatePairQuizGameBonus({
          userId: secondPlayerId,
          pairQuizGameId: foundActivePairQuizGame.id,
          bonus: 1,
        });
        // Находим балл полученный на ответ последнего вопроса
        const foundSecondPlayerLastAnswerScore =
          await this.quizQuestionAnswerRepository.findLastAnswersScore(
            secondPlayerId,
            foundActivePairQuizGame.id,
            questionLastItem.id,
          );
        // Обновляем итоговый балл за ответ увеличив его на бонусный балл
        await this.quizQuestionAnswerRepository.updateQuizQuestionAnswerScore({
          userId: secondPlayerId,
          pairQuizGameId: foundActivePairQuizGame.id,
          quizQuestionId: questionLastItem.id,
          score: Number(foundSecondPlayerLastAnswerScore.score) + 1,
        });
      }

      const currentPlayerSumScore =
        await this.quizQuestionAnswerRepository.findPlayerSumScore(
          currentPlayerId,
          foundActivePairQuizGame.id,
        );

      const secondPlayerSumScore =
        await this.quizQuestionAnswerRepository.findPlayerSumScore(
          secondPlayerId,
          foundActivePairQuizGame.id,
        );

      const resultGameStatus = this._getResultGameStatus(
        Number(currentPlayerSumScore.sumScore),
        Number(secondPlayerSumScore.sumScore),
      );

      await this.pairQuizGameResultRepository.createResultPairQuizGame({
        userId: currentPlayerId,
        pairQuizGameId: foundActivePairQuizGame.id,
        status: resultGameStatus.currentPlayer,
      });

      await this.pairQuizGameResultRepository.createResultPairQuizGame({
        userId: secondPlayerId,
        pairQuizGameId: foundActivePairQuizGame.id,
        status: resultGameStatus.secondPlayer,
      });
    }

    return {
      quizQuestionAnswerId: createdQuizQuestionAnswers.id,
      statusCode: HttpStatus.OK,
    };
  }
  _getQuestions(questions: any) {
    const questionsModel = JSON.parse(questions);

    return !isEmpty(questionsModel) && !isEmpty(questionsModel.quizQuestions)
      ? questionsModel.quizQuestions
      : [];
  }
  _getPlayersAnswers(userId: string, foundActivePairQuizGame: any) {
    const currentPlayerAnswers =
      foundActivePairQuizGame.firstPlayerId === userId
        ? foundActivePairQuizGame.firstPlayerQuizQuestionAnswer
        : foundActivePairQuizGame.secondPlayerQuizQuestionAnswer;
    // Получаем ответы второго игрока
    const secondPlayerAnswers =
      foundActivePairQuizGame.firstPlayerId !== userId
        ? foundActivePairQuizGame.firstPlayerQuizQuestionAnswer
        : foundActivePairQuizGame.secondPlayerQuizQuestionAnswer;

    return { currentPlayerAnswers, secondPlayerAnswers };
  }
  _getAnswersCount(playerAnswers: any) {
    return !isEmpty(playerAnswers) ? playerAnswers.length : 0;
  }
  _isCorrectPlayerAnswer(playerAnswers: any) {
    return (
      !isEmpty(playerAnswers) &&
      !!playerAnswers.find((i: any) => i.answerStatus === AnswerStatus.CORRECT)
    );
  }
  async _isCompletedGameBySecondPlayer(userId: string): Promise<void> {
    // Получаем игровую пару по текущему пользователю со статусом активная, т.е игра уже начата.
    const foundActivePairQuizGame =
      await this.pairQuizGameRepository.findActivePairQuizGame(userId);
    // Если игровая пара еще не завершена
    if (foundActivePairQuizGame) {
      // Получаем идентификатор второго игрока
      const secondPlayerId =
        foundActivePairQuizGame.firstPlayerId !== userId
          ? foundActivePairQuizGame.firstPlayerId
          : foundActivePairQuizGame.secondPlayerId;

      await this.pairQuizGameRepository.finishedPairQuizGame(
        foundActivePairQuizGame.id,
      );
      // Получаем ответы текущего игрока
      const { currentPlayerAnswers, secondPlayerAnswers } =
        this._getPlayersAnswers(userId, foundActivePairQuizGame);
      const unansweredQuestions: any = differenceBy(
        currentPlayerAnswers,
        secondPlayerAnswers,
        'quizQuestionId',
      );

      const values = unansweredQuestions
        .map((question) => {
          return `('', '${AnswerStatus.INCORRECT}', 0, '${secondPlayerId}', '${foundActivePairQuizGame.id}', '${question.quizQuestionId}')`;
        })
        .join(',');
      // Обнуляем все баллы за ответы второго игрока, т.к. он не успел ответить
      // на все вопросы за 10 секунд
      await this.quizQuestionAnswerRepository.resetQuizQuestionAnswerUser({
        values,
      });
      // Определяем есть ли хоть один правильный ответ у текущего игрока
      const isCorrectCurrentPlayerAnswer =
        this._isCorrectPlayerAnswer(currentPlayerAnswers);
      // Если есть хоть один правильный ответ у текущего игрока
      if (isCorrectCurrentPlayerAnswer) {
        // Получаем список вопросов
        const questions = this._getQuestions(foundActivePairQuizGame.questions);
        // Получаем запись моследнего вопроса
        const questionLastItem = questions[questions.length - 1];
        // Обновляем итоговый балл за ответ увеличив его на бонусный балл
        await this.quizQuestionAnswerRepository.updateQuizQuestionAnswerScore({
          userId,
          pairQuizGameId: foundActivePairQuizGame.id,
          quizQuestionId: questionLastItem.id,
          score:
            Number(
              currentPlayerAnswers[currentPlayerAnswers.length - 1].score,
            ) + 1,
        });
      }
    }
  }
  _getResultGameStatus(
    currentPlayerSumScore: number,
    secondPlayerSumScore: number,
  ): {
    currentPlayer: ResultGameStatus;
    secondPlayer: ResultGameStatus;
  } {
    if (currentPlayerSumScore > secondPlayerSumScore) {
      return {
        currentPlayer: ResultGameStatus.WIN,
        secondPlayer: ResultGameStatus.LOSSES,
      };
    }

    if (currentPlayerSumScore < secondPlayerSumScore) {
      return {
        currentPlayer: ResultGameStatus.LOSSES,
        secondPlayer: ResultGameStatus.WIN,
      };
    }

    return {
      currentPlayer: ResultGameStatus.DRAW,
      secondPlayer: ResultGameStatus.DRAW,
    };
  }
}
