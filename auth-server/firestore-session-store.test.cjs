const assert = require("node:assert/strict");
const test = require("node:test");
const { FirestoreSessionStore } = require("./firestore-session-store.cjs");

class MemoryFirestore {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    const records = this.collections.get(name);
    return {
      doc: (id) => {
        const ref = { collection: name, id };
        ref.get = async () => snapshot(records.get(id));
        ref.set = async (data) => records.set(id, structuredClone(data));
        return ref;
      },
      where: (field, operator, value) => ({
        limit: (count) => ({
          get: async () => ({
            empty: false,
            docs: [...records.entries()]
              .filter(([, data]) => operator === "<=" && data[field] <= value)
              .slice(0, count)
              .map(([id, data]) => ({
                ref: { collection: name, id },
                data: () => structuredClone(data)
              }))
          })
        })
      })
    };
  }

  async runTransaction(callback) {
    const changes = [];
    const transaction = {
      get: async (ref) => snapshot(this.collections.get(ref.collection).get(ref.id)),
      create: (ref, data) => changes.push(() =>
        this.collections.get(ref.collection).set(ref.id, structuredClone(data))),
      update: (ref, data) => changes.push(() =>
        this.collections.get(ref.collection).set(ref.id, {
          ...this.collections.get(ref.collection).get(ref.id),
          ...structuredClone(data)
        })),
      delete: (ref) => changes.push(() => this.collections.get(ref.collection).delete(ref.id))
    };
    const result = await callback(transaction);
    for (const change of changes) change();
    return result;
  }

  batch() {
    const changes = [];
    return {
      delete: (ref) => changes.push(() =>
        this.collections.get(ref.collection).delete(ref.id)),
      commit: async () => changes.forEach((change) => change())
    };
  }
}

function snapshot(data) {
  return {
    exists: Boolean(data),
    data: () => structuredClone(data),
    get: (field) => data?.[field]
  };
}

test("persists, atomically claims, and consumes short-lived OAuth sessions", async () => {
  const firestore = new MemoryFirestore();
  const store = new FirestoreSessionStore(firestore);
  const session = {
    id: "session-1",
    state: "a".repeat(43),
    status: "pending",
    expiresAt: 1000
  };

  await store.create(session);
  assert.equal(await store.isPendingState(session.state, 999), true);
  assert.equal((await store.claimState(session.state, 999)).status, "verifying");
  assert.equal(await store.claimState(session.state, 999), null);

  await store.update({
    ...session,
    status: "completed",
    result: { customToken: "one-time-token" }
  });
  assert.deepEqual(await store.read(session.id, 999), {
    ...session,
    status: "completed",
    result: { customToken: "one-time-token" }
  });
  assert.equal(await store.read(session.id, 999), null);
  assert.deepEqual(firestore.collections.get("discordOAuthStates").get(session.state), undefined);
});

test("removes expired OAuth session and state records", async () => {
  const firestore = new MemoryFirestore();
  const store = new FirestoreSessionStore(firestore);
  const session = {
    id: "expired-session",
    state: "b".repeat(43),
    status: "pending",
    expiresAt: 100
  };
  await store.create(session);

  await store.deleteExpiredSessions(101);
  assert.equal(await store.read(session.id, 101), null);
  assert.equal(await store.isPendingState(session.state, 101), false);
});
