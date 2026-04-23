import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateBlockchainEventsTables1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create onchain_events table
    await queryRunner.createTable(
      new Table({
        name: 'onchain_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'contract_address',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'ledger',
            type: 'bigint',
          },
          {
            name: 'tx_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'processed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'max_retries',
            type: 'int',
            default: 3,
          },
          {
            name: 'next_retry_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'paging_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '50',
            default: "'testnet'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create dead_letter_events table
    await queryRunner.createTable(
      new Table({
        name: 'dead_letter_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'original_event_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'contract_address',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'ledger',
            type: 'bigint',
          },
          {
            name: 'tx_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'error_message',
            type: 'text',
          },
          {
            name: 'error_stack',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_retry_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'resolution_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '50',
            default: "'testnet'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for onchain_events table
    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_contract_address', ['contract_address']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_event_type', ['event_type']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_tx_hash', ['tx_hash'], { unique: true }),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_ledger', ['ledger']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_status', ['status']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_processed_at', ['processed_at']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_contract_event_type', ['contract_address', 'event_type']),
    );

    await queryRunner.createIndex(
      'onchain_events',
      new Index('IDX_onchain_events_ledger_status', ['ledger', 'status']),
    );

    // Create indexes for dead_letter_events table
    await queryRunner.createIndex(
      'dead_letter_events',
      new Index('IDX_dead_letter_events_original_event_id', ['original_event_id']),
    );

    await queryRunner.createIndex(
      'dead_letter_events',
      new Index('IDX_dead_letter_events_event_type', ['event_type']),
    );

    await queryRunner.createIndex(
      'dead_letter_events',
      new Index('IDX_dead_letter_events_status', ['status']),
    );

    await queryRunner.createIndex(
      'dead_letter_events',
      new Index('IDX_dead_letter_events_created_at', ['created_at']),
    );

    // Create updated_at trigger function for both tables
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at columns
    await queryRunner.query(`
      CREATE TRIGGER update_onchain_events_updated_at 
        BEFORE UPDATE ON onchain_events 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_dead_letter_events_updated_at 
        BEFORE UPDATE ON dead_letter_events 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_onchain_events_updated_at ON onchain_events;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_dead_letter_events_updated_at ON dead_letter_events;`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);

    // Drop indexes for dead_letter_events table
    await queryRunner.dropIndex('dead_letter_events', 'IDX_dead_letter_events_created_at');
    await queryRunner.dropIndex('dead_letter_events', 'IDX_dead_letter_events_status');
    await queryRunner.dropIndex('dead_letter_events', 'IDX_dead_letter_events_event_type');
    await queryRunner.dropIndex('dead_letter_events', 'IDX_dead_letter_events_original_event_id');

    // Drop indexes for onchain_events table
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_ledger_status');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_contract_event_type');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_processed_at');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_status');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_ledger');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_tx_hash');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_event_type');
    await queryRunner.dropIndex('onchain_events', 'IDX_onchain_events_contract_address');

    // Drop tables
    await queryRunner.dropTable('dead_letter_events');
    await queryRunner.dropTable('onchain_events');
  }
}
