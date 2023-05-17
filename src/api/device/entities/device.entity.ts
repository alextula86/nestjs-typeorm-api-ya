import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities';

@Entity()
export class Devices {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceId: string;

  @Column()
  ip: string;

  @Column()
  title: string;

  @Column({ type: 'timestamp with time zone', nullable: false })
  lastActiveDate: Date;

  @Column({ default: true, nullable: true })
  active: boolean;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Users, (user) => user.device, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
