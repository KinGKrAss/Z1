import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPptTransaction,
  authorizePptTransaction,
  settlePptTransaction,
  appendLedger,
} from '../runtime/ppt-transaction-engine.mjs';

test('creates a PPT transaction with a 1% sandbox fee', () => {
  const tx = createPptTransaction({
    actorId: 'kingkrass',
    modelId: 'zoe',
    action: 'workflow.execute',
    amountPpt: 100,
  });
  assert.equal(tx.asset, 'PPT');
  assert.equal(tx.fee_ppt, 1);
  assert.equal(tx.net_ppt, 99);
  assert.equal(tx.status, 'PENDING_AUTHORIZATION');
});

test('Z1 policy authorizes and settles a transaction', () => {
  const tx = createPptTransaction({
    actorId: 'kingkrass',
    modelId: 'gemini',
    action: 'document.workflow',
    amountPpt: 50,
  });
  const authorized = authorizePptTransaction(tx, {
    id: 'Z1_MODEL_POLICY',
    allowedModels: ['zoe', 'gemini'],
    maxAmountPpt: 100,
  });
  assert.equal(authorized.status, 'AUTHORIZED');
  const settled = settlePptTransaction(authorized);
  assert.equal(settled.status, 'SETTLED_SANDBOX');
});

test('Z1 denies an unauthorized model', () => {
  const tx = createPptTransaction({
    actorId: 'kingkrass',
    modelId: 'unknown-model',
    action: 'workflow.execute',
    amountPpt: 10,
  });
  const result = authorizePptTransaction(tx, {
    allowedModels: ['zoe'],
  });
  assert.equal(result.status, 'DENIED');
  assert.equal(result.denial_reason, 'MODEL_NOT_AUTHORIZED');
});

test('ledger append records the transaction economics', () => {
  const tx = createPptTransaction({
    actorId: 'kingkrass',
    modelId: 'zoe',
    action: 'marketplace.purchase',
    amountPpt: 25,
  });
  const ledger = appendLedger([], tx);
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].transaction_id, tx.id);
  assert.equal(ledger[0].fee_ppt, 0.25);
});
