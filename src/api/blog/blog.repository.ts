import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { MakeBlogModel, UpdateBlogModel } from './types';
import { Blogs } from './entities';
@Injectable()
export class BlogRepository {
  constructor(
    @InjectRepository(Blogs) private readonly blogRepository: Repository<Blogs>,
  ) {}
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

    const foundBlog = await this.blogRepository.query(query);

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
    const madeBlog = await this.blogRepository
      .createQueryBuilder()
      .insert()
      .into(Blogs)
      .values({
        name,
        description,
        websiteUrl,
        userId,
      })
      .returning(['id'])
      .execute();

    return madeBlog.raw[0];
  }
  // Обновление блогера
  async updateBlog(
    blogId: string,
    { name, description, websiteUrl }: UpdateBlogModel,
  ): Promise<boolean> {
    /*const query = `
        UPDATE blogs
        SET
          "name" = '${name}',
          "description" = '${description}',
          "websiteUrl" = '${websiteUrl}'
        WHERE "id" = '${blogId}';
      `;
    await this.blogRepository.query(query);*/

    await this.blogRepository
      .createQueryBuilder()
      .update(Blogs)
      .set({ name, description, websiteUrl })
      .where('id = :blogId', { blogId })
      .execute();

    return true;
  }
  // Удаление блогера
  async deleteBlogById(blogId: string): Promise<boolean> {
    await this.blogRepository.query(`
      DELETE FROM posts WHERE "blogId" = '${blogId}';
      DELETE FROM ban_user_for_blog WHERE "blogId" = '${blogId}';
      DELETE FROM blogs WHERE "id" = '${blogId}';
    `);

    return true;
  }
  // Бан блогера
  async banBlog(blogId: string, isBanned: boolean): Promise<boolean> {
    const banDate = isBanned ? `'${new Date().toISOString()}'` : null;

    /*const query = `
      UPDATE blogs
      SET 
        "isBanned" = ${isBanned},
        "banDate" = ${banDate}
      WHERE "id" = '${blogId}';
    `;

    await this.blogRepository.query(query);*/

    await this.blogRepository
      .createQueryBuilder()
      .update(Blogs)
      .set({ isBanned, banDate })
      .where('id = :blogId', { blogId })
      .execute();

    return true;
  }
  // Привязка пользователя к блогу
  async bindWithUser(userId: string, blogId: string): Promise<boolean> {
    /*const query = `
      UPDATE blogs
      SET 
        "userId" = '${userId}'
      WHERE "id" = '${blogId}';
    `;

    await this.blogRepository.query(query);*/

    await this.blogRepository
      .createQueryBuilder()
      .update(Blogs)
      .set({ userId })
      .where('id = :blogId', { blogId })
      .execute();

    return true;
  }
}
