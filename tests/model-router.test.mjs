import test from 'node:test';
import assert from 'node:assert/strict';
import { selectGovernedModel } from '../core/model_router.mjs';

const now = Date.parse('2026-10-17T00:00:00Z');
const profile = (model, extra = {}) => ({
  provider: 'openai', model, action: 'disaster_response', quality: 0.9,
  costPerRequest: 0.01, latencyMs: 1000, evaluationId: 'eval-fixture',
  validUntil: '2026-11-01T00:00:00Z', allowConfidential: true, ...extra
});
const env = profiles => ({OPENAI_API_KEY: 'test-only', Z1_OPENAI_MODELS: 'a,b,c',
  Z1_MODEL_ROUTING_PROFILES: JSON.stringify(profiles)});
const select = profiles => selectGovernedModel('disaster_response', env(profiles), now);

test('ranks quality first, then cost, latency and stable model name', () => {
  assert.equal(select([profile('a'), profile('b', {quality: 0.95, costPerRequest: 1})]).model, 'b');
  assert.equal(select([profile('a'), profile('b', {costPerRequest: 0.001})]).model, 'b');
  assert.equal(select([profile('a'), profile('b', {latencyMs: 100})]).model, 'b');
  assert.equal(select([profile('b'), profile('a')]).model, 'a');
  assert.equal(select([profile('a'), profile('b')]).model, 'a');
});

test('blocks unapproved, expired, wrong-task and unconfigured candidates', () => {
  for (const changes of [
    {allowConfidential: false}, {validUntil: '2026-10-16T00:00:00Z'},
    {validUntil: '2026-10-17T00:00:00Z'}, {action: 'education'},
    {model: 'not-allowlisted'}, {provider: 'constructor'}, {provider: 'xai'}
  ]) assert.throws(() => select([profile('a', changes)]), {code: 'no_eligible_model'});
  assert.throws(() => selectGovernedModel('disaster_response', {...env([profile('a')]), OPENAI_API_KEY: ''}, now),
    {code: 'no_eligible_model'});
  assert.throws(() => select([]), {code: 'no_eligible_model'});
});

test('invalid and duplicate server configuration fails closed', () => {
  for (const p of [null, profile('a', {quality: 2}), profile('a', {quality: '0.9'}),
    profile('a', {costPerRequest: -1}), profile('a', {latencyMs: null}),
    profile('a', {validUntil: 'invalid'}), profile('a', {allowConfidential: 'true'}),
    profile('a', {evaluationId: 'private user text with spaces'})]) {
    assert.throws(() => select([p]), {code: 'invalid_routing_configuration'});
  }
  for (const raw of ['{', '{}', 'null']) assert.throws(() => selectGovernedModel('disaster_response',
    {...env([]), Z1_MODEL_ROUTING_PROFILES: raw}, now), {code: 'invalid_routing_configuration'});
  assert.throws(() => select([profile('a'), profile('a')]), {code: 'duplicate_routing_profile'});
  assert.throws(() => selectGovernedModel('weapon_control', env([profile('a')]), now), {code: 'routing_action_denied'});
});

test('selection returns only model identity and a traceable evaluation, never credentials', () => {
  const result = select([profile('a')]);
  assert.deepEqual(Object.keys(result).sort(), ['model', 'provider', 'routing']);
  assert.equal(result.routing.evaluationId, 'eval-fixture');
  assert.ok(!JSON.stringify(result).includes('test-only'));
});
