import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { MakePostModel, UpdatePostModel } from './types';

@Injectable()
export class PostRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа конкретного поста по его идентификатору
  async findPostById(postId: string): Promise<{
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
  } | null> {
    const query = `
      SELECT 
        posts."id", 
        posts."title", 
        posts."shortDescription",
        posts."content",
        posts."blogId",
        posts."createdAt",
        blogs."name" as "blogName"
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      WHERE posts."id" = '${postId}';
    `;

    const foundPost = await this.dataSource.query(query);

    if (isEmpty(foundPost)) {
      return null;
    }

    return foundPost[0];
  }
  // Создание документа поста
  async createPost({
    title,
    shortDescription,
    content,
    blogId,
    userId,
  }: MakePostModel): Promise<{
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
  }> {
    const query = `
      INSERT INTO posts
        ("title", "shortDescription", "content", "blogId", "userId")
        VALUES ('${title}', '${shortDescription}', '${content}', '${blogId}', '${userId}')
        RETURNING *;
    `;

    const madePost = await this.dataSource.query(query);

    return madePost[0];
  }
  // Обновление поста
  async updatePost(
    postId: string,
    { title, shortDescription, content }: UpdatePostModel,
  ): Promise<boolean> {
    const query = `
        UPDATE posts
        SET 
          "title" = '${title}',
          "shortDescription" = '${shortDescription}',
          "content" = '${content}'
        WHERE "id" = '${postId}';
      `;
    await this.dataSource.query(query);

    return true;
  }
  // Удаление поста
  async deletePostById(postId: string): Promise<boolean> {
    await this.dataSource.query(`DELETE FROM posts WHERE "id" = '${postId}';`);

    return true;
  }
  // Удаление коллекции
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE posts;`);

    return true;
  }
  // Бан постов блогера
  async banPostsByBlogId(blogId: string, isBanned: boolean): Promise<boolean> {
    const query = `
      UPDATE posts
      SET "isBanned" = ${isBanned}
      WHERE "blogId" = '${blogId}';
    `;
    await this.dataSource.query(query);

    return true;
  }
}
