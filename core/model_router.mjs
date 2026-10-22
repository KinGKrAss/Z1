/** Server-owned, deterministic model selection. No prompts, secrets or network calls. */
import { listGovernedProviders, ModelPolicyError } from './model_policy_gateway.mjs';
import { evaluateHumanitarianAction } from './humanitarian_policy.mjs';

const identifier = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
const namespacedModelId = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}\/[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
const validModelId = (provider, model) => ['modelscope', 'nvidia'].includes(provider)
  ? typeof model === 'string' && namespacedModelId.test(model)
  : typeof model === 'string' && identifier.test(model);
const finiteNonnegative = value => Number.isFinite(value) && value >= 0;

export function selectGovernedModel(trustedAction, env = process.env, now = Date.now()) {
  if (!evaluateHumanitarianAction(trustedAction).allowed) {
    throw new ModelPolicyError('routing_action_denied', 403);
  }
  let profiles;
  try { profiles = JSON.parse(env.Z1_MODEL_ROUTING_PROFILES || '[]'); }
  catch { throw new ModelPolicyError('invalid_routing_configuration', 503); }
  if (!Array.isArray(profiles) || profiles.length > 100) {
    throw new ModelPolicyError('invalid_routing_configuration', 503);
  }
  const seen = new Set();
  for (const p of profiles) {
    if (!p || typeof p !== 'object' ||
        typeof p.provider !== 'string' || !identifier.test(p.provider) ||
        !validModelId(p.provider, p.model) ||
        typeof p.action !== 'string' || !evaluateHumanitarianAction(p.action).allowed ||
        !finiteNonnegative(p.quality) || p.quality > 1 ||
        !finiteNonnegative(p.costPerRequest) || !finiteNonnegative(p.latencyMs) ||
        typeof p.evaluationId !== 'string' || !identifier.test(p.evaluationId) ||
        typeof p.validUntil !== 'string' || !Number.isFinite(Date.parse(p.validUntil)) ||
        typeof p.allowConfidential !== 'boolean') {
      throw new ModelPolicyError('invalid_routing_configuration', 503);
    }
    const key = JSON.stringify([p.provider, p.model, p.action]);
    if (seen.has(key)) throw new ModelPolicyError('duplicate_routing_profile', 503);
    seen.add(key);
  }
  const providers = listGovernedProviders(env);
  // These workflows may contain private user-supplied region information.
  // A client cannot downgrade this requirement or widen the approved providers.
  const eligible = profiles.filter(p => p.action === trustedAction && p.allowConfidential &&
    Date.parse(p.validUntil) > now && providers.some(config =>
      config.provider === p.provider && config.configured && config.models.includes(p.model)));
  eligible.sort((a, b) => b.quality - a.quality || a.costPerRequest - b.costPerRequest ||
    a.latencyMs - b.latencyMs || compare(a.provider, b.provider) || compare(a.model, b.model));
  const selected = eligible[0];
  if (!selected) throw new ModelPolicyError('no_eligible_model', 503);
  return {
    provider: selected.provider, model: selected.model,
    routing: { algorithm: 'quality-cost-latency-v1', evaluationId: selected.evaluationId,
      reason: 'highest_quality_then_lowest_cost_then_latency' }
  };
}

function compare(a, b) { return a < b ? -1 : a > b ? 1 : 0; }


test('routes explicitly allowlisted NVIDIA NIM models', () => {
  const model = 'nvidia/nemotron-3-nano-30b-a3b';
  const configuration = {
    ...env([]), NVIDIA_API_KEY: 'test-only', Z1_NVIDIA_MODELS: model,
    Z1_MODEL_ROUTING_PROFILES: JSON.stringify([profile(model, {provider: 'nvidia'})])
  };
  const selected = selectGovernedModel('disaster_response', configuration, now);
  assert.deepEqual({provider: selected.provider, model: selected.model}, {provider: 'nvidia', model});
  const bad = {...configuration, Z1_MODEL_ROUTING_PROFILES: JSON.stringify([profile('nvidia/../escape', {provider: 'nvidia'})])};
  assert.throws(() => selectGovernedModel('disaster_response', bad, now), {code: 'invalid_routing_configuration'});
});
