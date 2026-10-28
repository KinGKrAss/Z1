export const DECISIONS = Object.freeze({
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
});

const DEFAULT_RULES = Object.freeze({
  CREATE_RENTAL_CONTRACT: Object.freeze({
    allow: ['PROPERTY_MANAGER', 'Z1_ROOT_ADMIN'],
    requireApproval: ['AI_AGENT'],
  }),
});

function validateRules(rules) {
  if (rules === null || typeof rules !== 'object') {
    throw new TypeError('rules must be an object');
  }
  const frozen = {};
  for (const [action, rule] of Object.entries(rules)) {
    for (const key of ['allow', 'requireApproval']) {
      const list = rule?.[key];
      if (list !== undefined && !(Array.isArray(list) && list.every((r) => typeof r === 'string'))) {
        throw new TypeError(`rule "${action}".${key} must be an array of role strings`);
      }
    }
    frozen[action] = Object.freeze({
      allow: Object.freeze([...(rule.allow ?? [])]),
      requireApproval: Object.freeze([...(rule.requireApproval ?? [])]),
    });
  }
  return Object.freeze(frozen);
}

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

export class Z1AuthorizationPolicy {
  constructor({ rules = DEFAULT_RULES } = {}) {
    this.rules = validateRules(rules);
  }

  evaluate({ actor, roles, action, resource } = {}) {
    const base = { actor, action, resource };
    const deny = (reason) => ({ ...base, decision: DECISIONS.DENY, reason });

    if (!isNonEmptyString(actor)) return deny('Missing or invalid actor');
    if (!isNonEmptyString(resource)) return deny('Missing or invalid resource');
    if (!isNonEmptyString(action)) return deny('Missing or invalid action');
    if (!Array.isArray(roles) || roles.length === 0 || !roles.every(isNonEmptyString)) {
      return deny('Missing or invalid roles');
    }

    const rule = Object.hasOwn(this.rules, action) ? this.rules[action] : null;
    if (!rule) return deny('No policy rule for action (deny by default)');

    // Approval-required roles take precedence so mixing roles cannot bypass approval.
    if (roles.some((role) => rule.requireApproval.includes(role))) {
      return { ...base, decision: DECISIONS.REQUIRE_APPROVAL, reason: 'Action requires human approval' };
    }
    if (roles.some((role) => rule.allow.includes(role))) {
      return { ...base, decision: DECISIONS.ALLOW, reason: 'Role is permitted for action' };
    }
    return deny('No role permitted for action');
  }
}
