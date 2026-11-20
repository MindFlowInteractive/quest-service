import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStoryChapterStages1795200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('quest_chain_puzzles', [
      new TableColumn({
        name: 'chapterId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'narrative',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'isOptional',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('quest_chain_puzzles', 'isOptional');
    await queryRunner.dropColumn('quest_chain_puzzles', 'narrative');
    await queryRunner.dropColumn('quest_chain_puzzles', 'chapterId');
  }
}
