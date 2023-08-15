import { QuizQuestionViewModel } from '../../quizQuestion/types';
import { PairQuizGameAnswerModel } from '../../quizQuestionAnswers/types';

export type ActivePairQuizGameModel = {
  id: string;
  questions: QuizQuestionViewModel;
  firstPlayerId: string;
  firstPlayerLogin: string;
  secondPlayerId: string;
  secondPlayerLogin: string;
  firstPlayerQuizQuestionAnswer: PairQuizGameAnswerModel;
  secondPlayerQuizQuestionAnswer: PairQuizGameAnswerModel;
};
