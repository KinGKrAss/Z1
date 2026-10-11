import test from 'node:test';
import assert from 'node:assert/strict';
import { PEACE_POLICY_ID, ALLOWED_SCOPES, DENIED_SCOPES, validateSpeakRequest, checkSpeakScope } from '../speak-ui-policy.mjs';
test('identifies original peace policy', () => assert.equal(PEACE_POLICY_ID, 'Z1-PEACE-001'));
test('all humanitarian categories are allowed', () => {
  for (const scope of ALLOWED_SCOPES) assert.equal(checkSpeakScope(scope).allowed, true, scope);
});
test('weaponization categories are refused', () => {
  for (const scope of DENIED_SCOPES) {
    assert.deepEqual(checkSpeakScope(scope), { allowed:false, code:'Z1_PEACE_DENIED', scope });
  }
});
test('unknown scopes and invalid inputs fail closed', () => {
  for (const scope of ['unauthorized', '', null, undefined]) assert.equal(checkSpeakScope(scope).allowed, false);
});
test('text is required and cannot exceed the limit', () => {
  assert.equal(validateSpeakRequest('', 'education').code, 'Z1_SPEAK_EMPTY');
  assert.equal(validateSpeakRequest(' '.repeat(5), 'education').code, 'Z1_SPEAK_EMPTY');
  assert.equal(validateSpeakRequest('a'.repeat(1001), 'education').code, 'Z1_SPEAK_TOO_LONG');
  assert.equal(validateSpeakRequest('Hallo', 'education').allowed, true);
});
test('invalid categories deny even with otherwise valid text', () => {
  assert.equal(validateSpeakRequest('Hallo', 'attack_planning').code, 'Z1_PEACE_DENIED');
});
