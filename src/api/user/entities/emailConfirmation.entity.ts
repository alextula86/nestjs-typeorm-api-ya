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

  @Column({ nullable: true })
  expirationDate: Date;

  @Column({ default: true, nullable: true })
  isConfirmed: boolean;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
