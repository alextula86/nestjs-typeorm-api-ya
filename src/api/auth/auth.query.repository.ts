import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserAuthViewModel } from './types';

@Injectable()
export class AuthQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findAuthUserById(userId: string): Promise<UserAuthViewModel | null> {
    const foundUser = await this.dataSource.query(
      `SELECT * FROM users WHERE id = '${userId}';`,
    );

    if (!foundUser) {
      return null;
    }

    return this._getUserAuthViewModel(foundUser[0]);
  }
  _getUserAuthViewModel(user: any): UserAuthViewModel {
    return {
      userId: user.id,
      login: user.login,
      email: user.email,
    };
  }
}
