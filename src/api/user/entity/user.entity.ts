import { BanInfoType } from '../../../types';
import { getNextStrId } from '../../../utils';

import {
  AccountDataType,
  EmailConfirmationType,
  PasswordRecoveryType,
} from '../types';

export class UserEntity {
  id: string;
  constructor(
    public accountData: AccountDataType,
    public emailConfirmation: EmailConfirmationType,
    public passwordRecovery: PasswordRecoveryType,
    public banInfo: BanInfoType,
    public refreshToken: string,
  ) {
    this.id = getNextStrId();
  }
}
