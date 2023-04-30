import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  LikeStatuses,
  ResponseViewModelDetail,
  SortDirection,
} from '../../types';

import {
  CommentViewModel,
  QueryCommentModel,
  CommentByPostViewModel,
} from './types';

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск комментариев по идентификатору поста
  async findCommentsByPostId(
    postId: string,
    userId: string,
    {
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryCommentModel,
  ): Promise<ResponseViewModelDetail<CommentViewModel>> {
    const userUUID = userId ? `'${userId}'` : null;

    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM comments
      WHERE comments."postId" = '${postId}' AND comments."isBanned" = false;
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

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
        posts."title" as "postTitle",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Like'
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Dislike'
        ) as "dislikesCount",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL 
            THEN
              (
                SELECT cls."likeStatus"
                FROM comment_like_status as cls
                WHERE 
                  cls."commentId" = comments."id" AND cls."isBanned" = false AND cls."userId" = ${userUUID}
              ) 
            ELSE '${LikeStatuses.NONE}'
        END, '${LikeStatuses.NONE}') as "likeStatus"
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      WHERE comments."postId" = '${postId}' AND comments."isBanned" = false
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const comments = await this.dataSource.query(query);

    return this._getCommentsViewModelDetail({
      pagesCount,
      totalCount,
      page: number,
      pageSize: size,
      items: comments,
    });
  }
  // Поиск комментария по его идентификатору
  async findCommentById(
    commentId: string,
    userId: string,
  ): Promise<CommentViewModel | null> {
    const userUUID = userId ? `'${userId}'` : null;

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
        posts."title" as "postTitle",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Like'
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Dislike'
        ) as "dislikesCount",
        COALESCE(
          CASE WHEN ${userUUID} IS NOT NULL 
            THEN
              (
                SELECT cls."likeStatus"
                FROM comment_like_status as cls
                WHERE 
                  cls."commentId" = comments."id" AND cls."isBanned" = false AND cls."userId" = ${userUUID}
              ) 
            ELSE '${LikeStatuses.NONE}'
        END, '${LikeStatuses.NONE}') as "likeStatus"
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      WHERE comments."id" = '${commentId}' AND comments."isBanned" = false;
    `;

    const foundComment = await this.dataSource.query(query);

    if (isEmpty(foundComment)) {
      return null;
    }

    return this._getCommentViewModel(foundComment[0]);
  }
  // Поиск комментарий по всем постам
  async findCommentsByAllPosts({
    pageNumber,
    pageSize,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
  }: QueryCommentModel): Promise<
    ResponseViewModelDetail<CommentByPostViewModel>
  > {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM comments;
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        comments."id",
        comments."content",
        comments."createdAt",
        comments."isBanned",
        users."id" as "userId",
        users."login" as "userLogin",
        posts."id" as "postId",
        posts."title" as "postTitle",
        blogs."id" as "blogId",
        blogs."name" as "blogName",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Like'
        ) as "likesCount",
        (
          SELECT COUNT(*)
          FROM comment_like_status as cls
          WHERE cls."commentId" = comments."id" AND "likeStatus" = 'Dislike'
        ) as "dislikesCount",
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const comments = await this.dataSource.query(query);

    /*const totalCount = await this.CommentModel.countDocuments();
    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const comments = await this.CommentModel.aggregate([
      { $sort: { [sortBy]: sortDirection === SortDirection.ASC ? 1 : -1 } },
      { $skip: skip },
      { $limit: size },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: 'id',
          as: 'post',
        },
      },
      { $unwind: '$post' },
      {
        $project: {
          _id: 0,
          id: 1,
          content: 1,
          createdAt: 1,
          commentatorInfo: {
            userId: '$userId',
            userLogin: '$userLogin',
          },
          postInfo: {
            id: '$post.id',
            title: '$post.title',
            blogId: '$post.blogId',
            blogName: '$post.blogName',
          },
        },
      },
    ]);*/

    return this._getCommentByPostViewModelDetail({
      pagesCount,
      totalCount,
      page: number,
      pageSize: size,
      items: comments,
    });
  }
  _getCommentViewModel(comment: any): CommentViewModel {
    console.log('comment', comment);
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.likeStatus,
      },
    };
  }
  _getCommentsViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<CommentViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => ({
        id: item.id,
        content: item.content,
        commentatorInfo: {
          userId: item.userId,
          userLogin: item.userLogin,
        },
        createdAt: item.createdAt,
        likesInfo: {
          likesCount: item.likesCount,
          dislikesCount: item.dislikesCount,
          myStatus: item.likeStatus,
        },
      })),
    };
  }
  _getCommentByPostViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<CommentByPostViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item: any) => ({
        id: item.id,
        content: item.content,
        commentatorInfo: {
          userId: item.userId,
          userLogin: item.userLogin,
        },
        createdAt: item.createdAt,
        postInfo: {
          id: item.postId,
          title: item.postTitle,
          blogId: item.blogId,
          blogName: item.blogName,
        },
        /*likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatuses.NONE,
        },*/
      })),
    };
  }
  /*getOrderBy(sortBy: string, sortDirection: SortDirection) {
    if (sortBy === 'createdAt') {
      return `ORDER BY "${sortBy}" ${sortDirection}`;
    }

    return `ORDER BY "${sortBy}" COLLATE \"C\" ${sortDirection}`;
  }*/
}
