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

export class Z1AuthorizationPolicy {
  constructor({ rules = DEFAULT_RULES } = {}) {
    this.rules = rules;
  }

  evaluate({ actor, roles = [], action, resource } = {}) {
    const base = { actor, action, resource };
    const rule = Object.hasOwn(this.rules, action) ? this.rules[action] : null;
    if (!rule || !Array.isArray(roles)) {
      return { ...base, decision: DECISIONS.DENY, reason: 'No policy rule for action (deny by default)' };
    }
    if (roles.some((role) => rule.allow?.includes(role))) {
      return { ...base, decision: DECISIONS.ALLOW, reason: 'Role is permitted for action' };
    }
    if (roles.some((role) => rule.requireApproval?.includes(role))) {
      return { ...base, decision: DECISIONS.REQUIRE_APPROVAL, reason: 'Action requires human approval' };
    }
    return { ...base, decision: DECISIONS.DENY, reason: 'No role permitted for action' };
  }
}
