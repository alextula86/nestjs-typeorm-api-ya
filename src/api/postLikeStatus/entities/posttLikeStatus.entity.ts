import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Posts, { nullable: false })
  @JoinColumn()
  post: Posts;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
