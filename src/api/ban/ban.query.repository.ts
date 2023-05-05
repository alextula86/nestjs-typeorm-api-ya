import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { ResponseViewModelDetail, SortDirection } from '../../types';
import { QueryVannedUserModel, BannedUserViewModel } from './types';

@Injectable()
export class BanQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllBannedUsersForBlog(
    blogId: string,
    {
      searchLoginTerm,
      pageNumber,
      pageSize,
      sortBy = 'createdAt',
      sortDirection = SortDirection.DESC,
    }: QueryVannedUserModel,
  ): Promise<ResponseViewModelDetail<BannedUserViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];

    if (searchLoginTerm) {
      terms.push(`u."login" ILIKE '%${searchLoginTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE bufb."blogId" = '${blogId}' AND bufb."isBanned" = true AND ${terms.join(
          ' OR ',
        )}`
      : `WHERE bufb."blogId" = '${blogId}' AND bufb."isBanned" = true`;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) 
      FROM ban_user_for_blog as bufb
      LEFT JOIN users as u ON u."id" = bufb."userId"
      ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        bufb."id", 
        bufb."isBanned", 
        bufb."banDate",
        bufb."banReason",
        bufb."createdAt",
        u."login" as "userLogin",
        u."id" as "userId"
      FROM ban_user_for_blog as bufb
      LEFT JOIN users as u ON u."id" = bufb."userId"
      ${where}
      ORDER BY "${sortBy}" ${sortDirection}
      ${offset}
      ${limit};
    `;

    const foundBanUserForBlog = await this.dataSource.query(query);

    return this._getBlogsViewModelDetail({
      items: foundBanUserForBlog,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  _getBlogsViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<BannedUserViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => ({
        id: item.userId,
        login: item.userLogin,
        banInfo: {
          isBanned: item.isBanned,
          banDate: item.banDate,
          banReason: item.banReason,
        },
      })),
    };
  }
}
