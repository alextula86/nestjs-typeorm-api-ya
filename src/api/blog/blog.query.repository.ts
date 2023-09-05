import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  ResponseViewModelDetail,
  SortDirection,
  BlogSubscriptionStatus,
} from '../../types';
import { QueryBlogModel, BlogViewModel, BlogViewAdminModel } from './types';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllBlogs(
    userId: string,
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryBlogModel,
  ): Promise<ResponseViewModelDetail<BlogViewModel>> {
    const userUUID = userId ? `'${userId}'` : null;
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
        blogs."id",
        blogs."name",
        blogs."description",
        blogs."websiteUrl",
        blogs."isMembership",
        blogs."createdAt",
        wallpapers."url" as "wallpaperUrl",
        wallpapers."width" as "wallpaperWidth",
        wallpapers."height" as "wallpaperHeight",
        wallpapers."fileSize" as "wallpaperFileSize",
        (
          SELECT json_agg(e)
          FROM (
            SELECT
              bmp."url",
              bmp."width",
              bmp."height",
              bmp."fileSize"
            FROM blog_main_images as bmp
            WHERE bmp."blogId" = blogs."id"
          ) e
        ) as "blogMainImages",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL
            THEN
              (
                SELECT bs."status"
                FROM blog_subscription as bs
                WHERE
                  bs."blogId" = blogs."id" AND bs."userId" = ${userUUID}
              )
            ELSE '${BlogSubscriptionStatus.NONE}'
        END, '${BlogSubscriptionStatus.NONE}') as  "currentUserSubscriptionStatus",
        (
          SELECT COUNT(*)
          FROM blog_subscription as bs
          WHERE 
            bs."blogId" = blogs."id" AND bs."status" = '${BlogSubscriptionStatus.SUBSCRIBED}'
        ) as "subscribersCount"        
      FROM blogs
      LEFT JOIN wallpapers ON wallpapers."blogId" = blogs."id"
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
  async findBlogById(blogId: string, userId: string): Promise<BlogViewModel> {
    const userUUID = userId ? `'${userId}'` : null;

    const query = `
      SELECT
        blogs."id",
        blogs."name",
        blogs."description",
        blogs."websiteUrl",
        blogs."isMembership",
        blogs."createdAt",
        wallpapers."url" as "wallpaperUrl",
        wallpapers."width" as "wallpaperWidth",
        wallpapers."height" as "wallpaperHeight",
        wallpapers."fileSize" as "wallpaperFileSize",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              bmp."url", 
              bmp."width", 
              bmp."height",
              bmp."fileSize"
            FROM blog_main_images as bmp
            WHERE bmp."blogId" = blogs."id"
          ) e
        ) as "blogMainImages",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL
            THEN
              (
                SELECT bs."status"
                FROM blog_subscription AS bs
                WHERE
                  bs."blogId" = '${blogId}' AND bs."userId" = ${userUUID}
              )
            ELSE '${BlogSubscriptionStatus.NONE}'
        END, '${BlogSubscriptionStatus.NONE}') as  "currentUserSubscriptionStatus",
        (
          SELECT COUNT(*)
          FROM blog_subscription as bs
          WHERE 
            bs."blogId" = '${blogId}' AND bs."status" = '${BlogSubscriptionStatus.SUBSCRIBED}'
        ) as "subscribersCount"
      FROM blogs
      LEFT JOIN wallpapers ON wallpapers."blogId" = blogs."id"
      WHERE blogs."id" = '${blogId}' AND blogs."isBanned" = false;
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
        blogs."id", 
        blogs."name", 
        blogs."description",
        blogs."websiteUrl",
        blogs."userId",
        blogs."isMembership", 
        blogs."isBanned",
        blogs."banDate",
        blogs."createdAt",
        wallpapers."url" as "wallpaperUrl",
        wallpapers."width" as "wallpaperWidth",
        wallpapers."height" as "wallpaperHeight",
        wallpapers."fileSize" as "wallpaperFileSize",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              bmp."url", 
              bmp."width", 
              bmp."height",
              bmp."fileSize"
            FROM blog_main_images as bmp
            WHERE bmp."blogId" = blogs."id"
          ) e
        ) as "blogMainImages"
      FROM blogs
      LEFT JOIN wallpapers ON wallpapers."blogId" = blogs."id"
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
      images: {
        wallpaper: blog.wallpaperUrl
          ? {
              url: blog.wallpaperUrl
                ? `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${blog.wallpaperUrl}`
                : '',
              width: blog.wallpaperWidth ? blog.wallpaperWidth : 0,
              height: blog.wallpaperHeight ? blog.wallpaperHeight : 0,
              fileSize: blog.wallpaperFileSize ? blog.wallpaperFileSize : 0,
            }
          : null,
        main: !isEmpty(blog.blogMainImages)
          ? blog.blogMainImages.map((item) => ({
              url: `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${item.url}`,
              width: item.width,
              height: item.height,
              fileSize: item.fileSize,
            }))
          : [],
      },
      currentUserSubscriptionStatus:
        blog.currentUserSubscriptionStatus || BlogSubscriptionStatus.NONE,
      subscribersCount: blog.subscribersCount
        ? Number(blog.subscribersCount)
        : 0,
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
        images: {
          wallpaper: item.wallpaperUrl
            ? {
                url: item.wallpaperUrl
                  ? `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${item.wallpaperUrl}`
                  : '',
                width: item.wallpaperWidth ? item.wallpaperWidth : 0,
                height: item.wallpaperHeight ? item.wallpaperHeight : 0,
                fileSize: item.wallpaperFileSize ? item.wallpaperFileSize : 0,
              }
            : null,
          main: !isEmpty(item.blogMainImages)
            ? item.blogMainImages.map((i) => ({
                url: `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${i.url}`,
                width: i.width,
                height: i.height,
                fileSize: i.fileSize,
              }))
            : [],
        },
        currentUserSubscriptionStatus:
          item.currentUserSubscriptionStatus || BlogSubscriptionStatus.NONE,
        subscribersCount: item.subscribersCount
          ? Number(item.subscribersCount)
          : 0,
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
      return `ORDER BY "${sortBy}" ${sortDirection}`;
    }

    return `ORDER BY "${sortBy}" COLLATE \"C\" ${sortDirection}`;
  }
}
