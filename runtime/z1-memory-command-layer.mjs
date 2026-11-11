import crypto from 'node:crypto';

const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export class Z1MemoryCommandLayer {
  constructor() {
    this.staged = new Map();
    this.committed = new Map();
    this.adminRequests = new Map();
    this.idempotency = new Map();
  }

  execute({ command, actor, payload = {}, idempotencyKey = null }) {
    if (!command || !actor) throw new Error('command and actor are required');

    const replayKey = idempotencyKey ? `${actor}:${command}:${idempotencyKey}` : null;
    if (replayKey && this.idempotency.has(replayKey)) {
      return this.idempotency.get(replayKey);
    }

    let result;
    switch (command) {
      case 'Z1.MEMORY.STORE':
        result = this.store(actor, payload);
        break;
      case 'Z1.MEMORY.COMMIT':
        result = this.commit(actor, payload);
        break;
      case 'Z1.MEMORY.RECALL':
        result = this.recall(payload);
        break;
      case 'Z1.MEMORY.REJECT':
        result = this.reject(actor, payload);
        break;
      case 'Z1.ADMIN.REQUEST':
        result = this.requestAdmin(actor, payload);
        break;
      default:
        throw new Error(`unknown Z1 command: ${command}`);
    }

    if (replayKey) this.idempotency.set(replayKey, result);
    return result;
  }

  store(actor, payload) {
    if (!payload.content || typeof payload.content !== 'string') {
      throw new Error('content is required');
    }
    const entry = {
      memoryId: makeId('Z1-MEM'),
      status: 'STAGED',
      content: payload.content,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      metadata: payload.metadata ?? {},
      source: actor,
      createdAt: now(),
      events: [{ type: 'MEMORY_STAGED', actor, at: now() }],
    };
    this.staged.set(entry.memoryId, entry);
    return entry;
  }

  commit(actor, payload) {
    const entry = this.staged.get(payload.memoryId);
    if (!entry) throw new Error('staged memory not found');
    if (entry.status !== 'STAGED') throw new Error('memory is not committable');

    const committed = {
      ...entry,
      status: 'COMMITTED',
      committedAt: now(),
      committedBy: actor,
      events: [...entry.events, { type: 'MEMORY_COMMITTED', actor, at: now() }],
    };
    this.staged.delete(entry.memoryId);
    this.committed.set(committed.memoryId, committed);
    return committed;
  }

  reject(actor, payload) {
    const entry = this.staged.get(payload.memoryId);
    if (!entry) throw new Error('staged memory not found');
    const rejected = {
      ...entry,
      status: 'REJECTED',
      rejectedAt: now(),
      rejectedBy: actor,
      reason: payload.reason ?? null,
      events: [...entry.events, { type: 'MEMORY_REJECTED', actor, at: now() }],
    };
    this.staged.delete(entry.memoryId);
    return rejected;
  }

  recall(payload) {
    const query = String(payload.query ?? '').trim().toLowerCase();
    if (!query) throw new Error('query is required');

    const limit = Math.min(Number(payload.limit ?? 20), 100);
    return [...this.committed.values()]
      .filter((entry) => {
        const haystack = [entry.content, ...(entry.tags ?? [])].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, limit);
  }

  requestAdmin(actor, payload) {
    if (!payload.action || !payload.resource) {
      throw new Error('action and resource are required');
    }
    const request = {
      requestId: makeId('Z1-ADM'),
      status: 'PENDING_AUTHORIZATION',
      actor,
      action: payload.action,
      resource: payload.resource,
      context: payload.context ?? {},
      createdAt: now(),
      audit: [{ type: 'ADMIN_REQUEST_CREATED', actor, at: now() }],
    };
    this.adminRequests.set(request.requestId, request);
    return request;
  }
}
