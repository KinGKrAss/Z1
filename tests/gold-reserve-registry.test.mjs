import test from "node:test";
import assert from "node:assert/strict";
import { GoldReserveRegistry } from "../core/gold_reserve_registry.mjs";

test("gold remains excluded from verified reserves until a review is recorded", () => {
  const registry = new GoldReserveRegistry();
  registry.registerBar({
    barId:"bar-001", recordedOn:"2026-10-19", weightGrams:1000, finenessPpm:999900,
    titleHolder:"Example entity", custodian:"Example vault", evidenceReference:"deed:001"
  });
  assert.equal(registry.summary().totalRecordedFineGrams,999);
  assert.equal(registry.summary().verifiedFineGrams,0);
  registry.recordReview({
    barId:"bar-001", reviewedOn:"2026-10-19", reviewerOrganization:"Independent auditor (claim)",
    reviewReference:"audit:001", outcome:"verified"
  });
  assert.equal(registry.summary().verifiedFineGrams,999);
});

test("registry is append-only, rejects duplicate bars, and detects tampering", () => {
  const registry = new GoldReserveRegistry();
  const input = {
    barId:"bar-001", recordedOn:"2026-10-19", weightGrams:1000, finenessPpm:999900,
    titleHolder:"Example entity", custodian:"Example vault", evidenceReference:"deed:001"
  };
  registry.registerBar(input);
  assert.throws(()=>registry.registerBar(input),/bar_id_exists/);
  const altered = registry.listEvents();
  altered[0].weightGrams += 1;
  assert.throws(()=>new GoldReserveRegistry({events:altered}),/invalid_reserve_chain/);
});

