import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { add } from 'date-fns';
import { trim } from 'lodash';
import { HydratedDocument, Model } from 'mongoose';

import { bcryptService, jwtService } from '../../../application';
import { generateUUID } from '../../../utils';
import { BanInfoType } from '../../../types';

import { AccountDataSchema } from './accountData.schema';
import { EmailConfirmationSchema } from './emailConfirmation.schema';
import { PasswordRecoverySchema } from './passwordRecovery.schema';
import { BanInfoSchema } from './banInfo.schema';

import { UserEntity } from '../entity';
import {
  AccountDataType,
  EmailConfirmationType,
  PasswordRecoveryType,
  MakeUserModel,
  UserStaticsType,
} from '../types';

@Schema()
export class User implements UserEntity {
  @Prop({
    type: String,
    required: [true, 'The id field is required'],
  })
  id: string;

  @Prop({
    type: AccountDataSchema,
    required: true,
  })
  accountData: AccountDataType;

  @Prop({
    type: EmailConfirmationSchema,
    required: true,
  })
  emailConfirmation: EmailConfirmationType;

  @Prop({
    type: PasswordRecoverySchema,
    required: true,
  })
  passwordRecovery: PasswordRecoveryType;

  @Prop({
    type: BanInfoSchema,
    required: true,
  })
  banInfo: BanInfoType;

  @Prop({
    type: String,
    default: '',
  })
  refreshToken: string;

  // Обновление refresh токена пользователя
  updateRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
  }
  // Проверяем можно ли подтвердить аккаунт
  canBeConfirmed() {
    // Если дата истечения срока действия меньше текущей
    // Значит нельзя подтвердить аккаунт
    // Возвращаем false
    if (this.emailConfirmation.expirationDate < new Date()) {
      return false;
    }
    // Если аккаунт уже подтвержден
    // Возвращаем false
    if (this.emailConfirmation.isConfirmed) {
      return false;
    }
    // Если дата истечения срока действия больше текущей даты
    // Если аккаунт еще не подтвержден
    // Возвращаем true
    return true;
  }
  // Проверяем можно ли востановить пароль
  canBePasswordRecovery() {
    // Если дата истечения срока действия меньше текущей
    // Значит нельзя востановить пароль
    // Возвращаем false
    if (this.passwordRecovery.expirationDate < new Date()) {
      return false;
    }
    // Если пароль уже востановлен
    // Возвращаем false
    if (this.passwordRecovery.isRecovered) {
      return false;
    }
    // Если дата истечения срока действия больше текущей даты
    // Если пароль можно востановить
    // Возвращаем true
    return true;
  }
  // Подтверждение аккаунта
  confirm() {
    // Если аккаунт нельзя подтвердить, возвращаем ошибку
    if (!this.canBeConfirmed()) throw new Error(`Account can't be confirm!`);
    // Если аккаунт уже подтвержден, возвращаем ошибку
    if (this.emailConfirmation.isConfirmed)
      throw new Error(`Already confirmed account can't be confirmed again!`);
    //  Если аккаунт не был подтвержден, то подтверждаем его
    this.emailConfirmation.isConfirmed = true;
  }
  // Обновление кода подтверждения аккаунта
  updateConfirmationCode() {
    // Если аккаунт нельзя подтвердить, возвращаем ошибку
    if (!this.canBeConfirmed()) throw new Error(`Account can't be confirm!`);
    // Если аккаунт уже подтвержден, возвращаем ошибку
    if (this.emailConfirmation.isConfirmed)
      throw new Error(`Already confirmed account can't be confirmed again!`);
    // Генерируем код для подтверждения пользователя
    const confirmationCode = generateUUID();
    // Записываем код для подтверждения email
    this.emailConfirmation.confirmationCode = confirmationCode;
  }
  // Обновление кода востановления пароля
  updateRecoveryCodeByEmail() {
    // Генерируем код для востановления пароля
    const recoveryCode = generateUUID();
    // Генерируем дату истечения востановления пароля
    const expirationDate = add(new Date(), { hours: 1, minutes: 30 });
    // Записываем код востановления пароля
    this.passwordRecovery.recoveryCode = recoveryCode;
    // Записываем срок действия кода для востановления пароля
    this.passwordRecovery.expirationDate = expirationDate;
    // Позволяем востановить пароль
    this.passwordRecovery.isRecovered = false;
  }
  // Обновление пароля пользователя
  async updatePassword(newPassword: string) {
    // Если аккаунт нельзя подтвердить, возвращаем ошибку
    if (!this.canBePasswordRecovery())
      throw new Error(`The password cannot be restored`);
    // Если пароль уже был востановлен, возвращаем ошибку
    if (this.passwordRecovery.isRecovered)
      throw new Error(`The password has already been restored`);
    // Генерируем соль
    const passwordSalt = bcryptService.generateSaltSync(10);
    // Генерируем хэш пароля
    const passwordHash = await bcryptService.generateHash(
      newPassword,
      passwordSalt,
    );
    // Обновляем пароль
    this.accountData.passwordHash = passwordHash;
    // Подтверждаем востановление пароля
    this.passwordRecovery.isRecovered = true;
    // Очищаем код востановления пароля
    this.passwordRecovery.recoveryCode = '';
  }
  // Аутентификация пользователя
  async isCheckCredentials(password: string) {
    // Если пароль не передан, возвращаем ошибку
    if (!password) throw new Error('Bad password value!');
    // Пролучаем соль из хэша пароля пользователя
    const passwordSalt = this.accountData.passwordHash.slice(0, 29);
    // Формируем хэш переданного пароля по соли
    const passwordHash = await bcryptService.generateHash(
      password,
      passwordSalt,
    );
    // Если сформированных хеш переданного пароля равен хэшу пароля пользователя
    // Возвращаем true
    return passwordHash === this.accountData.passwordHash;
  }
  // Генерация токенов пользователя
  async generateAuthTokens(userId: string, deviceId: string) {
    // Формируем access токен
    const accessToken = await jwtService.createAccessToken(userId);
    // Формируем refresh токен
    const refreshToken = await jwtService.createRefreshToken(userId, deviceId);
    // Получаем дату истечения срока действия refresh токена
    const iatRefreshToken = await jwtService.getIatRefreshToken(refreshToken);
    // Проверяем сформировалась ли дата истечения срока действия refresh токена
    if (!iatRefreshToken) {
      return null;
    }
    // Возвращаем access токен, refresh токен и дату истечения срока действия refresh токена
    return {
      accessToken,
      refreshToken,
      iatRefreshToken,
    };
  }
  // Бан пользователя
  banUser(isBanned: boolean, banReason: string) {
    if (isBanned) {
      // Записываем дату бана пользователя
      this.banInfo.banDate = new Date();
      // Устанавливаем флаг бана пользователя
      this.banInfo.isBanned = isBanned;
      // Записываем причину бана пользователя
      this.banInfo.banReason = banReason;
    } else {
      // Очищаем дату бана
      this.banInfo.banDate = null;
      // Устанавливаем флаг бана пользователя
      this.banInfo.isBanned = isBanned;
      // Очищаем причину бана
      this.banInfo.banReason = null;
    }
  }
  // Проверяем забанен ли пользователь
  checkUserBanned() {
    return this.banInfo.isBanned && this.banInfo.banDate;
  }

  static async make(
    { login, password, email }: MakeUserModel,
    UserModel: UserModelType,
  ): Promise<UserDocument> {
    // Генерируем код для подтверждения email
    const confirmationCode = generateUUID();
    // Генерируем соль
    const passwordSalt = bcryptService.generateSaltSync(10);
    // Генерируем хэш пароля
    const passwordHash = await bcryptService.generateHash(
      password,
      passwordSalt,
    );

    const accountData: AccountDataType = {
      login: trim(String(login)),
      email: trim(String(email)),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    const emailConfirmation: EmailConfirmationType = {
      confirmationCode,
      expirationDate: add(new Date(), { hours: 1, minutes: 30 }),
      isConfirmed: false,
    };

    const passwordRecovery: PasswordRecoveryType = {
      recoveryCode: '',
      expirationDate: new Date(),
      isRecovered: true,
    };

    const banInfo: BanInfoType = {
      isBanned: false,
      banDate: null,
      banReason: null,
    };

    const refreshToken = '';

    const user = new UserEntity(
      accountData,
      emailConfirmation,
      passwordRecovery,
      banInfo,
      refreshToken,
    );

    return new UserModel(user);
  }
}

export type UserDocument = HydratedDocument<User>;
export type UserModelType = Model<UserDocument> & UserStaticsType;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods = {
  updateRefreshToken: User.prototype.updateRefreshToken,
  canBeConfirmed: User.prototype.canBeConfirmed,
  canBePasswordRecovery: User.prototype.canBePasswordRecovery,
  updateConfirmationCode: User.prototype.updateConfirmationCode,
  updateRecoveryCodeByEmail: User.prototype.updateRecoveryCodeByEmail,
  updatePassword: User.prototype.updatePassword,
  confirm: User.prototype.confirm,
  isCheckCredentials: User.prototype.isCheckCredentials,
  generateAuthTokens: User.prototype.generateAuthTokens,
  banUser: User.prototype.banUser,
  checkUserBanned: User.prototype.checkUserBanned,
};

UserSchema.statics = {
  make: User.make,
};
