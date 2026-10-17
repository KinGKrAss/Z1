import test from 'node:test';
import assert from 'node:assert/strict';
import { Z1MemoryCommandLayer } from '../runtime/z1-memory-command-layer.mjs';

test('stages and commits memory', () => {
  const z1 = new Z1MemoryCommandLayer();
  const staged = z1.execute({
    command: 'Z1.MEMORY.STORE',
    actor: 'zoe',
    payload: { content: 'Mietverwaltung ist priorisiert', tags: ['Z1', 'Miete'] },
  });
  assert.equal(staged.status, 'STAGED');

  const committed = z1.execute({
    command: 'Z1.MEMORY.COMMIT',
    actor: 'zoe',
    payload: { memoryId: staged.memoryId },
  });
  assert.equal(committed.status, 'COMMITTED');
});

test('recalls committed memory only', () => {
  const z1 = new Z1MemoryCommandLayer();
  const staged = z1.execute({
    command: 'Z1.MEMORY.STORE',
    actor: 'model-a',
    payload: { content: 'PPT settlement remains behind authorization', tags: ['PPT'] },
  });
  z1.execute({ command: 'Z1.MEMORY.COMMIT', actor: 'z1-admin', payload: { memoryId: staged.memoryId } });

  const results = z1.execute({
    command: 'Z1.MEMORY.RECALL',
    actor: 'model-b',
    payload: { query: 'PPT' },
  });
  assert.equal(results.length, 1);
});

test('admin actions become pending requests', () => {
  const z1 = new Z1MemoryCommandLayer();
  const request = z1.execute({
    command: 'Z1.ADMIN.REQUEST',
    actor: 'gemini',
    payload: { action: 'CREATE_RENTAL_CONTRACT', resource: 'PROPERTY-001' },
  });
  assert.equal(request.status, 'PENDING_AUTHORIZATION');
});

test('idempotency prevents duplicate staging', () => {
  const z1 = new Z1MemoryCommandLayer();
  const input = {
    command: 'Z1.MEMORY.STORE',
    actor: 'zoe',
    payload: { content: 'same memory' },
    idempotencyKey: 'abc',
  };
  const first = z1.execute(input);
  const second = z1.execute(input);
  assert.equal(first.memoryId, second.memoryId);
});
