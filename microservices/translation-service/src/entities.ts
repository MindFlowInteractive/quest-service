import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Language {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @OneToMany(() => TranslationEntry, (entry) => entry.languageEntity)
  entries: TranslationEntry[];
}

@Entity()
export class TranslationKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @OneToMany(() => TranslationEntry, (entry) => entry.key)
  entries: TranslationEntry[];
}

@Entity()
export class TranslationEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  language: string;

  @Column()
  text: string;

  @ManyToOne(() => TranslationKey, (key) => key.entries, { eager: true })
  key: TranslationKey;

  @ManyToOne(() => Language, (language) => language.entries, { eager: true })
  languageEntity: Language;
}

@Entity()
export class TranslationContribution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  language: string;

  @Column()
  text: string;

  @Column()
  contributor: string;

  @Column({ default: 'pending' })
  status: string;
}
