import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Integration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  externalAccountId: string;

  @Column({ default: 'connected' })
  status: string;
}

@Entity()
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  externalId: string;

  @Column()
  accessToken: string;
}

@Entity()
export class Webhook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  integration: string;

  @Column()
  callbackUrl: string;

  @Column({ default: true })
  isActive: boolean;
}
