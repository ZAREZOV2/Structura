import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** Raw bytea column for storing the binary Yjs document state. */
const bytea = customType<{ data: Uint8Array; default: false }>({
  dataType() {
    return 'bytea';
  },
});

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const workspaceRole = pgEnum('workspace_role', ['owner', 'admin', 'editor', 'viewer']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    icon: text('icon'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index('workspaces_owner_idx').on(t.ownerId)],
);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRole('role').notNull().default('editor'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index('workspace_members_user_idx').on(t.userId),
  ],
);

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    title: text('title').notNull().default('Untitled'),
    icon: text('icon'),
    coverUrl: text('cover_url'),
    // Fractional index for ordering among siblings (e.g. "a0", "a1").
    position: text('position').notNull().default('a0'),
    // Editor document serialised as JSON (used for rendering & plain-text extraction).
    content: jsonb('content').$type<unknown>().notNull().default([]),
    // Binary Yjs document state for realtime collaboration.
    yjsState: bytea('yjs_state'),
    isArchived: boolean('is_archived').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('pages_workspace_idx').on(t.workspaceId), index('pages_parent_idx').on(t.parentId)],
);

export const links = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourcePageId: uuid('source_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    targetPageId: uuid('target_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    context: text('context'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('links_source_target_unique').on(t.sourcePageId, t.targetPageId),
    index('links_target_idx').on(t.targetPageId),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('tags_workspace_name_unique').on(t.workspaceId, t.name)],
);

export const pageTags = pgTable(
  'page_tags',
  {
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
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
