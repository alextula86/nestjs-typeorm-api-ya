import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity()
export class PasswordRecovery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  recoveryCode: string;

  @Column({ nullable: true })
  expirationDate: Date;

  @Column({ default: true, nullable: true })
  isRecovered: boolean;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
