import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities/user.entity';
import { Blogs } from '../../blog/entities/blog.entity';
import { BlogSubscriptionStatus } from '../../../types';

@Entity()
export class BlogSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BlogSubscriptionStatus,
    default: BlogSubscriptionStatus.NONE,
  })
  status: BlogSubscriptionStatus;

  @Column('uuid')
  blogId: string;

  @ManyToMany(() => Blogs, (blog) => blog.blogSubscription, { nullable: false })
  @JoinColumn({ name: 'blogId' })
  blog: Blogs;

  @Column('uuid')
  userId: string;

  @ManyToMany(() => Users, (user) => user.blogSubscription, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
