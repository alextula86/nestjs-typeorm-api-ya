import { SessionDocument, SessionModelType } from '../schemas';
import { MakeSessionModel } from '../types';

export type SessionStaticsType = {
  make: (
    makeSessionModel: MakeSessionModel,
    SessionModel: SessionModelType,
  ) => SessionDocument;
};
