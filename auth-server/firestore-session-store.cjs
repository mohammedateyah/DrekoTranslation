const SESSION_COLLECTION = "discordOAuthSessions";
const STATE_COLLECTION = "discordOAuthStates";

class FirestoreSessionStore {
  constructor(firestore) {
    this.firestore = firestore;
    this.sessions = firestore.collection(SESSION_COLLECTION);
    this.states = firestore.collection(STATE_COLLECTION);
  }

  async create(session) {
    const sessionRef = this.sessions.doc(session.id);
    const stateRef = this.states.doc(session.state);
    await this.firestore.runTransaction(async (transaction) => {
      transaction.create(sessionRef, session);
      transaction.create(stateRef, {
        sessionId: session.id,
        expiresAt: session.expiresAt
      });
    });
  }

  async isPendingState(state, now) {
    const stateSnapshot = await this.states.doc(state).get();
    if (!stateSnapshot.exists || stateSnapshot.get("expiresAt") <= now) return false;
    const sessionSnapshot = await this.sessions.doc(stateSnapshot.get("sessionId")).get();
    return sessionSnapshot.exists &&
      sessionSnapshot.get("status") === "pending" &&
      sessionSnapshot.get("expiresAt") > now;
  }

  async claimState(state, now) {
    const stateRef = this.states.doc(state);
    return this.firestore.runTransaction(async (transaction) => {
      const stateSnapshot = await transaction.get(stateRef);
      if (!stateSnapshot.exists || stateSnapshot.get("expiresAt") <= now) return null;
      const sessionRef = this.sessions.doc(stateSnapshot.get("sessionId"));
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists) {
        transaction.delete(stateRef);
        return null;
      }
      const session = sessionSnapshot.data();
      if (session.status !== "pending" || session.expiresAt <= now) {
        transaction.delete(stateRef);
        return null;
      }
      transaction.delete(stateRef);
      transaction.update(sessionRef, { status: "verifying" });
      return { ...session, status: "verifying" };
    });
  }

  async read(sessionId, now) {
    const sessionRef = this.sessions.doc(sessionId);
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(sessionRef);
      if (!snapshot.exists) return null;
      const session = snapshot.data();
      if (session.expiresAt <= now) {
        transaction.delete(sessionRef);
        if (session.state) transaction.delete(this.states.doc(session.state));
        return null;
      }
      if (session.status === "completed" || session.status === "failed") {
        transaction.delete(sessionRef);
        return session;
      }
      return session;
    });
  }

  async update(session) {
    await this.sessions.doc(session.id).set(session);
  }

  async deleteExpiredSessions(now) {
    const snapshot = await this.sessions.where("expiresAt", "<=", now).limit(100).get();
    if (snapshot.empty) return;
    const batch = this.firestore.batch();
    for (const document of snapshot.docs) {
      const session = document.data();
      batch.delete(document.ref);
      if (session.state) batch.delete(this.states.doc(session.state));
    }
    await batch.commit();
  }
}

module.exports = { FirestoreSessionStore };
