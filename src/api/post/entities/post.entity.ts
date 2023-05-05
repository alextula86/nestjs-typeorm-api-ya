import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Users } from '../../user/entities/user.entity';
import { Blogs } from '../../blog/entities/blog.entity';

@Entity()
export class Posts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  content: string;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @CreateDateColumn({ type: 'time with time zone' })
  createdAt: Date;

  @ManyToOne(() => Blogs, { nullable: false })
  blog: Blogs;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
