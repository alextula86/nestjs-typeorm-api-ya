import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity()
export class EmailConfirmation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  confirmationCode: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expirationDate: Date;

  @Column({ default: true, nullable: true })
  isConfirmed: boolean;

  @Column({ nullable: true })
  userId: string;

  @OneToOne(() => Users, (user) => user.emailConfirmation, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
