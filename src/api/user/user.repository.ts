import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { add } from 'date-fns';
import { isEmpty } from 'lodash';
import { bcryptService } from '../../application';
import { MakeUserModel } from './types';
import { generateUUID } from '../../utils';
import {
  Users,
  EmailConfirmation,
  PasswordRecovery,
  BanUserInfo,
} from './entities';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
  ) {}
  // Поиск пользователя по логину или email
  async findByLoginOrEmail(loginOrEmail: string): Promise<any> {
    const foundUser = await this.userRepository.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bui."isBanned", 
        bui."banDate", 
        bui."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_user_info as bui ON bui."userId" = u."id"
      LEFT JOIN email_confirmation as ec ON ec."userId" = u."id"
      LEFT JOIN password_recovery as pr ON pr."userId" = u."id"
      WHERE u."login" = '${loginOrEmail}' OR u."email" = '${loginOrEmail}';
    `);

    /*const foundUser1 = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.emailConfirmation', 'ec')
      .where('u.login = :loginOrEmail', { loginOrEmail })
      .orWhere('u.email = :loginOrEmail', { loginOrEmail })
      .getOne();*/

    if (isEmpty(foundUser)) {
      return null;
    }

    return foundUser[0];
  }
  // Поиск пользователя по идентификатору
  async findUserById(userId: string): Promise<{
    id: string;
    login: string;
    email: string;
    passwordHash: string;
    refreshToken: string;
    createdAt: Date;
    isBanned: boolean;
    banDate: Date;
    banReason: string;
    confirmationCode: string;
    emailExpirationDate: Date;
    isConfirmed: boolean;
    recoveryCode: string;
    passwordExpirationDate: Date;
    isRecovered: boolean;
  }> {
    const foundUser = await this.userRepository.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bui."isBanned", 
        bui."banDate", 
        bui."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_user_info as bui ON bui."userId" = u."id"
      LEFT JOIN email_confirmation as ec ON ec."userId" = u."id"
      LEFT JOIN password_recovery as pr ON pr."userId" = u."id"
      WHERE u."id" = '${userId}';
    `);

    if (isEmpty(foundUser)) {
      return null;
    }

    return foundUser[0];
  }
  async findByConfirmationCode(code: string) {
    const foundUser = await this.userRepository.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bui."isBanned", 
        bui."banDate", 
        bui."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_user_info as bui ON bui."userId" = u."id"
      LEFT JOIN email_confirmation as ec ON ec."userId" = u."id"
      LEFT JOIN password_recovery as pr ON pr."userId" = u."id"
      WHERE ec."confirmationCode" = '${code}';
    `);

    if (!foundUser) {
      return null;
    }

    return foundUser[0];
  }
  async findByRecoveryCode(recoveryCode: string) {
    const foundUser = await this.userRepository.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bui."isBanned", 
        bui."banDate", 
        bui."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_user_info as bui ON bui."userId" = u."id"
      LEFT JOIN email_confirmation as ec ON ec."userId" = u."id"
      LEFT JOIN password_recovery as pr ON pr."userId" = u."id"
      WHERE pr."recoveryCode" = '${recoveryCode}';
    `);

    if (!foundUser) {
      return null;
    }

    return foundUser[0];
  }
  // Создаем пользователя
  async createUser({ login, password, email }: MakeUserModel): Promise<{
    id: string;
    login: string;
    email: string;
    passwordHash: string;
    refreshToken: string;
    createdAt: Date;
  }> {
    // Генерируем соль
    const passwordSalt = bcryptService.generateSaltSync(10);
    // Генерируем хэш пароля
    const passwordHash = await bcryptService.generateHash(
      password,
      passwordSalt,
    );
    const expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    }).toISOString();

    const createdUser = await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(Users)
      .values({
        login,
        email,
        passwordHash,
      })
      .returning(['id'])
      .execute();

    const userId = createdUser.raw[0].id;

    await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(EmailConfirmation)
      .values({
        confirmationCode: generateUUID(),
        expirationDate,
        isConfirmed: false,
        userId,
      })
      .execute();

    await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(PasswordRecovery)
      .values({
        recoveryCode: generateUUID(),
        expirationDate: new Date().toISOString(),
        isRecovered: true,
        userId,
      })
      .execute();

    await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(BanUserInfo)
      .values({ userId })
      .execute();

    return createdUser.raw[0];
  }
  // Удаление пользователя
  async deleteUserById(userId: string): Promise<boolean> {
    await this.userRepository.query(`
      DELETE FROM email_confirmation WHERE "userId" = '${userId}';
      DELETE FROM password_recovery WHERE "userId" = '${userId}';
      DELETE FROM ban_user_info WHERE "userId" = '${userId}';
      DELETE FROM ban_user_for_blog WHERE "userId" = '${userId}';
      DELETE FROM devices WHERE "userId" = '${userId}';
      DELETE FROM comment_like_status WHERE "userId" = '${userId}';
      DELETE FROM comments WHERE "userId" = '${userId}';
      DELETE FROM post_like_status WHERE "userId" = '${userId}';
      DELETE FROM posts WHERE "userId" = '${userId}';
      DELETE FROM blogs WHERE "userId" = '${userId}';
      DELETE FROM users WHERE "id" = '${userId}';
    `);

    return true;
  }
  // Обновление refresh токена пользователя
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    await this.userRepository
      .createQueryBuilder()
      .update(Users)
      .set({ refreshToken })
      .where('id = :id', { id: userId })
      .execute();

    return true;
  }
  // Обновление refresh токена пользователя
  async updateEmailConfirmation(
    userId: string,
    isConfirmed: boolean,
  ): Promise<boolean> {
    await this.userRepository
      .createQueryBuilder()
      .update(EmailConfirmation)
      .set({ isConfirmed })
      .where('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Обновление refresh токена пользователя
  async updateConfirmationCode(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    await this.userRepository
      .createQueryBuilder()
      .update(EmailConfirmation)
      .set({ confirmationCode })
      .where('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Обновление кода востановления пароля
  async updateRecoveryCodeByEmail(
    userId: string,
    recoveryCode: string,
  ): Promise<boolean> {
    // Генерируем дату истечения востановления пароля
    const expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    }).toISOString();

    await this.userRepository
      .createQueryBuilder()
      .update(PasswordRecovery)
      .set({ recoveryCode, expirationDate, isRecovered: false })
      .where('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Обновление пароля пользователя
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    // Генерируем соль
    const passwordSalt = bcryptService.generateSaltSync(10);
    // Генерируем хэш пароля
    const passwordHash = await bcryptService.generateHash(
      newPassword,
      passwordSalt,
    );

    await this.userRepository
      .createQueryBuilder()
      .update(Users)
      .set({ passwordHash })
      .where('id = :id', { id: userId })
      .execute();

    await this.userRepository
      .createQueryBuilder()
      .update(PasswordRecovery)
      .set({ isRecovered: true, recoveryCode: '' })
      .where('userId = :userId', { userId })
      .execute();

    return true;
  }
  // Бан пользователя
  async banUser(
    isBanned: boolean,
    banReason: string,
    userId: string,
  ): Promise<boolean> {
    const dateNow = new Date().toISOString();

    await this.userRepository
      .createQueryBuilder()
      .update(BanUserInfo)
      .set({
        isBanned,
        banDate: isBanned ? dateNow : null,
        banReason: isBanned ? banReason : null,
      })
      .where('userId = :userId', { userId })
      .execute();

    return true;
  }
}
