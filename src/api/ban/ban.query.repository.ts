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
    const orderBy = this.getOrderBy(sortBy, sortDirection);

    if (searchLoginTerm) {
      terms.push(`u."login" ILIKE '%${searchLoginTerm}%'`);
    }

    const where = !isEmpty(terms)
      ? `WHERE bi."blogId" = '${blogId}' AND bi."isBanned" = true AND ${terms.join(
          ' OR ',
        )}`
      : `WHERE bi."blogId" = '${blogId}' AND bi."isBanned" = true`;

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*) 
      FROM ban_info as bi
      LEFT JOIN users as u ON u."id" = bi."userId"
      ${where};
    `);

    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;

    const query = `
      SELECT 
        bi."id", 
        bi."isBanned", 
        bi."banDate",
        bi."banReason",
        bi."createdAt",
        u."login",
        u."id" as "userId"
      FROM ban_info as bi
      LEFT JOIN users as u ON u."id" = bi."userId"
      ${where}
      ${orderBy}
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
        login: item.login,
        banInfo: {
          isBanned: item.isBanned,
          banDate: item.banDate,
          banReason: item.banReason,
        },
      })),
    };
  }
  getOrderBy(sortBy: string, sortDirection: SortDirection) {
    if (sortBy === 'createdAt') {
      return `ORDER BY bi."${sortBy}" ${sortDirection}`;
    }

    return `ORDER BY bi."${sortBy}" COLLATE \"C\" ${sortDirection}`;
  }
}
