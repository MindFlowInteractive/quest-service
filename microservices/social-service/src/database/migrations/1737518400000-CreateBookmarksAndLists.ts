import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookmarksAndLists1737518400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tags table
    await queryRunner.query(
      `
      CREATE TABLE social.tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", name)
      )
      `,
    );

    // Create bookmarks table
    await queryRunner.query(
      `
      CREATE TABLE social.bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "puzzleId" UUID NOT NULL,
        notes TEXT,
        "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "puzzleId")
      )
      `,
    );

    // Create bookmark_tags junction table
    await queryRunner.query(
      `
      CREATE TABLE social.bookmark_tags (
        "bookmarkId" UUID NOT NULL REFERENCES social.bookmarks(id) ON DELETE CASCADE,
        "tagId" UUID NOT NULL REFERENCES social.tags(id) ON DELETE CASCADE,
        PRIMARY KEY ("bookmarkId", "tagId")
      )
      `,
    );

    // Create custom_lists table
    await queryRunner.query(
      `
      CREATE TABLE social.custom_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
      `,
    );

    // Create list_items table
    await queryRunner.query(
      `
      CREATE TABLE social.list_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "listId" UUID NOT NULL REFERENCES social.custom_lists(id) ON DELETE CASCADE,
        "puzzleId" UUID NOT NULL,
        "order" INTEGER NOT NULL,
        notes TEXT,
        "addedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("listId", "puzzleId")
      )
      `,
    );

    // Create list_shares table
    await queryRunner.query(
      `
      CREATE TABLE social.list_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "listId" UUID NOT NULL REFERENCES social.custom_lists(id) ON DELETE CASCADE,
        "sharedWithUserId" UUID NOT NULL,
        permission VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "sharedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("listId", "sharedWithUserId")
      )
      `,
    );

    // Create indices
    await queryRunner.query(
      'CREATE INDEX idx_tags_userId ON social.tags("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_tags_userId_name ON social.tags("userId", name)',
    );

    await queryRunner.query(
      'CREATE INDEX idx_bookmarks_userId ON social.bookmarks("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookmarks_userId_puzzleId ON social.bookmarks("userId", "puzzleId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookmarks_puzzleId ON social.bookmarks("puzzleId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_bookmark_tags_bookmarkId ON social.bookmark_tags("bookmarkId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookmark_tags_tagId ON social.bookmark_tags("tagId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_custom_lists_userId ON social.custom_lists("userId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_list_items_listId ON social.list_items("listId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_list_items_listId_order ON social.list_items("listId", "order")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_list_items_puzzleId ON social.list_items("puzzleId")',
    );

    await queryRunner.query(
      'CREATE INDEX idx_list_shares_listId ON social.list_shares("listId")',
    );
    await queryRunner.query(
      'CREATE INDEX idx_list_shares_sharedWithUserId ON social.list_shares("sharedWithUserId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_list_shares_sharedWithUserId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_list_shares_listId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_list_items_puzzleId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_list_items_listId_order',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_list_items_listId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_custom_lists_userId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_bookmark_tags_tagId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_bookmark_tags_bookmarkId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_bookmarks_puzzleId',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS social.idx_bookmarks_userId_puzzleId',
    );
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_bookmarks_userId');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_tags_userId_name');
    await queryRunner.query('DROP INDEX IF EXISTS social.idx_tags_userId');

    // Drop tables
    await queryRunner.query('DROP TABLE IF EXISTS social.list_shares');
    await queryRunner.query('DROP TABLE IF EXISTS social.list_items');
    await queryRunner.query('DROP TABLE IF EXISTS social.custom_lists');
    await queryRunner.query('DROP TABLE IF EXISTS social.bookmark_tags');
    await queryRunner.query('DROP TABLE IF EXISTS social.bookmarks');
    await queryRunner.query('DROP TABLE IF EXISTS social.tags');
  }
}
