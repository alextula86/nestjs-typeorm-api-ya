import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import { ResponseViewModelDetail, SortDirection } from '../../types';
import { QueryBlogModel, BlogViewModel, BlogViewAdminModel } from './types';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllBlogs({
    searchNameTerm,
    pageNumber,
    pageSize,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
  }: QueryBlogModel): Promise<ResponseViewModelDetail<BlogViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = this.getOrderBy(sortBy, sortDirection);

    if (searchNameTerm) {
      terms.push(`"name" ILIKE '%${searchNameTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE "isBanned" = false AND ${terms.join(' OR ')}`
      : `WHERE "isBanned" = false`;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM blogs ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        "id", 
        "name", 
        "description",
        "websiteUrl",
        "isMembership", 
        "createdAt"
      FROM blogs
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const blogs = await this.dataSource.query(query);

    return this._getBlogsViewModelDetail({
      items: blogs,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  async findBlogById(blogId: string): Promise<{
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
    createdAt: string;
  } | null> {
    const query = `
      SELECT
        "id",
        "name",
        "description",
        "websiteUrl",
        "isMembership",
        "createdAt"
      FROM blogs
      WHERE "id" = '${blogId}' AND "isBanned" = false;
    `;

    const foundBlog = await this.dataSource.query(query);

    if (isEmpty(foundBlog)) {
      return null;
    }

    return this._getBlogViewModel(foundBlog[0]);
  }
  async findAllBlogsByUserId(
    userId: string,
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryBlogModel,
  ): Promise<ResponseViewModelDetail<BlogViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = this.getOrderBy(sortBy, sortDirection);

    if (searchNameTerm) {
      terms.push(`"name" ILIKE '%${searchNameTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE "userId" = '${userId}' AND "isBanned" = false AND ${terms.join(
          ' OR ',
        )}`
      : `WHERE "userId" = '${userId}' AND "isBanned" = false`;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM blogs ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

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
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const blogsByUserId = await this.dataSource.query(query);

    return this._getBlogsViewModelDetail({
      items: blogsByUserId,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  async findAllBlogsForAdmin({
    searchNameTerm,
    pageNumber,
    pageSize,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
  }: QueryBlogModel): Promise<ResponseViewModelDetail<BlogViewAdminModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = this.getOrderBy(sortBy, sortDirection);

    if (searchNameTerm) {
      terms.push(`blogs."name" ILIKE '%${searchNameTerm}%'`);
    }

    const where = !isEmpty(terms) ? `WHERE ${terms.join(' OR ')}` : '';

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM blogs ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        blogs."id", 
        blogs."name", 
        blogs."description",
        blogs."websiteUrl",
        blogs."userId",
        blogs."isMembership", 
        blogs."isBanned",
        blogs."banDate",
        blogs."createdAt",
        users."login" as "userLogin"
      FROM blogs
      LEFT JOIN users ON users."id" = blogs."userId"
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const blogs = await this.dataSource.query(query);

    return this._getBlogsViewAdminModelDetail({
      items: blogs,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  _getBlogViewModel(blog: any): BlogViewModel {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      isMembership: blog.isMembership,
      createdAt: blog.createdAt,
    };
  }
  _getBlogsViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<BlogViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        websiteUrl: item.websiteUrl,
        isMembership: item.isMembership,
        createdAt: item.createdAt,
      })),
    };
  }
  _getBlogsViewAdminModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<BlogViewAdminModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        websiteUrl: item.websiteUrl,
        isMembership: item.isMembership,
        createdAt: item.createdAt,
        blogOwnerInfo: {
          userId: item.userId,
          userLogin: item.userLogin,
        },
        banInfo: {
          isBanned: item.isBanned,
          banDate: item.banDate,
        },
      })),
    };
  }
  getOrderBy(sortBy: string, sortDirection: SortDirection) {
    if (sortBy === 'createdAt') {
      return `ORDER BY blogs."${sortBy}" ${sortDirection}`;
    }

    return `ORDER BY blogs."${sortBy}" COLLATE \"C\" ${sortDirection}`;
  }
}
