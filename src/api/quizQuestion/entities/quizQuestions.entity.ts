import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

import { QuizQuestionAnswer } from '../../quizQuestionAnswers/entities';

@Entity()
export class QuizQuestions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  body: string;

  @Column('simple-json')
  correctAnswers: { answers: string[] };

  @Column({ default: false, nullable: true })
  published: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date;

  @OneToMany(
    () => QuizQuestionAnswer,
    (quizQuestionAnswer) => quizQuestionAnswer.quizQuestion,
    {
      onDelete: 'CASCADE',
    },
  )
  quizQuestionAnswer: QuizQuestionAnswer;
}
