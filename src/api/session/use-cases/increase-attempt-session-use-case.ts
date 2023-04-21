import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionRepository } from '../session.repository';

export class IncreaseAttemptSessionCommand {
  constructor(public sessionId: string) {}
}

@CommandHandler(IncreaseAttemptSessionCommand)
export class IncreaseAttemptSessionUseCase
  implements ICommandHandler<IncreaseAttemptSessionCommand>
{
  constructor(private readonly sessionRepository: SessionRepository) {}
  // Обновление попытки обратится к сессии
  async execute(command: IncreaseAttemptSessionCommand): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  } | null> {
    const { sessionId } = command;
    // Проверяем добавлена ли сессия с переданным идентификаторм
    const session = await this.sessionRepository.findSessionById(sessionId);
    // Если сессии с переданным идентификатором нет в базе, возвращаем ошибку 400
    if (!session) {
      return null;
    }
    // Увеличиваем поле attempt на единицу
    const updatedSession = await this.sessionRepository.increaseAttempt(
      sessionId,
    );

    return updatedSession;
  }
}
