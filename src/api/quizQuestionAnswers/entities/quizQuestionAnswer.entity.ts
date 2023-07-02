import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AnswerStatus } from '../../../types';
import { Users } from '../../user/entities';
import { QuizQuestions } from '../../quizQuestion/entities';
import { PairQuizGame } from '../../pairQuizGame/entities';

@Entity()
export class QuizQuestionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  answer: string;

  @Column({
    type: 'enum',
    enum: AnswerStatus,
  })
  answerStatus: AnswerStatus;

  @Column({ default: new Date().toISOString() })
  addedAt: string;

  @Column({ default: 0 })
  score: number;

  @Column({ nullable: false })
  pairQuizGameId: string;

  @ManyToOne(
    () => PairQuizGame,
    (pairQuizGame) => pairQuizGame.quizQuestionAnswer,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'pairQuizGameId' })
  pairQuizGame: PairQuizGame;

  @Column({ nullable: false })
  quizQuestionId: string;

  @ManyToOne(
    () => QuizQuestions,
    (quizQuestion) => quizQuestion.quizQuestionAnswer,
    { nullable: false },
  )
  @JoinColumn({ name: 'quizQuestionId' })
  quizQuestion: QuizQuestions;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => Users, (user) => user.quizQuestionAnswer, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
