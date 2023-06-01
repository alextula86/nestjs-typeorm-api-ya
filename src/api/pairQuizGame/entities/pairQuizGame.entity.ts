import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameStatuses } from '../../../types';
import { Users } from '../../user/entities';

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

  @Column({ nullable: true })
  firstPlayerId: string;

  @ManyToOne(() => Users, (user) => user.blog, { nullable: false })
  @JoinColumn({ name: 'firstPlayerId' })
  firstPlayer: Users;

  @Column({ nullable: true })
  secondPlayerId: string;

  @ManyToOne(() => Users, (user) => user.blog, { nullable: true })
  @JoinColumn({ name: 'secondPlayerId' })
  secondPlayer: Users;
}
