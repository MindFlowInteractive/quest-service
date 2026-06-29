import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm"

export class AddTwoFactorAuthentication1709654400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 2FA columns to users table
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "two_factor_secret",
        type: "varchar",
        isNullable: true,
        comment: "TOTP secret for 2FA authentication",
      }),
    )

    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "is_two_factor_enabled",
        type: "boolean",
        default: false,
        comment: "Whether 2FA is enabled for this user",
      }),
    )

    // Create two_factor_backup_codes table
    await queryRunner.createTable(
      new Table({
        name: "two_factor_backup_codes",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
          },
          {
            name: "code_hash",
            type: "varchar",
            isNullable: false,
            comment: "Bcrypt hashed backup code",
          },
          {
            name: "is_used",
            type: "boolean",
            default: false,
            comment: "Whether the backup code has been used",
          },
          {
            name: "used_at",
            type: "timestamp",
            isNullable: true,
            comment: "When the backup code was used",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
            comment: "Foreign key to users table",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            comment: "When the backup code was created",
          },
        ],
      }),
    )

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      "two_factor_backup_codes",
      new TableForeignKey({
        name: "FK_TWO_FACTOR_BACKUP_CODES_USER",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    )

    // Add index on user_id for faster lookups
    await queryRunner.createIndex(
      "two_factor_backup_codes",
      new TableIndex({
        name: "IDX_TWO_FACTOR_BACKUP_CODES_USER",
        columnNames: ["user_id"],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex("two_factor_backup_codes", "IDX_TWO_FACTOR_BACKUP_CODES_USER")

    // Drop foreign key
    const table = await queryRunner.getTable("two_factor_backup_codes")
    const foreignKey = table?.foreignKeys.find((fk) => fk.name === "FK_TWO_FACTOR_BACKUP_CODES_USER")
    if (foreignKey) {
      await queryRunner.dropForeignKey("two_factor_backup_codes", foreignKey)
    }

    // Drop two_factor_backup_codes table
    await queryRunner.dropTable("two_factor_backup_codes")

    // Remove 2FA columns from users table
    await queryRunner.dropColumn("users", "two_factor_secret")
    await queryRunner.dropColumn("users", "is_two_factor_enabled")
  }
}
