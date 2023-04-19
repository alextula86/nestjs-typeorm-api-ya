import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { add, formatISO } from 'date-fns';
import { isEmpty } from 'lodash';
import { bcryptService } from '../../application';
import { MakeUserModel } from './types';
import { generateUUID, formatSqlChar } from '../../utils';

@Injectable()
export class UserRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  // Поиск пользователя по логину или email
  async findByLoginOrEmail(loginOrEmail: string): Promise<any> {
    const foundUser = await this.dataSource.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bi."isBanned", 
        bi."banDate", 
        bi."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_info as bi ON bi."userId" = u."id"
      LEFT JOIN email_confirmation as ec ON ec."userId" = u."id"
      LEFT JOIN password_recovery as pr ON pr."userId" = u."id"
      WHERE u."login" = '${loginOrEmail}' OR u."email" = '${loginOrEmail}';
    `);

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
    const foundUser = await this.dataSource.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bi."isBanned", 
        bi."banDate", 
        bi."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_info as bi ON bi."userId" = u."id"
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
    const foundUser = await this.dataSource.query(`
      SELECT 
        u."id", 
        u."login", 
        u."email",
        u."passwordHash",
        u."createdAt",
        bi."isBanned", 
        bi."banDate", 
        bi."banReason",
        ec."confirmationCode",
        ec."expirationDate" as "emailExpirationDate",
        ec."isConfirmed",
        pr."recoveryCode",
        pr."expirationDate" as "passwordExpirationDate",
        pr."isRecovered"
      FROM users as u
      LEFT JOIN ban_info as bi ON bi."userId" = u."id"
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
    const foundUser = await this.dataSource.query(`
    SELECT 
      u."id", 
      u."login", 
      u."email",
      u."passwordHash",
      u."createdAt",
      bi."isBanned", 
      bi."banDate", 
      bi."banReason",
      ec."confirmationCode",
      ec."expirationDate" as "emailExpirationDate",
      ec."isConfirmed",
      pr."recoveryCode",
      pr."expirationDate" as "passwordExpirationDate",
      pr."isRecovered"
    FROM users as u
    LEFT JOIN ban_info as bi ON bi."userId" = u."id"
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
    // Генерируем код для подтверждения email
    const confirmationCode = generateUUID();
    // Генерируем соль
    const passwordSalt = bcryptService.generateSaltSync(10);
    // Генерируем хэш пароля
    const passwordHash = await bcryptService.generateHash(
      password,
      passwordSalt,
    );
    const expirationDateEmailConfirmation = formatISO(
      add(new Date(), {
        hours: 1,
        minutes: 30,
      }),
    );
    const dateNow = formatISO(new Date());

    const createdUser = await this.dataSource.query(`
      INSERT INTO users
        ("login", "email", "passwordHash")
        VALUES ('${login}', '${email}', '${passwordHash}')
        RETURNING *;
    `);

    const userId = createdUser[0].id;

    await this.dataSource.query(`
      INSERT INTO 
        email_confirmation("confirmationCode", "expirationDate", "isConfirmed", "userId")
        VALUES ('${confirmationCode}', '${expirationDateEmailConfirmation}', false, '${userId}');
        
      INSERT INTO 
        password_recovery("recoveryCode", "expirationDate", "isRecovered", "userId")
        VALUES ('${confirmationCode}', '${dateNow}', true, '${userId}');

      INSERT INTO 
        ban_info("isBanned", "banDate", "banReason", "userId")
        VALUES (false, null, null, '${userId}');          
    `);

    return createdUser[0];
  }
  // Удаление пользователя
  async deleteUserById(userId: string): Promise<boolean> {
    await this.dataSource.query(`
      DELETE FROM email_confirmation WHERE "userId" = '${userId}';
      DELETE FROM password_recovery WHERE "userId" = '${userId}';
      DELETE FROM ban_info WHERE "userId" = '${userId}';
      DELETE FROM devices WHERE "userId" = '${userId}';
      DELETE FROM users WHERE "id" = '${userId}';
    `);

    return true;
  }
  // Бан пользователя
  async banUser(
    isBanned: boolean,
    banReason: string,
    userId: string,
  ): Promise<boolean> {
    const dateNow = formatISO(new Date());
    const query = `
      UPDATE ban_info
      SET 
        "isBanned" = ${isBanned}, 
        "banDate" = ${isBanned ? formatSqlChar(dateNow) : null}, 
        "banReason" = ${isBanned ? formatSqlChar(banReason) : null}
      WHERE 
        "userId" = '${userId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
  // Обновление refresh токена пользователя
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const query = `
      UPDATE users
      SET "refreshToken" = '${refreshToken}'
      WHERE "id" = '${userId}';
    `;
    await this.dataSource.query(query);

    return true;
  }
  // Обновление refresh токена пользователя
  async updateEmailConfirmation(
    userId: string,
    isConfirmed: boolean,
  ): Promise<boolean> {
    const query = `
      UPDATE email_confirmation
      SET "isConfirmed" = ${isConfirmed}
      WHERE "userId" = '${userId}';
    `;
    await this.dataSource.query(query);

    return true;
  }
  // Обновление refresh токена пользователя
  async updateConfirmationCode(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    const query = `
      UPDATE email_confirmation
      SET "confirmationCode" = ${confirmationCode}
      WHERE "userId" = '${userId}';
    `;
    await this.dataSource.query(query);

    return true;
  }
  // Обновление кода востановления пароля
  async updateRecoveryCodeByEmail(
    userId: string,
    recoveryCode: string,
  ): Promise<boolean> {
    // Генерируем дату истечения востановления пароля
    const expirationDate = formatISO(
      add(new Date(), { hours: 1, minutes: 30 }),
    );

    const query = `
      UPDATE password_recovery
      SET 
        "recoveryCode" = '${recoveryCode}',
        "expirationDate" = '${expirationDate}',
        "recoveryCode" = false
      WHERE "userId" = '${userId}';
    `;
    await this.dataSource.query(query);

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

    // Обновляем пароль
    // Подтверждаем востановление пароля
    // Очищаем код востановления пароля
    await this.dataSource.query(`
      UPDATE users
      SET "passwordHash" = '${passwordHash}'
      WHERE "id" = '${userId}';

      UPDATE password_recovery
      SET 
        "isRecovered" = true,
        "recoveryCode" = ''
      WHERE "userId" = '${userId}';      
    `);

    return true;
  }
  // Очистка таблицы
  async deleteAll(): Promise<boolean> {
    await this.dataSource.query(`
      TRUNCATE TABLE 
        email_confirmation,
        password_recovery,
        ban_info,
        sessions,
        devices,
        users;
    `);

    return true;
  }
}
