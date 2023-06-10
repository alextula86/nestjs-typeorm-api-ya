import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isEmpty } from 'lodash';
import { PairQuizGameRepository } from '../pairQuizGame.repository';
import { QuizQuestionRepository } from '../../quizQuestion/quizQuestion.repository';

export class ConnectionPairQuizGameCommand {
  constructor(public userId: string) {}
}

@CommandHandler(ConnectionPairQuizGameCommand)
export class ConnectionPairQuizGameUseCase
  implements ICommandHandler<ConnectionPairQuizGameCommand>
{
  constructor(
    private readonly pairQuizGameRepository: PairQuizGameRepository,
    private readonly quizQuestionRepository: QuizQuestionRepository,
  ) {}
  // Подключение текущего пользователя к существующей игровой паре
  // Или создание новой игровой пары, которая будет ждать второго игрока
  async execute(command: ConnectionPairQuizGameCommand): Promise<{
    pairQuizGameId: string;
    statusCode: HttpStatus;
  }> {
    const { userId } = command;
    // Ищем пару созданную текущим пользователем со статусом активный или в ожидании
    const connectedUserToPairQuizGame =
      await this.pairQuizGameRepository.connectedUserToPairQuizGame(userId);
    // Если пара с текущим пользователям со статусом активный или в ожидании создана,
    // то пользователь не может повторно законектиться, возвращаем ошибку с кодом 403
    if (!isEmpty(connectedUserToPairQuizGame)) {
      return { pairQuizGameId: null, statusCode: HttpStatus.FORBIDDEN };
    }
    // Ищем любую пару в режиме ожидания для создания коннекта
    const foundPendingSecondPlayerPairQuizGame =
      await this.pairQuizGameRepository.findPendingSecondPlayerPairQuizGame();
    // Если пара в ожидании есть, устанавливаем текущего пользователя в качестве второго игрока,
    // устанавливаем статус пары активный, добавляем дату старта игры
    if (!isEmpty(foundPendingSecondPlayerPairQuizGame)) {
      await this.pairQuizGameRepository.activatePairQuizGame(
        userId,
        foundPendingSecondPlayerPairQuizGame.id,
      );

      return {
        pairQuizGameId: foundPendingSecondPlayerPairQuizGame.id,
        statusCode: HttpStatus.CREATED,
      };
    }
    // Находим рандомно до 5 вопросов для игровой пары
    const foundRandomQuizQuestions =
      await this.quizQuestionRepository.findRandomQuizQuestions(5);
    // Если пары в ожидании нет, то создаем пару, где первый игрок будет текущий пользователь
    const createdPairQuizGame =
      await this.pairQuizGameRepository.createPairQuizGame(
        userId,
        foundRandomQuizQuestions,
      );

    return {
      pairQuizGameId: createdPairQuizGame.id,
      statusCode: HttpStatus.CREATED,
    };
  }
}
