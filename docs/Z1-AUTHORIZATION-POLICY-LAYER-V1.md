# Z1 Authorization & Policy Layer v1

## Purpose
Central authorization boundary for Z1 administrative actions.

## Principle
No AI model, connector or user self-grants authority. Every action is evaluated against an explicit policy.

## Decision states
- ALLOW
- DENY
- REQUIRE_APPROVAL

## Evaluation inputs
- actor identity
- actor roles
- resource
- action
- requested context
- policy rules

## Default posture
Deny by default.

## Separation of duties
The requesting actor cannot approve its own request unless an explicit policy permits it.

## V1 roles
- Z1_ROOT_ADMIN
- Z1_ADMIN
- PROPERTY_MANAGER
- AI_AGENT
- READ_ONLY

## Production boundary
This v1 is an in-process policy engine. Production requires authenticated identities, persistent policy storage, tenant isolation, approval workflows and cryptographic audit logging.
