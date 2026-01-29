import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'notification_templates' })
export class NotificationTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    subject: string;

    @Column({ type: 'text' })
    body: string;

    @Column()
    type: string; // e.g., 'QUEST_COMPLETED', 'NEW_FRIEND_REQUEST'

    @Column({ type: 'jsonb', nullable: true })
    defaultVariables: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
