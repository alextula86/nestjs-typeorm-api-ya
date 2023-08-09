import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Users } from '../../user/entities/user.entity';
import { Blogs } from '../../blog/entities/blog.entity';
import { PostMainImages } from '../../postMainImage/entities/postMainImages.entity';

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

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Blogs, { nullable: false })
  blog: Blogs;

  @ManyToOne(() => PostMainImages, (postMainImages) => postMainImages.post, {
    onDelete: 'CASCADE',
  })
  postMainImages: PostMainImages;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
