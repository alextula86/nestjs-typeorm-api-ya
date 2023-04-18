import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import {
  ResponseViewModelDetail,
  SortDirection,
  BanStatuses,
} from '../../types';

import { QueryUserModel, UserViewModel } from './types';

@Injectable()
export class UserQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAllUsers({
    banStatus = BanStatuses.All,
    searchLoginTerm,
    searchEmailTerm,
    pageNumber,
    pageSize,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
  }: QueryUserModel): Promise<ResponseViewModelDetail<UserViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const terms: string[] = [];
    const orderBy = `ORDER BY u."${sortBy}" ${sortDirection}`;

    if (searchLoginTerm) {
      terms.push(`u."login" like '%${searchLoginTerm}%'`);
    }

    if (searchEmailTerm) {
      terms.push(`u."email" like '%${searchEmailTerm}%'`);
    }

    if (banStatus === BanStatuses.BANNED) {
      terms.push(`bi."isBanned" = true`);
    }

    if (banStatus === BanStatuses.NOTBANNED) {
      terms.push(`bi."isBanned" = false`);
    }

    const where = !isEmpty(terms) ? `WHERE ${terms.join(' AND ')}` : '';

    const totalCountResponse = await this.dataSource.query(`
      SELECT COUNT(*)
      FROM users as u
      LEFT JOIN ban_info as bi ON bi."userId" = u."id"
      ${where};
    `);
    const totalCount = +totalCountResponse[0].count;

    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const offset = `OFFSET ${skip}`;
    const limit = `LIMIT ${size}`;
    const query = `
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."createdAt",
        bi."isBanned", 
        bi."banDate", 
        bi."banReason"
      FROM users as u
      LEFT JOIN ban_info as bi ON bi."userId" = u."id"
      ${where}
      ${orderBy}
      ${offset}
      ${limit};
    `;

    const users = await this.dataSource.query(query);

    return this._getUsersViewModelDetail({
      items: users,
      totalCount,
      pagesCount,
      page: number,
      pageSize: size,
    });
  }
  async findUserById(userId: string): Promise<UserViewModel | null> {
    const foundUser = await this.dataSource.query(
      `SELECT * FROM users WHERE id = '${userId}';`,
    );

    if (isEmpty(foundUser)) {
      return null;
    }

    return this._getUserViewModel(foundUser[0]);
  }
  _getUserViewModel(user: any): UserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: false,
        banDate: null,
        banReason: null,
      },
    };
  }
  _getUsersViewModelDetail({
    items,
    totalCount,
    pagesCount,
    page,
    pageSize,
  }: ResponseViewModelDetail<any>): ResponseViewModelDetail<UserViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => ({
        id: item.id,
        login: item.login,
        email: item.email,
        createdAt: item.createdAt,
        banInfo: {
          isBanned: item.isBanned || false,
          banDate: item.banDate || null,
          banReason: item.banReason || null,
        },
      })),
    };
  }
}
