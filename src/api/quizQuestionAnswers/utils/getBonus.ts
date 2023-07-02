import { isEmpty } from 'lodash';
import { AnswerStatus } from '../../../types';

export const getBonus = (
  currentPlayerAnswersCount: number,
  secondPlayerAnswersCount: number,
  questionsCount: number,
  currentPlayerAnswers: any,
) => {
  if (isEmpty(currentPlayerAnswers)) {
    return 0;
  }

  const correctAnswer = currentPlayerAnswers.find(
    (i: any) => i.answerStatus === AnswerStatus.CORRECT,
  );

  if (
    currentPlayerAnswersCount === questionsCount - 1 &&
    secondPlayerAnswersCount !== questionsCount &&
    !isEmpty(correctAnswer)
  ) {
    return 1;
  }

  return 0;
};
