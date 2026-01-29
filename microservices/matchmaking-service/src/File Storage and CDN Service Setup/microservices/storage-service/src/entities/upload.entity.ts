import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("uploads")
@Index(["userId"])
@Index(["status"])
export class Upload {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  fileId: string;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  })
  status: string;

  @Column({ nullable: true, type: "text" })
  errorMessage: string;

  @Column({ type: "jsonb", nullable: true })
  processingMetadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
