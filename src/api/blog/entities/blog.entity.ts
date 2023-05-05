import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities';

@Entity()
export class Blogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ default: false, nullable: true })
  isMembership: boolean;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @Column({ nullable: true })
  banDate: Date;

  @CreateDateColumn({ type: 'time with time zone' })
  createdAt: Date;

  @ManyToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
