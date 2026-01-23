import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('preferences')
export class Preference {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    playerId!: string;

    @Column('simple-array')
    preferredCategories!: string[];

    @Column('float', { default: 0.5 })
    difficultyPreference!: number; // 0 to 1

    @Column({ type: 'simple-json', nullable: true })
    metadata?: any;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
