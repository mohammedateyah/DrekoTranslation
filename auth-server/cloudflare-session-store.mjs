export class D1SessionStore {
  constructor(database) {
    if (!database) throw new Error("The Cloudflare D1 database binding is missing.");
    this.database = database;
  }

  async create(session) {
    await this.database.batch([
      this.database.prepare(
        `INSERT INTO oauth_sessions (id, state, status, expires_at)
         VALUES (?, ?, ?, ?)`
      ).bind(session.id, session.state, session.status, session.expiresAt),
      this.database.prepare(
        `INSERT INTO oauth_states (state, session_id, expires_at)
         VALUES (?, ?, ?)`
      ).bind(session.state, session.id, session.expiresAt)
    ]);
  }

  async isPendingState(state, now) {
    const row = await this.database.prepare(
      `SELECT 1
       FROM oauth_states AS states
       JOIN oauth_sessions AS sessions ON sessions.id = states.session_id
       WHERE states.state = ? AND states.expires_at > ?
         AND sessions.status = 'pending' AND sessions.expires_at > ?
       LIMIT 1`
    ).bind(state, now, now).first();
    return Boolean(row);
  }

  async claimState(state, now) {
    const results = await this.database.batch([
      this.database.prepare(
        `UPDATE oauth_sessions
         SET status = 'verifying'
         WHERE id = (
           SELECT session_id FROM oauth_states
           WHERE state = ? AND expires_at > ?
         )
         AND status = 'pending' AND expires_at > ?
         RETURNING id, state, status, expires_at, result_json, code`
      ).bind(state, now, now),
      this.database.prepare(
        `DELETE FROM oauth_states
         WHERE state = ? AND session_id IN (
           SELECT id FROM oauth_sessions WHERE status = 'verifying'
         )`
      ).bind(state)
    ]);
    const session = results[0]?.results?.[0];
    if (!session) return null;
    return this.deserialize(session);
  }

  async read(sessionId, now) {
    const session = await this.database.prepare(
      `SELECT id, state, status, expires_at, result_json, code
       FROM oauth_sessions WHERE id = ?`
    ).bind(sessionId).first();
    if (!session) return null;

    if (session.expires_at <= now ||
        session.status === "completed" ||
        session.status === "failed") {
      await this.deleteSession(session.id, session.state);
      return session.expires_at <= now ? null : this.deserialize(session);
    }
    return this.deserialize(session);
  }

  async update(session) {
    const resultJson = session.result ? JSON.stringify(session.result) : null;
    await this.database.prepare(
      `UPDATE oauth_sessions
       SET status = ?, result_json = ?, code = ?
       WHERE id = ?`
    ).bind(session.status, resultJson, session.code || null, session.id).run();
  }

  async deleteExpiredSessions(now) {
    await this.database.batch([
      this.database.prepare(
        "DELETE FROM oauth_states WHERE expires_at <= ?"
      ).bind(now),
      this.database.prepare(
        "DELETE FROM oauth_sessions WHERE expires_at <= ?"
      ).bind(now)
    ]);
  }

  async deleteSession(sessionId, state) {
    await this.database.batch([
      this.database.prepare(
        "DELETE FROM oauth_states WHERE state = ?"
      ).bind(state),
      this.database.prepare(
        "DELETE FROM oauth_sessions WHERE id = ?"
      ).bind(sessionId)
    ]);
  }

  deserialize(row) {
    return {
      id: row.id,
      state: row.state,
      status: row.status,
      expiresAt: row.expires_at,
      ...(row.result_json ? { result: JSON.parse(row.result_json) } : {}),
      ...(row.code ? { code: row.code } : {})
    };
  }
}
