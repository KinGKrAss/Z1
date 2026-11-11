import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRentalContract,
  transitionRentalContract,
  createAmendment,
} from '../runtime/digital-mietvertrag.mjs';

test('creates a rental contract in DRAFT', () => {
  const contract = createRentalContract({
    landlordId: 'landlord-1',
    tenantId: 'tenant-1',
    propertyId: 'property-1',
    startDate: '2026-09-01',
    baseRent: 1200,
  });
  assert.equal(contract.status, 'DRAFT');
  assert.equal(contract.paymentInterval, 'MONTHLY');
});

test('runs the contract through approval and signature lifecycle', () => {
  let c = createRentalContract({ landlordId: 'l', tenantId: 't', propertyId: 'p', startDate: '2026-09-01', baseRent: 900 });
  for (const status of ['REVIEW', 'APPROVED', 'SIGNATURE_PENDING', 'SIGNED', 'ACTIVE']) {
    c = transitionRentalContract(c, status, 'zoe');
  }
  assert.equal(c.status, 'ACTIVE');
  assert.equal(c.versionHash.length, 64);
  assert.ok(c.audit.length >= 6);
});

test('does not allow skipping authorization stages', () => {
  const c = createRentalContract({ landlordId: 'l', tenantId: 't', propertyId: 'p', startDate: '2026-09-01', baseRent: 900 });
  assert.throws(() => transitionRentalContract(c, 'SIGNED'), /invalid transition/);
});

test('creates an amendment as a new draft version', () => {
  let c = createRentalContract({ landlordId: 'l', tenantId: 't', propertyId: 'p', startDate: '2026-09-01', baseRent: 900 });
  for (const status of ['REVIEW', 'APPROVED', 'SIGNATURE_PENDING', 'SIGNED']) c = transitionRentalContract(c, status);
  const amendment = createAmendment(c, { baseRent: 950 }, 'landlord-1');
  assert.equal(amendment.status, 'DRAFT');
  assert.equal(amendment.version, 2);
  assert.equal(amendment.priorContractId, c.contractId);
  assert.equal(amendment.baseRent, 950);
});
