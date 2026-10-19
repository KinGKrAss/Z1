import crypto from 'node:crypto';

/**
 * Z1 PPT Transaction Engine — sandbox ledger.
 *
 * Design rule: the AI model never owns authority. Z1 owns authorization,
 * transaction state and the ledger. PPT is represented as a settlement unit
 * for sandbox/testnet flows until the legal and production settlement layer
 * is explicitly enabled.
 */

const DEFAULT_FEE_BPS = 100; // 1.00% platform fee for sandbox examples.

function assertPositiveAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount_ppt must be a positive number');
  }
}

function feeFromBps(amount, feeBps) {
  return Number(((amount * feeBps) / 10_000).toFixed(8));
}

export function createPptTransaction({
  actorId,
  modelId,
  action,
  amountPpt,
  feeBps = DEFAULT_FEE_BPS,
  source = 'z1',
  destination = 'z1-treasury',
  metadata = {},
}) {
  assertPositiveAmount(amountPpt);
  if (!actorId || !modelId || !action) throw new Error('actorId, modelId and action are required');
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) throw new Error('fee_bps must be 0..10000');

  const feePpt = feeFromBps(amountPpt, feeBps);
  const transaction = {
    id: `Z1-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    status: 'PENDING_AUTHORIZATION',
    asset: 'PPT',
    settlement_mode: 'SANDBOX',
    actor_id: actorId,
    model_id: modelId,
    action,
    source,
    destination,
    amount_ppt: Number(amountPpt.toFixed(8)),
    fee_bps: feeBps,
    fee_ppt: feePpt,
    net_ppt: Number((amountPpt - feePpt).toFixed(8)),
    metadata,
  };

  return transaction;
}

export function authorizePptTransaction(transaction, policy = {}) {
  if (!transaction || transaction.status !== 'PENDING_AUTHORIZATION') {
    throw new Error('transaction is not pending authorization');
  }
  if (policy.allowedModels && !policy.allowedModels.includes(transaction.model_id)) {
    return { ...transaction, status: 'DENIED', denial_reason: 'MODEL_NOT_AUTHORIZED' };
  }
  if (policy.maxAmountPpt != null && transaction.amount_ppt > policy.maxAmountPpt) {
    return { ...transaction, status: 'DENIED', denial_reason: 'AMOUNT_LIMIT_EXCEEDED' };
  }
  return {
    ...transaction,
    status: 'AUTHORIZED',
    authorized_at: new Date().toISOString(),
    authorization_policy: policy.id ?? 'Z1_DEFAULT_POLICY',
  };
}

export function settlePptTransaction(transaction) {
  if (!transaction || transaction.status !== 'AUTHORIZED') {
    throw new Error('only authorized transactions can be settled');
  }
  return {
    ...transaction,
    status: 'SETTLED_SANDBOX',
    settled_at: new Date().toISOString(),
  };
}

export function appendLedger(ledger, transaction) {
  if (!Array.isArray(ledger)) throw new Error('ledger must be an array');
  return [...ledger, {
    ledger_sequence: ledger.length + 1,
    transaction_id: transaction.id,
    recorded_at: new Date().toISOString(),
    status: transaction.status,
    asset: transaction.asset,
    amount_ppt: transaction.amount_ppt,
    fee_ppt: transaction.fee_ppt,
    model_id: transaction.model_id,
    actor_id: transaction.actor_id,
  }];
}
