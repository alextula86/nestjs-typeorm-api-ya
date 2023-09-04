import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  LikeStatuses,
  ResponseViewModelDetail,
  SortDirection,
} from '../../types';
import { QueryPostModel, PostViewModel, NewestLikes } from './types';

@Injectable()
export class PostQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Получение списка постов
  async findAllPosts(
    userId: string,
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryPostModel,
  ): Promise<ResponseViewModelDetail<PostViewModel>> {
    const userUUID = userId ? `'${userId}'` : null;

    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];

    if (searchNameTerm) {
      terms.push(`posts."title" ILIKE '%${searchNameTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE posts."isBanned" = false AND ${terms.join(' OR ')}`
      : 'WHERE posts."isBanned" = false';

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM posts ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        posts."id", 
        posts."title", 
        posts."shortDescription",
        posts."content",
        posts."createdAt",
        blogs."id" as "blogId",
        blogs."name" as "blogName",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              pls."createdAt" as "addedAt",
              users."id" as "userId",
              users."login" as "login"
            FROM post_like_status AS pls
            LEFT JOIN users ON users."id" = pls."userId"
            WHERE pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
            ORDER BY pls."createdAt" desc
            LIMIT 3
          ) e
        ) as "newestLikes",
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."isBanned" = false AND pls."likeStatus" = '${LikeStatuses.DISLIKE}'
        ) as "dislikesCount",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL 
            THEN
              (
                SELECT pls."likeStatus"
                FROM post_like_status as pls
                WHERE 
                  pls."postId" = posts."id" AND pls."userId" = ${userUUID}
              ) 
            ELSE '${LikeStatuses.NONE}'
        END, '${LikeStatuses.NONE}') as  "likeStatus",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              bmp."url", 
              bmp."width", 
              bmp."height",
              bmp."fileSize"
            FROM post_main_images as bmp
            WHERE bmp."postId" = posts."id"
          ) e
        ) as "postMainImages"          
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      ${where}
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const posts = await this.dataSource.query(query);

    return this._getPostsViewModelDetail({
      pagesCount,
      totalCount,
      page: number,
      pageSize: size,
      items: posts,
    });
  }
  // Получение списка постов по идентификатору блогера
  async findPostsByBlogId(
    blogId: string,
    userId: string,
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryPostModel,
  ): Promise<ResponseViewModelDetail<PostViewModel>> {
    const userUUID = userId ? `'${userId}'` : null;
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];

    if (searchNameTerm) {
      terms.push(`posts."title" ILIKE '%${searchNameTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE posts."blogId" = '${blogId}' AND posts."isBanned" = false AND ${terms.join(
          ' OR ',
        )}`
      : `WHERE posts."blogId" = '${blogId}' AND posts."isBanned" = false`;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM posts ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        posts."id", 
        posts."title", 
        posts."shortDescription",
        posts."content",
        posts."createdAt",
        blogs."id" as "blogId",
        blogs."name" as "blogName",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              pls."createdAt" as "addedAt",
              users."id" as "userId",
              users."login" as "login"
            FROM post_like_status AS pls
            LEFT JOIN users ON users."id" = pls."userId"
            WHERE pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
            ORDER BY pls."createdAt" desc
            LIMIT 3
          ) e
        ) as "newestLikes",        
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.DISLIKE}' AND pls."isBanned" = false
        ) as "dislikesCount",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL 
            THEN
              (
                SELECT pls."likeStatus"
                FROM post_like_status as pls
                WHERE 
                  pls."postId" = posts."id" AND pls."userId" = ${userUUID}
              ) 
            ELSE '${LikeStatuses.NONE}'
        END, '${LikeStatuses.NONE}') as  "likeStatus",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              bmp."url", 
              bmp."width", 
              bmp."height",
              bmp."fileSize"
            FROM post_main_images as bmp
            WHERE bmp."postId" = posts."id"
          ) e
        ) as "postMainImages"          
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      ${where}
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const posts = await this.dataSource.query(query);

    return this._getPostsViewModelDetail({
      pagesCount,
      totalCount,
      page: number,
      pageSize: size,
      items: posts,
    });
  }
  // Получение конкретного поста по его идентификатору
  async findPostById(
    postId: string,
    userId: string,
  ): Promise<PostViewModel | null> {
    const userUUID = userId ? `'${userId}'` : null;

    const query = `
      SELECT 
        posts."id", 
        posts."title", 
        posts."shortDescription",
        posts."content",
        posts."createdAt",
        blogs."id" as "blogId",
        blogs."name" as "blogName",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              pls."createdAt" as "addedAt",
              users."id" as "userId",
              users."login" as "login"
            FROM post_like_status AS pls
            LEFT JOIN users ON users."id" = pls."userId"
            WHERE pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
            ORDER BY pls."createdAt" desc
            LIMIT 3
          ) e
        ) as "newestLikes",
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.LIKE}' AND pls."isBanned" = false
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM post_like_status as pls
          WHERE 
            pls."postId" = posts."id" AND pls."likeStatus" = '${LikeStatuses.DISLIKE}' AND pls."isBanned" = false
        ) as "dislikesCount",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL 
            THEN
              (
                SELECT pls."likeStatus"
                FROM post_like_status as pls
                WHERE 
                  pls."postId" = posts."id" AND pls."userId" = ${userUUID}
              ) 
            ELSE '${LikeStatuses.NONE}'
        END, '${LikeStatuses.NONE}') as  "likeStatus",
        (
          SELECT json_agg(e)
          FROM (
            SELECT 
              bmp."url", 
              bmp."width", 
              bmp."height",
              bmp."fileSize"
            FROM post_main_images as bmp
            WHERE bmp."postId" = posts."id"
          ) e
        ) as "postMainImages"         
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      WHERE posts."id" = '${postId}' AND posts."isBanned" = false;
    `;

    const foundPost = await this.dataSource.query(query);

    if (isEmpty(foundPost)) {
      return null;
    }

    return this._getPostViewModel(foundPost[0]);
  }
  _getPostViewModel(post: any): PostViewModel {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: +post.likesCount,
        dislikesCount: +post.dislikesCount,
        myStatus: post.likeStatus,
        newestLikes: !isEmpty(post.newestLikes)
          ? post.newestLikes.map((i: NewestLikes) => ({
              addedAt: i.addedAt,
              userId: i.userId,
              login: i.login,
            }))
          : [],
      },
      /*images: {
        main: !isEmpty(post.postMainImages)
          ? post.postMainImages.map((item) => ({
              url: `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${item.url}`,
              width: item.width,
              height: item.height,
              fileSize: item.fileSize,
            }))
          : [],
      },*/
    };
  }
  _getPostsViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<PostViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => {
        return {
          id: item.id,
          title: item.title,
          shortDescription: item.shortDescription,
          content: item.content,
          blogId: item.blogId,
          blogName: item.blogName,
          createdAt: item.createdAt,
          extendedLikesInfo: {
            likesCount: +item.likesCount,
            dislikesCount: +item.dislikesCount,
            myStatus: item.likeStatus,
            newestLikes: !isEmpty(item.newestLikes)
              ? item.newestLikes.map((i: NewestLikes) => ({
                  addedAt: i.addedAt,
                  userId: i.userId,
                  login: i.login,
                }))
              : [],
          },
          /*images: {
            main: !isEmpty(item.postMainImages)
              ? item.postMainImages.map((i) => ({
                  url: `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${i.url}`,
                  width: i.width,
                  height: i.height,
                  fileSize: i.fileSize,
                }))
              : [],
          },*/
        };
      }),
    };
  }
}
