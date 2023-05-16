import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity()
export class BanUserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @Column({ nullable: true })
  banDate: Date;

  @Column({ nullable: true })
  banReason: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ nullable: true })
  userId: string;

  @OneToOne(() => Users, (user) => user.banUserInfo, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
