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

const base = { actor: 'a', resource: 'PROPERTY:1', action: 'CREATE_RENTAL_CONTRACT' };

test('mixed AI_AGENT and manager roles still require approval', () => {
  const r = new Z1AuthorizationPolicy().evaluate({ ...base, roles: ['PROPERTY_MANAGER', 'AI_AGENT'] });
  assert.equal(r.decision, 'REQUIRE_APPROVAL');
});

test('custom rules are copied and frozen', () => {
  const rules = { X: { allow: ['A'] } };
  const policy = new Z1AuthorizationPolicy({ rules });
  rules.X.allow.push('B');
  assert.equal(policy.evaluate({ ...base, action: 'X', roles: ['B'] }).decision, 'DENY');
  assert.throws(() => { policy.rules.Y = {}; }, TypeError);
});

test('invalid rules are rejected', () => {
  assert.throws(() => new Z1AuthorizationPolicy({ rules: { X: { allow: 'A' } } }), TypeError);
  assert.throws(() => new Z1AuthorizationPolicy({ rules: null }), TypeError);
});

test('invalid input is denied', () => {
  const p = new Z1AuthorizationPolicy();
  const roles = ['PROPERTY_MANAGER'];
  for (const input of [
    { ...base, roles, actor: undefined },
    { ...base, roles, resource: '' },
    { ...base, roles: [] },
    { ...base, roles: 'PROPERTY_MANAGER' },
    { ...base, roles: [1] },
    { ...base, roles, action: 'toString' },
  ]) {
    assert.equal(p.evaluate(input).decision, 'DENY');
  }
});
