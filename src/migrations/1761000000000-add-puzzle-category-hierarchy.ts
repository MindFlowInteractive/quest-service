import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddPuzzleCategoryHierarchy1761000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('category');
    if (!table) return;

    if (!table.findColumnByName('slug')) {
      await queryRunner.addColumn('category', new TableColumn({ name: 'slug', type: 'varchar', length: '100', isNullable: true }));
    }
    if (!table.findColumnByName('sortOrder')) {
      await queryRunner.addColumn('category', new TableColumn({ name: 'sortOrder', type: 'int', default: 0 }));
    }
    if (!table.findColumnByName('parentCategoryId')) {
      await queryRunner.addColumn('category', new TableColumn({ name: 'parentCategoryId', type: 'uuid', isNullable: true }));
      await queryRunner.createForeignKey('category', new TableForeignKey({
        columnNames: ['parentCategoryId'], referencedTableName: 'category',
        referencedColumnNames: ['id'], onDelete: 'SET NULL',
      }));
    }
    await queryRunner.createIndex('category', new TableIndex({ name: 'IDX_category_parent_sort', columnNames: ['parentCategoryId', 'sortOrder'] }));
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_slug_unique" ON "category" ("slug") WHERE "slug" IS NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('category');
    if (!table) return;
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_category_slug_unique"');
    const index = table.indices.find((item) => item.name === 'IDX_category_parent_sort');
    if (index) await queryRunner.dropIndex('category', index);
    const fk = table.foreignKeys.find((item) => item.columnNames.includes('parentCategoryId'));
    if (fk) await queryRunner.dropForeignKey('category', fk);
    for (const name of ['parentCategoryId', 'sortOrder', 'slug']) {
      if (table.findColumnByName(name)) await queryRunner.dropColumn('category', name);
    }
  }
}
