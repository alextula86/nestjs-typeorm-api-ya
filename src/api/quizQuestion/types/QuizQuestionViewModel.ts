import { PublishedStatus } from '../../../types';

export type QuizQuestionViewModel = {
  id: string;
  body: string;
  correctAnswers: string[];
  published: PublishedStatus;
  createdAt: string;
  updatedAt: string;
};
