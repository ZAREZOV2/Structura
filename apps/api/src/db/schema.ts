import { sql } from 'drizzle-orm';
import {
  type AnySQLiteColumn,
  blob,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * SQLite schema (Cloudflare D1 in production, bun:sqlite for local dev & tests).
 *
 * Notes on type choices vs. the original PostgreSQL schema:
 * - UUID primary keys are stored as `text` and generated with `crypto.randomUUID`
 *   (available in both Bun and the Workers runtime).
 * - Timestamps use `integer` in `timestamp` mode so Drizzle returns `Date`s.
 * - JSON document content uses `text` in `json` mode (auto stringify/parse).
 * - Binary Yjs state uses `blob`.
 */

export const WORKSPACE_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
};

export const users = sqliteTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: id(),
    name: text('name').notNull(),
    icon: text('icon'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index('workspaces_owner_idx').on(t.ownerId)],
);

export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: WORKSPACE_ROLES }).notNull().default('editor'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index('workspace_members_user_idx').on(t.userId),
  ],
);

export const pages = sqliteTable(
  'pages',
  {
    id: id(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): AnySQLiteColumn => pages.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull().default('Untitled'),
    icon: text('icon'),
    coverUrl: text('cover_url'),
    // Fractional index for ordering among siblings (e.g. "a0", "a1").
    position: text('position').notNull().default('a0'),
    // Editor document serialised as JSON (used for rendering & plain-text extraction).
    content: text('content', { mode: 'json' })
      .$type<unknown>()
      .notNull()
      .$defaultFn(() => []),
    // Binary Yjs document state for realtime collaboration.
    yjsState: blob('yjs_state'),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('pages_workspace_idx').on(t.workspaceId), index('pages_parent_idx').on(t.parentId)],
);

export const links = sqliteTable(
  'links',
  {
    id: id(),
    sourcePageId: text('source_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    targetPageId: text('target_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    context: text('context'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('links_source_target_unique').on(t.sourcePageId, t.targetPageId),
    index('links_target_idx').on(t.targetPageId),
  ],
);

export const tags = sqliteTable(
  'tags',
  {
    id: id(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('tags_workspace_name_unique').on(t.workspaceId, t.name)],
);

export const pageTags = sqliteTable(
  'page_tags',
  {
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.tagId] })],
);

export const schema = {
  users,
  workspaces,
  workspaceMembers,
  pages,
  links,
  tags,
  pageTags,
};

// Re-export for migrations that need raw SQL helpers.
export { sql };
