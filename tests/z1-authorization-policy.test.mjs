import test from 'node:test';
import assert from 'node:assert/strict';
import { Z1AuthorizationPolicy } from '../runtime/z1-authorization-policy.mjs';

test('denies unknown actions by default', () => {
  const policy = new Z1AuthorizationPolicy();
  const result = policy.evaluate({
    actor: 'model-x',
    roles: ['AI_AGENT'],
    action: 'DELETE_ALL_DATA',
    resource: 'PROPERTY:1',
  });
  assert.equal(result.decision, 'DENY');
});

test('AI agent administrative action requires approval', () => {
  const policy = new Z1AuthorizationPolicy();
  const result = policy.evaluate({
    actor: 'zoe',
    roles: ['AI_AGENT'],
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
  });
  assert.equal(result.decision, 'REQUIRE_APPROVAL');
});

test('property manager may create rental contracts', () => {
  const policy = new Z1AuthorizationPolicy();
  const result = policy.evaluate({
    actor: 'manager-1',
    roles: ['PROPERTY_MANAGER'],
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
  });
  assert.equal(result.decision, 'ALLOW');
});

test('root admin policy can allow explicitly configured actions', () => {
  const policy = new Z1AuthorizationPolicy();
  const result = policy.evaluate({
    actor: 'root',
    roles: ['Z1_ROOT_ADMIN'],
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
  });
  assert.equal(result.decision, 'ALLOW');
});
