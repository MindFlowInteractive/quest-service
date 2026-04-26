import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuestChainStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  LOCKED = 'locked',
}

export enum NodeType {
  SEQUENTIAL = 'sequential',
  BRANCH = 'branch',
  CHECKPOINT = 'checkpoint',
}

@Entity('quest_chains')
export class QuestChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: QuestChainStatus,
    default: QuestChainStatus.LOCKED,
  })
  status: QuestChainStatus;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => QuestNode, (node) => node.chain)
  nodes: QuestNode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('quest_nodes')
export class QuestNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questId: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: NodeType,
    default: NodeType.SEQUENTIAL,
  })
  nodeType: NodeType;

  @Column({ default: false })
  isCheckpoint: boolean;

  @Column({ nullable: true })
  prerequisiteNodeId: string;

  @ManyToOne(() => QuestChain, (chain) => chain.nodes)
  chain: QuestChain;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('quest_chain_progress')
export class QuestChainProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  chainId: string;

  @Column({ nullable: true })
  lastCompletedNodeId: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  checkpointData: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}