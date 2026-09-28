import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLiveStreamingTables1760000000000
  implements MigrationInterface
{
  name = 'CreateLiveStreamingTables1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'live_streams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'hostId', type: 'varchar', length: '64', isNullable: false },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'scheduled'",
          },
          {
            name: 'currentQuality',
            type: 'varchar',
            length: '10',
            default: "'medium'",
          },
          { name: 'viewerCount', type: 'int', default: 0 },
          { name: 'peakViewerCount', type: 'int', default: 0 },
          { name: 'recordingEnabled', type: 'boolean', default: false },
          {
            name: 'recordingUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'startedAt', type: 'timestamp', isNullable: true },
          { name: 'endedAt', type: 'timestamp', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'stream_viewers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'streamId', type: 'uuid', isNullable: false },
          {
            name: 'viewerId',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'quality',
            type: 'varchar',
            length: '10',
            default: "'medium'",
          },
          { name: 'isModerator', type: 'boolean', default: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'joinedAt', type: 'timestamp', isNullable: true },
          { name: 'leftAt', type: 'timestamp', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'stream_chat_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'streamId', type: 'uuid', isNullable: false },
          {
            name: 'authorId',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'isDeleted', type: 'boolean', default: false },
          {
            name: 'deletedBy',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          { name: 'isPinned', type: 'boolean', default: false },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'stream_moderation_actions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'streamId', type: 'uuid', isNullable: false },
          {
            name: 'moderatorId',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'targetUserId',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          { name: 'action', type: 'varchar', length: '20', isNullable: false },
          { name: 'reason', type: 'varchar', length: '200', isNullable: true },
          { name: 'messageId', type: 'uuid', isNullable: true },
          { name: 'expiresAt', type: 'timestamp', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'live_streams',
      new TableIndex({
        name: 'IDX_live_streams_hostId',
        columnNames: ['hostId'],
      }),
    );
    await queryRunner.createIndex(
      'live_streams',
      new TableIndex({
        name: 'IDX_live_streams_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'stream_viewers',
      new TableIndex({
        name: 'IDX_stream_viewers_streamId_viewerId',
        columnNames: ['streamId', 'viewerId'],
      }),
    );
    await queryRunner.createIndex(
      'stream_viewers',
      new TableIndex({
        name: 'IDX_stream_viewers_streamId_isActive',
        columnNames: ['streamId', 'isActive'],
      }),
    );
    await queryRunner.createIndex(
      'stream_chat_messages',
      new TableIndex({
        name: 'IDX_stream_chat_messages_streamId_createdAt',
        columnNames: ['streamId', 'createdAt'],
      }),
    );
    await queryRunner.createIndex(
      'stream_moderation_actions',
      new TableIndex({
        name: 'IDX_stream_moderation_actions_streamId_targetUserId',
        columnNames: ['streamId', 'targetUserId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stream_moderation_actions');
    await queryRunner.dropTable('stream_chat_messages');
    await queryRunner.dropTable('stream_viewers');
    await queryRunner.dropTable('live_streams');
  }
}
