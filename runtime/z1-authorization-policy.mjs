import crypto from 'node:crypto';

const now = () => new Date().toISOString();

const DEFAULT_POLICIES = [
  {
    id: 'read-only-recall',
    effect: 'ALLOW',
    roles: ['Z1_ROOT_ADMIN', 'Z1_ADMIN', 'PROPERTY_MANAGER', 'AI_AGENT', 'READ_ONLY'],
    actions: ['MEMORY_RECALL'],
    resources: ['*'],
  },
  {
    id: 'ai-agent-admin-request',
    effect: 'REQUIRE_APPROVAL',
    roles: ['AI_AGENT'],
    actions: ['CREATE_RENTAL_CONTRACT', 'UPDATE_RENTAL_CONTRACT', 'CREATE_PAYMENT_INSTRUCTION'],
    resources: ['*'],
  },
  {
    id: 'property-manager-contract',
    effect: 'ALLOW',
    roles: ['PROPERTY_MANAGER', 'Z1_ADMIN', 'Z1_ROOT_ADMIN'],
    actions: ['CREATE_RENTAL_CONTRACT', 'UPDATE_RENTAL_CONTRACT'],
    resources: ['PROPERTY:*'],
  },
  {
    id: 'admin-payment-instruction',
    effect: 'REQUIRE_APPROVAL',
    roles: ['PROPERTY_MANAGER', 'Z1_ADMIN'],
    actions: ['CREATE_PAYMENT_INSTRUCTION'],
    resources: ['PROPERTY:*'],
  },
  {
    id: 'root-admin',
    effect: 'ALLOW',
    roles: ['Z1_ROOT_ADMIN'],
    actions: ['*'],
    resources: ['*'],
  },
];

function matches(patterns, value) {
  return patterns.some((pattern) => pattern === '*' || pattern === value || (pattern.endsWith('*') && value.startsWith(pattern.slice(0, -1))));
}

export class Z1AuthorizationPolicy {
  constructor(policies = DEFAULT_POLICIES) {
    this.policies = policies;
    this.audit = [];
  }

  evaluate({ actor, roles = [], action, resource, context = {} }) {
    if (!actor || !action || !resource) throw new Error('actor, action and resource are required');

    const matching = this.policies.filter((policy) =>
      roles.some((role) => policy.roles.includes(role)) &&
      matches(policy.actions, action) &&
      matches(policy.resources, resource)
    );

    let decision = 'DENY';
    let policyId = null;

    if (matching.some((policy) => policy.effect === 'ALLOW')) {
      decision = 'ALLOW';
      policyId = matching.find((policy) => policy.effect === 'ALLOW').id;
    } else if (matching.some((policy) => policy.effect === 'REQUIRE_APPROVAL')) {
      decision = 'REQUIRE_APPROVAL';
      policyId = matching.find((policy) => policy.effect === 'REQUIRE_APPROVAL').id;
    }

    const result = {
      decisionId: `Z1-AUTH-${crypto.randomUUID()}`,
      decision,
      policyId,
      actor,
      roles,
      action,
      resource,
      context,
      evaluatedAt: now(),
    };

    this.audit.push(result);
    return result;
  }

  authorizeAdminRequest(request, actorContext) {
    const decision = this.evaluate({
      actor: request.actor,
      roles: actorContext.roles,
      action: request.action,
      resource: request.resource,
      context: request.context,
    });

    return {
      ...request,
      authorization: decision,
      status: decision.decision === 'ALLOW'
        ? 'AUTHORIZED'
        : decision.decision === 'REQUIRE_APPROVAL'
          ? 'PENDING_APPROVAL'
          : 'DENIED',
    };
  }
}

export const z1DefaultPolicies = Object.freeze(DEFAULT_POLICIES);
