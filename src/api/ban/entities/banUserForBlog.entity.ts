import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Blogs } from '../../blog/entities';
import { Users } from '../../user/entities';

@Entity()
export class BanUserForBlog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @Column({ nullable: true })
  banDate: Date;

  @Column({ nullable: true })
  banReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Blogs, { nullable: false })
  @JoinColumn()
  blog: Blogs;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
