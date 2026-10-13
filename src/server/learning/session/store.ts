import "server-only";
import type { TutorSession } from "@/server/learning/session/types";

/** Persistence port for sessions (PostgreSQL implementation: BLOCK 29). */
export interface SessionStore {
  get(id: string): Promise<TutorSession | undefined>;
  create(session: TutorSession): Promise<void>;
  /**
   * Saves `next` only if the stored version still equals `expectedVersion`.
   * Returns false on a concurrent change (caller reports CONFLICT).
   */
  replace(next: TutorSession, expectedVersion: number): Promise<boolean>;
}

/** Process-local store for tests and for the guest flow before BLOCK 29. */
export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, TutorSession>();

  async get(id: string) {
    const found = this.sessions.get(id);
    return found ? structuredClone(found) : undefined;
  }

  async create(session: TutorSession) {
    if (this.sessions.has(session.id))
      throw new Error("session id already exists");
    this.sessions.set(session.id, structuredClone(session));
  }

  async replace(next: TutorSession, expectedVersion: number) {
    const current = this.sessions.get(next.id);
    if (!current || current.version !== expectedVersion) return false;
    this.sessions.set(next.id, structuredClone(next));
    return true;
  }
}
