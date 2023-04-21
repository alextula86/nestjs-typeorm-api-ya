import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { formatISO } from 'date-fns';
import { MakeSessionModel } from './types';

@Injectable()
export class SessionRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
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
    const foundSession = await this.dataSource.query(`
      SELECT * FROM sessions WHERE "ip" = '${ip}' AND "url" = '${url}' AND "deviceTitle" = '${deviceTitle}';
    `);

    if (!foundSession) {
      return null;
    }

    return foundSession[0];
  }
  // Поиск сессии по ее идентификатору
  async findSessionById(sessionId: string): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  } | null> {
    const foundSession = await this.dataSource.query(`
      SELECT * FROM sessions WHERE "id" = ${sessionId};
    `);

    if (!foundSession) {
      return null;
    }

    return foundSession[0];
  }
  // Создаем документ сессии
  async createSession({ ip, deviceTitle, url }: MakeSessionModel): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  }> {
    const createdSession = await this.dataSource.query(`
      INSERT INTO sessions
        ("ip", "deviceTitle", "url")
        VALUES ('${ip}', '${deviceTitle}', '${url}')
        RETURNING *;
    `);

    return createdSession[0];
  }
  async resetAttempt(sessionId: string): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  }> {
    const attempt = 1;
    const issuedAtt = formatISO(new Date());

    const query = `
      UPDATE sessions
      SET 
        "attempt" = ${attempt},
        "issuedAtt" = '${issuedAtt}'
      WHERE 
        "id" = '${sessionId}'
      RETURNING *;
    `;

    const updatedSession = await this.dataSource.query(query);

    return updatedSession[0];
  }
  async increaseAttempt(sessionId: string): Promise<{
    id: string;
    ip: string;
    deviceTitle: string;
    url: string;
    issuedAtt: string;
    attempt: number;
  }> {
    const query = `
      UPDATE sessions
      SET 
        "attempt" = "attempt" + 1
      WHERE 
        "id" = '${sessionId}'
      RETURNING *;
    `;

    const updatedSession = await this.dataSource.query(query);

    return updatedSession[0];
  }
  // Удаление сессии
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE sessions;`);

    return true;
  }
}
