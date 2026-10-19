import test from "node:test";
import assert from "node:assert/strict";
import { EquityLedger } from "../core/equity_ledger.mjs";

const capitalEntry = {
  id:"capital-1", date:"2026-10-19", currency:"EUR", description:"Record documented contributed capital",
  evidenceReference:"document:capital-proof-1",
  lines:[
    {accountId:"asset_bank",side:"debit",amountMinor:125000},
    {accountId:"equity_contributed",side:"credit",amountMinor:125000}
  ]
};

test("posts balanced entries and computes currency-specific trial balance in minor units", () => {
  const ledger = new EquityLedger();
  ledger.post(capitalEntry);
  const trial = ledger.trialBalance({currency:"EUR"});
  assert.equal(trial.balanced,true);
  assert.equal(trial.debitMinor,125000);
  assert.equal(trial.creditMinor,125000);
  assert.equal(trial.rows.find(row=>row.id==="equity_contributed").balanceMinor,125000);
  assert.equal(ledger.verifyChain().valid,true);
  assert.equal(ledger.trialBalance({currency:"USD"}).debitMinor,0);
});

test("rejects unbalanced, invalid and unsupported payment-like entries", () => {
  const ledger = new EquityLedger();
  assert.throws(()=>ledger.post({...capitalEntry,lines:[capitalEntry.lines[0],{...capitalEntry.lines[1],amountMinor:124999}]}),/unbalanced_entry/);
  assert.throws(()=>ledger.post({...capitalEntry,evidenceReference:""}),/evidence_reference_required/);
  assert.throws(()=>ledger.post({...capitalEntry,currency:"EUR/USD"}),/invalid_currency/);
  assert.throws(()=>ledger.post({...capitalEntry,lines:[{accountId:"external_transfer",side:"debit",amountMinor:1},{accountId:"equity_contributed",side:"credit",amountMinor:1}]}),/unknown_account/);
  assert.equal(ledger.list().length,0);
});

test("is idempotent for the same entry and rejects edits using an existing id", () => {
  const ledger = new EquityLedger();
  const first = ledger.post(capitalEntry);
  assert.deepEqual(ledger.post(capitalEntry),first);
  assert.equal(ledger.list().length,1);
  assert.throws(()=>ledger.post({...capitalEntry,description:"Changed record"}),/entry_id_conflict/);
});

test("detects tampering in the append-only hash chain", () => {
  const ledger = new EquityLedger();
  ledger.post(capitalEntry);
  const records = ledger.list();
  records[0].description = "tampered";
  assert.throws(()=>new EquityLedger({entries:records}),/invalid_ledger_chain/);
});
