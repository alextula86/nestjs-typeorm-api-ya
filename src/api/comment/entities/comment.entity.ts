import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Users } from '../../user/entities';
import { Blogs } from '../../blog/entities';
import { Posts } from '../../post/entities';

@Entity()
export class Comments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Posts, { nullable: false })
  post: Posts;

  @ManyToOne(() => Blogs, { nullable: false })
  blog: Blogs;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
