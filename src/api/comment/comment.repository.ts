import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { MakeCommentModel, UpdateCommentModel } from './types';

@Injectable()
export class CommentRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа конкретного комментария по его идентификатору
  async findCommentById(commentId: string): Promise<{
    id: string;
    content: string;
    createdAt: string;
    isBanned: boolean;
    userId: string;
    userLogin: string;
    blogId: string;
    blogName: string;
    postId: string;
    postTitle: string;
  } | null> {
    const query = `
      SELECT 
        comments."id",
        comments."content",
        comments."createdAt",
        comments."isBanned",
        users."id" as "userId",
        users."login" as "userLogin",
        blogs."id" as "blogId",
        blogs."name" as "blogName",
        posts."id" as "postId",
        posts."title" as "postTitle"
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      WHERE comments."id" = '${commentId}'
    ;`;

    const foundComment = await this.dataSource.query(query);

    if (isEmpty(foundComment)) {
      return null;
    }

    return foundComment[0];
  }
  // Создание документа комментария
  async createComment({
    content,
    postId,
    blogId,
    userId,
  }: MakeCommentModel): Promise<{
    id: string;
    content: string;
    isBanned: boolean;
    postId: string;
    blogId: string;
    userId: string;
    createdAt: string;
  }> {
    const query = `
      INSERT INTO comments
        ("content", "postId", "blogId", "userId")
        VALUES ('${content}', '${postId}', '${blogId}', '${userId}')
        RETURNING *;
    `;

    const madeComment = await this.dataSource.query(query);

    return madeComment[0];
  }
  // Обновление комментария
  async updateComment(
    commentId: string,
    { content }: UpdateCommentModel,
  ): Promise<boolean> {
    const query = `
        UPDATE comments
        SET "content" = '${content}'
        WHERE "id" = '${commentId}';
      `;

    await this.dataSource.query(query);

    return true;
  }
  // Удаление комментария
  async deleteCommentById(commentId: string): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM comments WHERE "id" = '${commentId}';
    `);

    return true;
  }
  // Удаление коллекции
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE comments;`);

    return true;
  }
  // Бан комментариев пользователя
  async banCommentsByUserId(
    userId: string,
    isBanned: boolean,
  ): Promise<boolean> {
    const query = `
      UPDATE comments
      SET "isBanned" = ${isBanned}
      WHERE "userId" = '${userId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
}
