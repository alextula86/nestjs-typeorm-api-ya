import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { formatISO } from 'date-fns';
import { MakeBanModel } from './types';

@Injectable()
export class BanRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа забаненного пользователя по его идентификатору
  async findBanUserById(userId: string, blogId: string): Promise<any | null> {
    const query = `
      SELECT 
        "id", 
        "isBanned", 
        "banDate",
        "banReason",
        "createdAt"
      FROM ban_info
      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
    `;

    const foundbanUser = await this.dataSource.query(query);

    if (!foundbanUser) {
      return null;
    }

    return foundbanUser[0];
  }
  // Создание документа забаненного пользователя
  async createBanUser({
    userId,
    blogId,
    isBanned,
    banReason,
  }: MakeBanModel): Promise<any> {
    const madeBan = await this.dataSource.query(`
      INSERT INTO ban_info
        ("userId", "blogId", "isBanned", "banReason")
        VALUES ('${userId}', '${blogId}', ${isBanned}, '${banReason}')
        RETURNING *;
    `);

    return madeBan[0];
  }
  // Обновление статуса бана пользователя
  async banUserForBlog(
    userId: string,
    blogId: string,
    isBanned: boolean,
    banReason: string,
  ): Promise<boolean> {
    const banReasonResult = isBanned ? `'${banReason}'` : null;
    const banDateResult = isBanned ? `'${formatISO(new Date())}'` : null;

    const query = `
        UPDATE ban_info
        SET 
          "isBanned" = ${isBanned},
          "banReason" = ${banReasonResult},
          "banDate" = ${banDateResult}
        WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
      `;

    await this.dataSource.query(query);

    return true;
  }
  // Очистить таблицу баннов
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE ban_info;`);

    return true;
  }
}
