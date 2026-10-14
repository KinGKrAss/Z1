import crypto from 'node:crypto';

const STATUSES = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'SIGNATURE_PENDING',
  'SIGNED',
  'ACTIVE',
  'TERMINATED',
  'ARCHIVED',
];

const TRANSITIONS = {
  DRAFT: ['REVIEW'],
  REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['SIGNATURE_PENDING'],
  SIGNATURE_PENDING: ['SIGNED'],
  SIGNED: ['ACTIVE'],
  ACTIVE: ['TERMINATED'],
  TERMINATED: ['ARCHIVED'],
  ARCHIVED: [],
};

function id() {
  return `MIET-${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

export function createRentalContract(input) {
  const required = ['landlordId', 'tenantId', 'propertyId', 'startDate', 'baseRent'];
  for (const field of required) {
    if (input?.[field] === undefined || input?.[field] === null || input?.[field] === '') {
      throw new Error(`${field} is required`);
    }
  }
  if (Number(input.baseRent) < 0) throw new Error('baseRent must be >= 0');

  const contract = {
    contractId: id(),
    version: 1,
    status: 'DRAFT',
    createdAt: now(),
    updatedAt: now(),
    landlordId: input.landlordId,
    tenantId: input.tenantId,
    propertyId: input.propertyId,
    address: input.address ?? null,
    unitId: input.unitId ?? null,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    indefinite: input.indefinite ?? true,
    baseRent: Number(input.baseRent),
    operatingCostAdvance: Number(input.operatingCostAdvance ?? 0),
    deposit: Number(input.deposit ?? 0),
    paymentInterval: input.paymentInterval ?? 'MONTHLY',
    dueDay: input.dueDay ?? 3,
    indexation: input.indexation ?? null,
    permittedUse: input.permittedUse ?? 'RESIDENTIAL',
    attachments: input.attachments ?? [],
    signatureEvidence: null,
    audit: [{ event: 'CONTRACT_CREATED', at: now(), actor: input.createdBy ?? 'z1' }],
  };
  return contract;
}

export function transitionRentalContract(contract, nextStatus, actor = 'z1', metadata = {}) {
  if (!STATUSES.includes(nextStatus)) throw new Error(`invalid status: ${nextStatus}`);
  if (!TRANSITIONS[contract.status].includes(nextStatus)) {
    throw new Error(`invalid transition ${contract.status} -> ${nextStatus}`);
  }
  const next = {
    ...contract,
    status: nextStatus,
    updatedAt: now(),
    audit: [
      ...(contract.audit ?? []),
      { event: 'STATUS_CHANGED', from: contract.status, to: nextStatus, at: now(), actor, metadata },
    ],
  };
  if (nextStatus === 'SIGNED') {
    next.signedAt = now();
    next.versionHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ ...next, audit: undefined }))
      .digest('hex');
  }
  return next;
}

export function createAmendment(contract, changes, actor = 'z1') {
  if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
    throw new Error('amendments require a signed or active contract');
  }
  return {
    ...contract,
    ...changes,
    contractId: id(),
    version: contract.version + 1,
    status: 'DRAFT',
    createdAt: now(),
    updatedAt: now(),
    priorContractId: contract.contractId,
    signedAt: null,
    versionHash: null,
    signatureEvidence: null,
    audit: [
      { event: 'AMENDMENT_CREATED', at: now(), actor, priorContractId: contract.contractId },
    ],
  };
}

export const rentalContractStatuses = Object.freeze([...STATUSES]);
