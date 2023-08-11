import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../user/entities';
import { Wallpapers } from '../../wallpaper/entities';
import { BlogMainImages } from '../../blogMainImage/entities';

@Entity()
export class Blogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ default: false, nullable: true })
  isMembership: boolean;

  @Column({ default: false, nullable: true })
  isBanned: boolean;

  @Column({ nullable: true })
  banDate: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => Wallpapers, (wallpaper) => wallpaper.blog, {
    onDelete: 'CASCADE',
  })
  wallpaper: Wallpapers;

  @OneToMany(() => BlogMainImages, (blogMainImages) => blogMainImages.blog, {
    onDelete: 'CASCADE',
  })
  blogMainImages: BlogMainImages;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Users, (user) => user.blog, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
