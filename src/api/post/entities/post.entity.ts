import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Blogs, { nullable: false })
  @JoinColumn()
  blog: Blogs;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
