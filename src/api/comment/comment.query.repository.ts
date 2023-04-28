import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  LikeStatuses,
  // PageType,
  ResponseViewModelDetail,
  SortDirection,
} from '../../types';

// import { LikeStatus, LikeStatusModelType } from '../likeStatus/schemas';

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
    console.log('findCommentsByPostId userId', userId);
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const orderBy = this.getOrderBy(sortBy, sortDirection);

    const where = `
      WHERE comments."postId" = '${postId}' AND comments."isBanned" = false
    `;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) FROM comments ${where};
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
        COALESCE(likesCount."likesCount", 0) as "likesCount",
        COALESCE(dislikesCount."dislikesCount", 0) as "dislikesCount",
        COALESCE(likeStatus."likeStatus", 'None') as "likeStatus"
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      LEFT JOIN (
        SELECT "commentId", COUNT(*) as "likesCount"
        FROM comment_like_status
        WHERE "likeStatus" = 'Like'
        GROUP BY "commentId"
      ) as likesCount ON likesCount."commentId" = comments."id"
      LEFT JOIN (
        SELECT "commentId", COUNT(*) as "dislikesCount"
        FROM comment_like_status
        WHERE "likeStatus" = 'Dislike'
        GROUP BY "commentId"
      ) as dislikesCount ON dislikesCount."commentId" = comments."id"
      LEFT JOIN (
        SELECT "commentId", "likeStatus"
        FROM comment_like_status
        WHERE "userId" = '${userId}'
      ) as likeStatus ON likeStatus."commentId" = comments."id"
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const comments = await this.dataSource.query(query);

    /*const commentsViewModel = await Promise.all(
      comments.map(async (comment) => {
        const foundLikeStatus = await this.LikeStatusModel.findOne({
          parentId: comment.id,
          userId,
          pageType: PageType.COMMENT,
        });

        const likesCount = await this.LikeStatusModel.countDocuments({
          parentId: comment.id,
          pageType: PageType.COMMENT,
          likeStatus: LikeStatuses.LIKE,
          isBanned: false,
        });

        const dislikesCount = await this.LikeStatusModel.countDocuments({
          parentId: comment.id,
          pageType: PageType.COMMENT,
          likeStatus: LikeStatuses.DISLIKE,
          isBanned: false,
        });

        return {
          id: comment.id,
          content: comment.content,
          commentatorInfo: {
            userId: comment.userId,
            userLogin: comment.userLogin,
          },
          createdAt: comment.createdAt,
          likesInfo: {
            likesCount: likesCount,
            dislikesCount: dislikesCount,
            myStatus: foundLikeStatus
              ? foundLikeStatus.likeStatus
              : LikeStatuses.NONE,
          },
        };
      }),
    );*/

    return this._getCommentsViewModelDetail({
      pagesCount,
      totalCount,
      page: number,
      pageSize: size,
      items: comments,
    });
  }
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

    const orderBy = this.getOrderBy(sortBy, sortDirection);

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
        blogs."name" as "blogName"
      FROM comments
      LEFT JOIN users ON users."id" = comments."userId"
      LEFT JOIN posts ON posts."id" = comments."postId"
      LEFT JOIN blogs ON blogs."id" = comments."blogId"
      ${orderBy}
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
  // Поиск комментария по его идентификатору
  async findCommentById(
    commentId: string,
    userId: string,
  ): Promise<CommentViewModel | null> {
    console.log('findCommentById userId', userId);
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
      WHERE comments."id" = '${commentId}' AND comments."isBanned" = false;
    `;

    const foundComment = await this.dataSource.query(query);

    if (isEmpty(foundComment)) {
      return null;
    }

    /*const foundLikeStatus = await this.LikeStatusModel.findOne({
      parentId: foundComment.id,
      userId,
      pageType: PageType.COMMENT,
    });

    const likesCount = await this.LikeStatusModel.countDocuments({
      parentId: foundComment.id,
      pageType: PageType.COMMENT,
      likeStatus: LikeStatuses.LIKE,
      isBanned: false,
    });

    const dislikesCount = await this.LikeStatusModel.countDocuments({
      parentId: foundComment.id,
      pageType: PageType.COMMENT,
      likeStatus: LikeStatuses.DISLIKE,
      isBanned: false,
    });*/

    return this._getCommentViewModel(foundComment[0]);
  }
  _getCommentViewModel(comment: any): CommentViewModel {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        /*myStatus: foundLikeStatus
          ? foundLikeStatus.likeStatus
          : LikeStatuses.NONE,*/
        myStatus: LikeStatuses.NONE,
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
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatuses.NONE,
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
