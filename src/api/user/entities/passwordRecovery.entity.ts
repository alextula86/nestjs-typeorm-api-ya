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

  @Column({ type: 'timestamp with time zone', nullable: true })
  expirationDate: Date;

  @Column({ default: true, nullable: true })
  isRecovered: boolean;

  @Column({ nullable: true })
  userId: string;

  @OneToOne(() => Users, (user) => user.passwordRecovery, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
