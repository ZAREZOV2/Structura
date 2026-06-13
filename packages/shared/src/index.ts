/**
 * Shared constants and types used by both the API and the web client.
 */

export const WORKSPACE_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'numberedList',
  'todo',
  'quote',
  'code',
  'divider',
  'image',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
