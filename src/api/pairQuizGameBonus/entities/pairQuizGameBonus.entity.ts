import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities';
import { PairQuizGame } from '../../pairQuizGame/entities';

@Entity()
export class PairQuizGameBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bonus: number;

  @Column({ nullable: false })
  pairQuizGameId: string;

  @ManyToOne(
    () => PairQuizGame,
    (pairQuizGame) => pairQuizGame.pairQuizGameBonus,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'pairQuizGameId' })
  pairQuizGame: PairQuizGame;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => Users, (user) => user.pairQuizGameBonus, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
