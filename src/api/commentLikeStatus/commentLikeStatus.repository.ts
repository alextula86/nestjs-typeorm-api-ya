import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { LikeStatuses } from '../../types';
import { MakeCommentLikeStatusModel } from './types';

@Injectable()
export class CommentLikeStatusRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Создаем лайк статус комментария
  async createLikeStatus({
    likeStatus,
    userId,
    commentId,
  }: MakeCommentLikeStatusModel): Promise<{
    id: string;
    likeStatus: LikeStatuses;
    isBanned: boolean;
    createdAt: string;
    userId: string;
    commentId: string;
  }> {
    const query = `
      INSERT INTO comment_like_status
        ("likeStatus", "userId", "commentId")
        VALUES ('${likeStatus}', '${userId}', '${commentId}')
        RETURNING *;
    `;

    const madeLikeStatus = await this.dataSource.query(query);

    return madeLikeStatus[0];
  }
  // Обновить лайк статус комментария
  async updateLikeStatus({
    likeStatus,
    userId,
    commentId,
  }: MakeCommentLikeStatusModel): Promise<boolean> {
    const query = `
      UPDATE comment_like_status
      SET "likeStatus" = '${likeStatus}'
      WHERE "commentId" = '${commentId}' AND "userId" = '${userId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
  // Поиск лайк статус комментария пользователя
  async findLikeStatusOfUser(
    userId: string,
    commentId: string,
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
        cls."id",
        cls."likeStatus",
        cls."isBanned",
        cls."createdAt",
        users."id" as "userId",
        users."login" as "userLogin"
      FROM comment_like_status as cls
      LEFT JOIN users ON users."id" = cls."userId"
      WHERE cls."commentId" = '${commentId}' AND cls."userId" = '${userId}'
    ;`;

    const foundLikeStatus = await this.dataSource.query(query);

    if (isEmpty(foundLikeStatus)) {
      return null;
    }

    return foundLikeStatus[0];
  }
  // Поиск всех лайк статусов коментариев пользователя
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
        cls."id",
        cls."likeStatus",
        cls."isBanned",
        cls."createdAt",
        users."id" as "userId",
        users."login" as "userLogin"
      FROM comment_like_status as cls
      LEFT JOIN users ON users."id" = cls."userId"
      WHERE cls."userId" = '${userId}'
    ;`;

    const foundLikeStatuses = await this.dataSource.query(query);

    return foundLikeStatuses;
  }
  /*async getLikeStatusCount(
    parentId: string,
    pageType: PageType,
    likeStatus: LikeStatuses,
  ): Promise<number> {
    const count = await this.LikeStatusModel.countDocuments({
      parentId,
      pageType,
      likeStatus,
    });

    return count;
  }*/
  // Удаление лайка по идентификатору комментария или поста
  /*async deleteLikeStatusesByCommentId(
    parentId: string,
    pageType: PageType,
  ): Promise<boolean> {
    await this.LikeStatusModel.deleteMany({
      parentId,
      pageType,
    });

    return true;
  }*/
  // Удаление коллекции
  /*async deleteAll(): Promise<boolean> {
    const { deletedCount } = await this.LikeStatusModel.deleteMany({});

    return deletedCount === 1;
  }*/
  /*// Бан лайков пользователя
  async banUserLikeStatuses(
    userId: string,
    isBanned: boolean,
  ): Promise<boolean> {
    const { modifiedCount } = await this.LikeStatusModel.updateMany(
      { userId },
      { $set: { isBanned } },
    );

    return modifiedCount > 0;
  }*/
}
