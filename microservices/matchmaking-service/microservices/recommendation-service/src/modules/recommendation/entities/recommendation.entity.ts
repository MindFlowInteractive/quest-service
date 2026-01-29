import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('recommendations')
export class Recommendation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    playerId!: string;

    @Column('simple-array')
    puzzleIds!: string[];

    @Column()
    algorithm!: string; // 'collaborative', 'content-based', 'hybrid'

    @Column({ nullable: true })
    abTestGroup?: string;

    @CreateDateColumn()
    generatedAt!: Date;

    @Column({ nullable: true })
    expiresAt?: Date;
}
