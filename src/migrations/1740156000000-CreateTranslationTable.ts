import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTranslationTable1740156000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'translations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'key',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'locale',
                        type: 'varchar',
                        length: '10',
                        isNullable: false,
                    },
                    {
                        name: 'content',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'namespace',
                        type: 'varchar',
                        length: '50',
                        default: "'common'",
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndices('translations', [
            new TableIndex({
                name: 'IDX_TRANSLATIONS_KEY_LOCALE',
                columnNames: ['key', 'locale'],
                isUnique: true,
            }),
            new TableIndex({
                name: 'IDX_TRANSLATIONS_NAMESPACE',
                columnNames: ['namespace'],
            }),
            new TableIndex({
                name: 'IDX_TRANSLATIONS_KEY',
                columnNames: ['key'],
            }),
            new TableIndex({
                name: 'IDX_TRANSLATIONS_LOCALE',
                columnNames: ['locale'],
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('translations');
    }
}
