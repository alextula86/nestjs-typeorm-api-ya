import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { PublishedStatus } from '../../../types';

@Entity()
export class QuizQuestions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  body: string;

  @Column('simple-json')
  correctAnswers: { answers: string[] };

  @Column({
    type: 'enum',
    enum: PublishedStatus,
    default: PublishedStatus.NOTPUBLISHED,
  })
  published: PublishedStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
