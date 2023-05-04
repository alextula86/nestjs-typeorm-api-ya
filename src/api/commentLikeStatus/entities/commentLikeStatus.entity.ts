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
import { Comments } from '../../comment/entities';

@Entity()
export class CommentLikeStatus {
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

  @OneToOne(() => Comments, { nullable: false })
  @JoinColumn()
  comment: Comments;

  @OneToOne(() => Users, { nullable: false })
  @JoinColumn()
  user: Users;
}
