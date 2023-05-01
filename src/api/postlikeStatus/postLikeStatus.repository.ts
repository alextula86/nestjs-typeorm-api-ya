import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { LikeStatuses } from '../../types';
import { MakePostLikeStatusModel } from './types';

@Injectable()
export class PostLikeStatusRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Создаем лайк статус поста
  async createLikeStatus({
    likeStatus,
    userId,
    postId,
  }: MakePostLikeStatusModel): Promise<{
    id: string;
    likeStatus: LikeStatuses;
    isBanned: boolean;
    createdAt: string;
    userId: string;
    commentId: string;
  }> {
    const query = `
      INSERT INTO post_like_status
        ("likeStatus", "userId", "postId")
        VALUES ('${likeStatus}', '${userId}', '${postId}')
        RETURNING *;
  `;

    const madeLikeStatus = await this.dataSource.query(query);

    return madeLikeStatus[0];
  }
  // Обновить лайк статус поста
  async updateLikeStatus({
    likeStatus,
    userId,
    postId,
  }: MakePostLikeStatusModel): Promise<boolean> {
    const query = `
      UPDATE post_like_status
      SET "likeStatus" = '${likeStatus}'
      WHERE "postId" = '${postId}' AND "userId" = '${userId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
  // Поиск лайк статус поста пользователя
  async findLikeStatusOfUser(
    userId: string,
    postId: string,
  ): Promise<{
    id: string;
    likeStatus: LikeStatuses;
    isBanned: boolean;
    createdAt: string;
    userId: string;
    userLogin: string;
  } | null> {
    const query = `
      SELECT 
        pls."id",
        pls."likeStatus",
        pls."isBanned",
        pls."createdAt",
        users."id" as "userId",
        users."login" as "userLogin"
      FROM post_like_status as pls
      LEFT JOIN users ON users."id" = pls."userId"
      WHERE pls."postId" = '${postId}' AND pls."userId" = '${userId}'
    ;`;

    const foundLikeStatus = await this.dataSource.query(query);

    if (isEmpty(foundLikeStatus)) {
      return null;
    }

    return foundLikeStatus[0];
  }
  // Поиск всех лайк статусов постов пользователя
  async findLikeStatusesOfUser(userId: string): Promise<
    {
      id: string;
      likeStatus: LikeStatuses;
      isBanned: boolean;
      createdAt: string;
      userId: string;
      userLogin: string;
    }[]
  > {
    const query = `
      SELECT 
        pls."id",
        pls."likeStatus",
        pls."isBanned",
        pls."createdAt",
        users."id" as "userId",
        users."login" as "userLogin"
      FROM post_like_status as pls
      LEFT JOIN users ON users."id" = pls."userId"
      WHERE pls."userId" = '${userId}'
    ;`;

    const foundLikeStatuses = await this.dataSource.query(query);

    return foundLikeStatuses;
  }
  // Бан лайков комментарий пользователя
  async banUserLikeStatuses(
    userId: string,
    isBanned: boolean,
  ): Promise<boolean> {
    const query = `
      UPDATE post_like_status
      SET "isBanned" = ${isBanned}
      WHERE "userId" = '${userId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
}
