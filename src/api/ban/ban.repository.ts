import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { MakeBanModel } from './types';

@Injectable()
export class BanRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа забаненного пользователя по его идентификатору
  async findBanUserForBlogById(
    userId: string,
    blogId: string,
  ): Promise<any | null> {
    const query = `
      SELECT 
        "id", 
        "isBanned", 
        "banDate",
        "banReason",
        "createdAt"
      FROM ban_user_for_blog
      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
    `;

    const foundbanUser = await this.dataSource.query(query);

    if (!foundbanUser) {
      return null;
    }

    return foundbanUser[0];
  }

  // Баним пользователя для конкретного блога
  async createBanUserForBlogId({
    userId,
    blogId,
    isBanned,
    banReason,
  }: MakeBanModel): Promise<any> {
    const banReasonResult = isBanned ? `'${banReason}'` : null;
    const banDateResult = isBanned ? `'${new Date().toISOString()}'` : null;

    const madeBan = await this.dataSource.query(`
      INSERT INTO ban_user_for_blog
        ("userId", "blogId", "isBanned", "banReason", "banDate")
        VALUES ('${userId}', '${blogId}', ${isBanned}, '${banReasonResult}', '${banDateResult}')
        RETURNING *;
    `);

    return madeBan[0];
  }
  // Обновление статуса бана пользователя
  async updateBanUserForBlogId(
    userId: string,
    blogId: string,
    isBanned: boolean,
    banReason: string,
  ): Promise<boolean> {
    const banReasonResult = isBanned ? `'${banReason}'` : null;
    const banDateResult = isBanned ? `'${new Date().toISOString()}'` : null;

    const query = `
        UPDATE ban_user_for_blog
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
    await this.dataSource.query(`TRUNCATE TABLE ban_user_for_blog;`);

    return true;
  }
}
