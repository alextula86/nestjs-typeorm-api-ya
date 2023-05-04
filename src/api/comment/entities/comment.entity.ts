import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
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

  @OneToOne(() => Posts, { nullable: false })
  @JoinColumn()
  post: Posts;

  @OneToOne(() => Blogs, { nullable: false })
  @JoinColumn()
  blog: Blogs;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
