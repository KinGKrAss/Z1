import test from 'node:test';
import assert from 'node:assert/strict';
import { Z1AuthorizationPolicy, z1DefaultPolicies } from '../runtime/z1-authorization-policy.mjs';

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

test('explicit DENY policy overrides a matching ALLOW policy', () => {
  const policy = new Z1AuthorizationPolicy([
    {
      id: 'broad-allow',
      effect: 'ALLOW',
      roles: ['PROPERTY_MANAGER'],
      actions: ['CREATE_RENTAL_CONTRACT'],
      resources: ['PROPERTY:*'],
    },
    {
      id: 'restricted-property',
      effect: 'DENY',
      roles: ['PROPERTY_MANAGER'],
      actions: ['CREATE_RENTAL_CONTRACT'],
      resources: ['PROPERTY:1'],
    },
  ]);
  const result = policy.evaluate({
    actor: 'manager-1',
    roles: ['PROPERTY_MANAGER'],
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policyId, 'restricted-property');
});

test('explicit DENY policy overrides a matching approval policy', () => {
  const policy = new Z1AuthorizationPolicy([
    {
      id: 'broad-approval',
      effect: 'REQUIRE_APPROVAL',
      roles: ['PROPERTY_MANAGER'],
      actions: ['CREATE_RENTAL_CONTRACT'],
      resources: ['PROPERTY:*'],
    },
    {
      id: 'restricted-property',
      effect: 'DENY',
      roles: ['PROPERTY_MANAGER'],
      actions: ['CREATE_RENTAL_CONTRACT'],
      resources: ['PROPERTY:1'],
    },
  ]);
  const result = policy.evaluate({
    actor: 'manager-1',
    roles: ['PROPERTY_MANAGER'],
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policyId, 'restricted-property');
});

test('audit records are isolated from the result and caller-owned inputs', () => {
  const policy = new Z1AuthorizationPolicy();
  const roles = ['AI_AGENT'];
  const context = { approval: { required: false } };
  const result = policy.evaluate({
    actor: 'agent-1',
    roles,
    action: 'CREATE_RENTAL_CONTRACT',
    resource: 'PROPERTY:1',
    context,
  });

  roles.push('Z1_ROOT_ADMIN');
  context.approval.required = true;
  result.decision = 'ALLOW';
  result.roles.push('PROPERTY_MANAGER');
  result.context.approval.required = true;

  assert.equal(policy.audit[0].decision, 'REQUIRE_APPROVAL');
  assert.deepEqual(policy.audit[0].roles, ['AI_AGENT']);
  assert.deepEqual(policy.audit[0].context, { approval: { required: false } });
});

test('default policies and their nested rules are immutable', () => {
  const policy = new Z1AuthorizationPolicy();

  assert.ok(Object.isFrozen(z1DefaultPolicies));
  assert.ok(Object.isFrozen(policy.policies));
  for (const rule of z1DefaultPolicies) {
    assert.ok(Object.isFrozen(rule));
    assert.ok(Object.isFrozen(rule.roles));
    assert.ok(Object.isFrozen(rule.actions));
    assert.ok(Object.isFrozen(rule.resources));
  }
  assert.throws(() => policy.policies[1].roles.push('Z1_ROOT_ADMIN'), TypeError);
});
