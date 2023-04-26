import { BanInfoType } from '../../../types';

export type BannedUserViewModel = {
  id: string;
  login: string;
  banInfo: BanInfoType;
};
