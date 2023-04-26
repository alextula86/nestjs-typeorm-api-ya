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

// import { Post, PostModelType } from './schemas';
import { QueryPostModel, PostViewModel } from './types';

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
    console.log('findAllPosts userId', userId);
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = this.getOrderBy(sortBy, sortDirection);

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
        posts."blogId",
        posts."createdAt",
        blogs."name" as "blogName"
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const posts = await this.dataSource.query(query);

    /*const postsViewModel = await Promise.all(
      posts.map(async (post) => {
        const foundLikeStatus = await this.LikeStatusModel.findOne({
          parentId: post.id,
          userId,
          pageType: PageType.POST,
        });

        const newestLikes = await this.LikeStatusModel.find({
          parentId: post.id,
          likeStatus: LikeStatuses.LIKE,
          pageType: PageType.POST,
          isBanned: false,
        })
          .sort({ createdAt: -1 })
          .limit(3);

        const likesCount = await this.LikeStatusModel.countDocuments({
          parentId: post.id,
          pageType: PageType.POST,
          likeStatus: LikeStatuses.LIKE,
          isBanned: false,
        });

        const dislikesCount = await this.LikeStatusModel.countDocuments({
          parentId: post.id,
          pageType: PageType.POST,
          likeStatus: LikeStatuses.DISLIKE,
          isBanned: false,
        });

        return {
          id: post.id,
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
          createdAt: post.createdAt,
          extendedLikesInfo: {
            // likesCount: post.likesCount,
            // dislikesCount: post.dislikesCount,
            likesCount: likesCount,
            dislikesCount: dislikesCount,
            myStatus: foundLikeStatus
              ? foundLikeStatus.likeStatus
              : LikeStatuses.NONE,
            newestLikes: newestLikes.map((i) => ({
              addedAt: i.createdAt,
              userId: i.userId,
              login: i.userLogin,
            })),
          },
        };
      }),
    );*/

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
    console.log('findPostsByBlogId userId', userId);
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = this.getOrderBy(sortBy, sortDirection);

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
        posts."blogId",
        posts."createdAt",
        blogs."name" as "blogName"
      FROM posts
      LEFT JOIN blogs ON blogs."id" = posts."blogId"
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const posts = await this.dataSource.query(query);

    /* const postsViewModel = await Promise.all(
      posts.map(async (post) => {
        const foundLikeStatus = await this.LikeStatusModel.findOne({
          parentId: post.id,
          userId,
          pageType: PageType.POST,
        });

        const newestLikes = await this.LikeStatusModel.find({
          parentId: post.id,
          likeStatus: LikeStatuses.LIKE,
          pageType: PageType.POST,
          isBanned: false,
        })
          .sort({ createdAt: -1 })
          .limit(3);

        const likesCount = await this.LikeStatusModel.countDocuments({
          parentId: post.id,
          pageType: PageType.POST,
          likeStatus: LikeStatuses.LIKE,
          isBanned: false,
        });

        const dislikesCount = await this.LikeStatusModel.countDocuments({
          parentId: post.id,
          pageType: PageType.POST,
          likeStatus: LikeStatuses.DISLIKE,
          isBanned: false,
        });

        return {
          id: post.id,
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
          createdAt: post.createdAt,
          extendedLikesInfo: {
            // likesCount: post.likesCount,
            // dislikesCount: post.dislikesCount,
            likesCount: likesCount,
            dislikesCount: dislikesCount,
            myStatus: foundLikeStatus
              ? foundLikeStatus.likeStatus
              : LikeStatuses.NONE,
            newestLikes: newestLikes.map((i) => ({
              addedAt: i.createdAt,
              userId: i.userId,
              login: i.userLogin,
            })),
          },
        };
      }),
    );*/

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
    console.log('findPostById userId', userId);
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
      WHERE posts."id" = '${postId}' AND posts."isBanned" = false;
    `;

    const foundPost = await this.dataSource.query(query);

    if (!foundPost) {
      return null;
    }

    /*const foundLikeStatusByUserId = await this.LikeStatusModel.findOne({
      parentId: foundPost.id,
      userId,
      pageType: PageType.POST,
    });

    const newestLikes = await this.LikeStatusModel.find({
      parentId: foundPost.id,
      likeStatus: LikeStatuses.LIKE,
      pageType: PageType.POST,
      isBanned: false,
    })
      .sort({ createdAt: -1 })
      .limit(3);

    const likesCount = await this.LikeStatusModel.countDocuments({
      parentId: foundPost.id,
      pageType: PageType.POST,
      likeStatus: LikeStatuses.LIKE,
      isBanned: false,
    });

    const dislikesCount = await this.LikeStatusModel.countDocuments({
      parentId: foundPost.id,
      pageType: PageType.POST,
      likeStatus: LikeStatuses.DISLIKE,
      isBanned: false,
    });*/

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
        // likesCount: likesCount,
        likesCount: 0,
        // dislikesCount: dislikesCount,
        dislikesCount: 0,
        /*myStatus: foundLikeStatusByUserId
          ? foundLikeStatusByUserId.likeStatus
          : LikeStatuses.NONE,*/
        myStatus: LikeStatuses.NONE,
        /*newestLikes: newestLikes.map((i) => ({
          addedAt: i.createdAt,
          userId: i.userId,
          login: i.userLogin,
        })),*/
        newestLikes: [],
      },
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
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        shortDescription: item.shortDescription,
        content: item.content,
        blogId: item.blogId,
        blogName: item.blogName,
        createdAt: item.createdAt,
        extendedLikesInfo: {
          // likesCount: likesCount,
          likesCount: 0,
          // dislikesCount: dislikesCount,
          dislikesCount: 0,
          /*myStatus: foundLikeStatus
            ? foundLikeStatus.likeStatus
            : LikeStatuses.NONE,*/
          myStatus: LikeStatuses.NONE,
          /*newestLikes: newestLikes.map((i) => ({
            addedAt: i.createdAt,
            userId: i.userId,
            login: i.userLogin,
          })),*/
          newestLikes: [],
        },
      })),
    };
  }
  getOrderBy(sortBy: string, sortDirection: SortDirection) {
    if (sortBy === 'createdAt') {
      return `ORDER BY posts."${sortBy}" ${sortDirection}`;
    }

    return `ORDER BY posts."${sortBy}" COLLATE \"C\" ${sortDirection}`;
  }
}
