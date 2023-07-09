import { ResultGameStatus } from '../../../types';

export type CreatePairQuizGameResult = {
  userId: string;
  pairQuizGameId: string;
  status: ResultGameStatus;
};
