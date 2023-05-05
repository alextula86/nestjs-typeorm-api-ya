import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Blogs } from '../../blog/entities';
import { Users } from '../../user/entities';

@Entity()
export class BanUserForBlog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @Column({ type: 'time with time zone', nullable: true })
  banDate: Date;

  @Column({ nullable: true })
  banReason: string;

  @CreateDateColumn({ type: 'time with time zone' })
  createdAt: Date;

  @ManyToOne(() => Blogs, { nullable: false })
  blog: Blogs;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
