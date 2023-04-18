import { UserDocument, UserModelType } from '../schemas';
import { MakeUserModel } from '../types';

export type UserStaticsType = {
  make: (
    makeUserModel: MakeUserModel,
    UserModel: UserModelType,
  ) => UserDocument;
};
