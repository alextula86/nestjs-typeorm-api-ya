import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { LikeStatuses } from '../../../types';
import { Users } from '../../user/entities';
import { Posts } from '../../post/entities';

@Entity()
export class PostLikeStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LikeStatuses,
    default: LikeStatuses.NONE,
  })
  likeStatus: LikeStatuses;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Posts, { nullable: false })
  post: Posts;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
