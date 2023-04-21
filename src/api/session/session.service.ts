import { Injectable } from '@nestjs/common';

import { SessionRepository } from './session.repository';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}
  // Поиск сессии по ip адресу, урлу и названию устройства
  async findSession(
    ip: string,
    url: string,
    deviceTitle: string,
  ): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  } | null> {
    const foundSession = await this.sessionRepository.findSession(
      ip,
      url,
      deviceTitle,
    );

    return foundSession;
  }
}
