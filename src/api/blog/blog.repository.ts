import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { MakeBlogModel, UpdateBlogModel } from './types';

@Injectable()
export class BlogRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск документа конкретного блогера по его идентификатору
  async findBlogById(blogId: string): Promise<{
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    userId: string;
    isMembership: boolean;
    isBanned: boolean;
    banDate: Date;
    createdAt: string;
  }> {
    const query = `
      SELECT 
        "id", 
        "name", 
        "description",
        "websiteUrl",
        "userId",
        "isMembership", 
        "isBanned",
        "banDate",
        "createdAt"
      FROM blogs
      WHERE "id" = '${blogId}';
    `;

    const foundBlog = await this.dataSource.query(query);

    if (isEmpty(foundBlog)) {
      return null;
    }

    return foundBlog[0];
  }
  // Создание блогера
  async createBlog({
    name,
    description,
    websiteUrl,
    userId,
  }: MakeBlogModel): Promise<{
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    userId: string;
    isMembership: boolean;
    isBanned: boolean;
    banDate: Date;
    createdAt: string;
  }> {
    const query = `
      INSERT INTO blogs
        ("name", "description", "websiteUrl", "userId")
        VALUES ('${name}', '${description}', '${websiteUrl}', '${userId}')
        RETURNING *;
    `;

    const madeBlog = await this.dataSource.query(query);

    return madeBlog[0];
  }
  // Обновление блогера
  async updateBlog(
    blogId: string,
    { name, description, websiteUrl }: UpdateBlogModel,
  ): Promise<boolean> {
    const query = `
        UPDATE blogs
        SET
          "name" = '${name}',
          "description" = '${description}',
          "websiteUrl" = '${websiteUrl}'
        WHERE "id" = '${blogId}';
      `;
    await this.dataSource.query(query);

    return true;
  }
  // Удаление блогера
  async deleteBlogById(blogId: string): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM posts WHERE "blogId" = '${blogId}';
      DELETE FROM ban_user_info WHERE "blogId" = '${blogId}';
      DELETE FROM blogs WHERE "id" = '${blogId}';
    `);

    return true;
  }
  // Бан блогера
  async banBlog(blogId: string, isBanned: boolean): Promise<boolean> {
    const banDate = isBanned ? `'${new Date().toISOString()}'` : null;

    const query = `
      UPDATE blogs
      SET 
        "isBanned" = ${isBanned},
        "banDate" = ${banDate}
      WHERE "id" = '${blogId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
  // Привязка пользователя к блогу
  async bindWithUser(userId: string, blogId: string): Promise<boolean> {
    const query = `
      UPDATE blogs
      SET 
        "userId" = '${userId}'
      WHERE "id" = '${blogId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
  // Очистить таблицу блогеров
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`TRUNCATE TABLE blogs;`);

    return true;
  }
}
