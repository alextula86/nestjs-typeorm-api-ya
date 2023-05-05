import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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

  @Column({ nullable: false })
  lastActiveDate: Date;

  @Column({ default: true, nullable: true })
  active: boolean;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
