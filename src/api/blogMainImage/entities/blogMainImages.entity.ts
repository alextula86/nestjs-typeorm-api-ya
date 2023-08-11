import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Blogs } from '../../blog/entities/blog.entity';

@Entity()
export class BlogMainImages {
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

  @Column({ nullable: false })
  blogId: string;

  @ManyToOne(() => Blogs, (blog) => blog.blogMainImages, { nullable: false })
  @JoinColumn({ name: 'blogId' })
  blog: Blogs;
}
