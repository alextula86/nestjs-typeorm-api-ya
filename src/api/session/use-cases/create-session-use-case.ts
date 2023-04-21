import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SessionRepository } from '../session.repository';
import { CreateSessionDto } from '../dto/session.dto';

export class CreateSessionCommand {
  constructor(public createSessionDto: CreateSessionDto) {}
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand>
{
  constructor(private readonly sessionRepository: SessionRepository) {}
  // Добавление сессии
  async execute(command: CreateSessionCommand): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  }> {
    const { createSessionDto } = command;
    // Получаем поля из DTO
    const { ip, deviceTitle, url } = createSessionDto;
    // Создаем документ сессии
    const createdSession = await this.sessionRepository.createSession({
      ip,
      deviceTitle,
      url,
    });
    // Возвращаем идентификатор созданного устройства
    return createdSession;
  }
}
