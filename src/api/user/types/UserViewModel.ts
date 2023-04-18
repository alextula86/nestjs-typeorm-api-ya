import { BanInfoType } from '../../../types';

export type UserViewModel = {
  /**
   * id of existing user
   * login of existing user
   * email of existing user
   * createdAt of existing user
   * banInfo of existing user
   */
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: BanInfoType;
};
