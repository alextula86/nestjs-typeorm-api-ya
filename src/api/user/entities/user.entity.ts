import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { EmailConfirmation } from './emailConfirmation.entity';
import { PasswordRecovery } from './passwordRecovery.entity';
import { BanUserInfo } from './banUserInfo.entity';
import { Devices } from '../../device/entities';
import { Blogs } from '../../blog/entities';

@Entity()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToOne(
    () => EmailConfirmation,
    (emailConfirmation) => emailConfirmation.user,
    { onDelete: 'CASCADE' },
  )
  emailConfirmation: EmailConfirmation;

  @OneToOne(
    () => PasswordRecovery,
    (passwordRecovery) => passwordRecovery.user,
    { onDelete: 'CASCADE' },
  )
  passwordRecovery: PasswordRecovery;

  @OneToOne(() => BanUserInfo, (banUserInfo) => banUserInfo.user, {
    onDelete: 'CASCADE',
  })
  banUserInfo: BanUserInfo;

  @OneToMany(() => Devices, (device) => device.user, {
    onDelete: 'CASCADE',
  })
  device: Devices;

  @OneToMany(() => Blogs, (blog) => blog.user, {
    onDelete: 'CASCADE',
  })
  blog: Blogs;
}
