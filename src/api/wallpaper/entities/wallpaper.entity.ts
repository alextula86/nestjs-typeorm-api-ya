import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities/user.entity';
import { Blogs } from '../../blog/entities/blog.entity';

@Entity()
export class Wallpapers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column()
  fileSize: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ nullable: true })
  blogId: string;

  @ManyToOne(() => Blogs, (blog) => blog.wallpaper, { nullable: false })
  @JoinColumn({ name: 'blogId' })
  blog: Blogs;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Users, (user) => user.wallpaper, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
