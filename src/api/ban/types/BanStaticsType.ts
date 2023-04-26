import { BanDocument, BanModelType } from '../schemas';
import { MakeBanModel } from '.';

export type BanStaticsType = {
  make: (makeBanModel: MakeBanModel, SessionModel: BanModelType) => BanDocument;
};
