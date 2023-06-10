import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameStatuses } from '../../../types';
import { Users } from '../../user/entities';
import { QuizQuestions } from '../../quizQuestion/entities';
import { QuizQuestionAnswer } from '../../quizQuestionAnswers/entities';

@Entity()
export class PairQuizGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  pairCreatedDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startGameDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  finishGameDate: Date;

  @Column({
    type: 'enum',
    enum: GameStatuses,
    default: GameStatuses.PENDINGSECONDPLAYER,
  })
  status: GameStatuses;

  @Column('simple-json')
  questions: { quizQuestions: QuizQuestions[] };

  @Column({ nullable: false })
  firstPlayerId: string;

  @ManyToOne(() => Users, (user) => user.firstPlayer, { nullable: false })
  @JoinColumn({ name: 'firstPlayerId' })
  firstPlayer: Users;

  @Column({ nullable: true })
  secondPlayerId: string;

  @ManyToOne(() => Users, (user) => user.secondPlayer, { nullable: true })
  @JoinColumn({ name: 'secondPlayerId' })
  secondPlayer: Users;

  @OneToMany(
    () => QuizQuestionAnswer,
    (quizQuestionAnswer) => quizQuestionAnswer.pairQuizGame,
    {
      onDelete: 'CASCADE',
    },
  )
  quizQuestionAnswer: QuizQuestionAnswer;
}
