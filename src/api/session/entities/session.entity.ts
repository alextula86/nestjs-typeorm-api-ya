import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Sessions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  deviceTitle: string;

  @Column()
  url: string;

  @Column({ default: 1 })
  attempt: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  issuedAtt: Date;
}
