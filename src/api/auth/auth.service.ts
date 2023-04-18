import { Injectable } from '@nestjs/common';
import { bcryptService, jwtService } from '../../application';

@Injectable()
export class AuthService {
  // Проверяем забанен ли пользователь
  checkUserBanned(isBanned: boolean, banDate: Date) {
    return isBanned && banDate;
  }
  // Аутентификация пользователя
  async isCheckCredentials(passwordHash: string, password: string) {
    // Если пароль не передан, возвращаем ошибку
    if (!password) throw new Error('Bad password value!');
    // Пролучаем соль из хэша пароля пользователя
    const passwordSalt = passwordHash.slice(0, 29);
    // Формируем хэш переданного пароля по соли
    const passwordHashNew = await bcryptService.generateHash(
      password,
      passwordSalt,
    );
    // Если сформированных хеш переданного пароля равен хэшу пароля пользователя
    // Возвращаем true
    return passwordHashNew === passwordHash;
  }
  // Генерация токенов пользователя
  async generateAuthTokens(userId: number, deviceId: string) {
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
  // Проверяем можно ли подтвердить аккаунт
  canBeConfirmed(expirationDate: Date, isConfirmed: boolean) {
    // Если дата истечения срока действия меньше текущей
    // Значит нельзя подтвердить аккаунт
    // Возвращаем false
    if (expirationDate < new Date()) {
      return false;
    }
    // Если аккаунт уже подтвержден
    // Возвращаем false
    if (isConfirmed) {
      return false;
    }
    // Если дата истечения срока действия больше текущей даты
    // Если аккаунт еще не подтвержден
    // Возвращаем true
    return true;
  }
  confirm(expirationDate: Date, isConfirmed: boolean) {
    // Если аккаунт нельзя подтвердить, возвращаем ошибку
    if (!this.canBeConfirmed(expirationDate, isConfirmed))
      throw new Error(`Account can't be confirm!`);
    // Если аккаунт уже подтвержден, возвращаем ошибку
    if (isConfirmed)
      throw new Error(`Already confirmed account can't be confirmed again!`);
  }
  // Проверяем можно ли востановить пароль
  canBePasswordRecovery(expirationDate: Date, isRecovered: boolean) {
    // Если дата истечения срока действия меньше текущей
    // Значит нельзя востановить пароль
    // Возвращаем false
    if (expirationDate < new Date()) {
      return false;
    }
    // Если пароль уже востановлен
    // Возвращаем false
    if (isRecovered) {
      return false;
    }
    // Если дата истечения срока действия больше текущей даты
    // Если пароль можно востановить
    // Возвращаем true
    return true;
  }
  // Проверяем можно ли обновить пароль
  async recovered(expirationDate: Date, isRecovered: boolean) {
    // Если аккаунт нельзя подтвердить, возвращаем ошибку
    if (!this.canBePasswordRecovery(expirationDate, isRecovered))
      throw new Error(`The password cannot be restored`);
    // Если пароль уже был востановлен, возвращаем ошибку
    if (isRecovered) throw new Error(`The password has already been restored`);
  }
}
