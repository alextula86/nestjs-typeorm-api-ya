import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PostMainImageType } from '../../../types';
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

  @Column({
    type: 'enum',
    enum: PostMainImageType,
    default: PostMainImageType.ORIGINAL,
  })
  type: PostMainImageType;

  @Column({ nullable: false })
  postId: string;

  @ManyToOne(() => Posts, (post) => post.postMainImages, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post: Posts;
}
