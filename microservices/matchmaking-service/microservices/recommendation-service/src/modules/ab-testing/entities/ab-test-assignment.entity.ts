import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ab_test_assignments')
export class ABTestAssignment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    playerId!: string;

    @Column()
    experimentName!: string;

    @Column()
    variant!: string; // 'A', 'B', etc.

    @CreateDateColumn()
    assignedAt!: Date;
}
