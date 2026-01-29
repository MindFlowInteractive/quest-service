import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("files")
@Index(["userId", "category"])
@Index(["deletedAt"])
export class File {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: "bigint" })
  size: number;

  @Column()
  path: string;

  @Column()
  bucket: string;

  @Column({ type: "enum", enum: ["puzzle", "avatar", "asset", "other"] })
  category: string;

  @Column({ nullable: true })
  cdnUrl: string;

  @Column()
  @Index()
  userId: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previousVersionId: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}
