import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("file_metadata")
@Index(["fileId"])
@Index(["fileId", "key"])
export class Metadata {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fileId: string;

  @Column()
  key: string;

  @Column({ type: "text" })
  value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
