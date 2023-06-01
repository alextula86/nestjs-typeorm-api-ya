import { GameStatuses, AnswerStatus } from '../../../types';

export type PairQuizGameAnswerType = {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: Date;
};

type PairQuizGamePlayerType = {
  id: string;
  login: string;
};

type PairQuizGamePlayerProgressType = {
  answers: PairQuizGameAnswerType[];
  player: PairQuizGamePlayerType;
  score: number;
};

export type PairQuizGameQuestionType = {
  id: string;
  body: string;
};

export type PairQuizGameViewModel = {
  id: string;
  firstPlayerProgress: PairQuizGamePlayerProgressType;
  secondPlayerProgress: PairQuizGamePlayerProgressType;
  questions: PairQuizGameQuestionType[];
  status: GameStatuses;
  pairCreatedDate: Date;
  startGameDate: Date;
  finishGameDate: Date;
};
