import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Posts } from '../../post/entities/post.entity';

@Entity()
export class PostMainImages {
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
  postId: string;

  @ManyToOne(() => Posts, (post) => post.postMainImages, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post: Posts;
}
