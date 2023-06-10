import { GameStatuses, AnswerStatus } from '../../../types';

type PairQuizGameAnswerType = {
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

type PairQuizGameQuestionType = {
  id: string;
  body: string;
};

export type QuizQuestionAnswersViewModel = {
  id: string;
  firstPlayerProgress: PairQuizGamePlayerProgressType;
  secondPlayerProgress: PairQuizGamePlayerProgressType;
  questions: PairQuizGameQuestionType[];
  status: GameStatuses;
  pairCreatedDate: Date;
  startGameDate: Date;
  finishGameDate: Date;
};

export type QuizQuestionAnswerViewModel = {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
};
