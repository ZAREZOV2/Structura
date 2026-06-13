import { eq } from 'drizzle-orm';
import { getDb } from '../db/context';
import { users } from '../db/schema';
import { hashPassword } from '../lib/password';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

type UserRow = typeof users.$inferSelect;

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return getDb().query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
}

export function findUserById(id: string): Promise<UserRow | undefined> {
  return getDb().query.users.findFirst({ where: eq(users.id, id) });
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserRow> {
  const passwordHash = await hashPassword(input.password);
  const [user] = await getDb()
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      displayName: input.displayName,
    })
    .returning();

  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}
