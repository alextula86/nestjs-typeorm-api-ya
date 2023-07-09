import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResultGameStatus } from '../../../types';
import { Users } from '../../user/entities';
import { PairQuizGame } from '../../pairQuizGame/entities';

@Entity()
export class PairQuizGameResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ResultGameStatus,
  })
  status: ResultGameStatus;

  @Column({ nullable: false })
  pairQuizGameId: string;

  @ManyToOne(
    () => PairQuizGame,
    (pairQuizGame) => pairQuizGame.pairQuizGameResult,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'pairQuizGameId' })
  pairQuizGame: PairQuizGame;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => Users, (user) => user.pairQuizGameResult, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
