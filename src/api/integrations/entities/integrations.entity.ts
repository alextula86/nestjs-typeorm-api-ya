import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Blogs } from '../../blog/entities';
import { Users } from '../../user/entities';

@Entity()
export class Integrations {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  code: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Blogs, { nullable: false })
  blog: Blogs;

  @ManyToOne(() => Users, { nullable: false })
  user: Users;
}
