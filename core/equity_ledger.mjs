import { createHash } from "node:crypto";

export const EQUITY_ACCOUNTS = Object.freeze([
  Object.freeze({ id:"asset_cash", label:"Cash (internal record)", type:"asset", normalSide:"debit" }),
  Object.freeze({ id:"asset_bank", label:"Bank (internal record)", type:"asset", normalSide:"debit" }),
  Object.freeze({ id:"equity_contributed", label:"Contributed capital", type:"equity", normalSide:"credit" }),
  Object.freeze({ id:"equity_retained", label:"Retained equity", type:"equity", normalSide:"credit" }),
  Object.freeze({ id:"income_operating", label:"Operating income", type:"income", normalSide:"credit" }),
  Object.freeze({ id:"expense_operating", label:"Operating expenses", type:"expense", normalSide:"debit" })
]);

const accounts = new Map(EQUITY_ACCOUNTS.map(account => [account.id, account]));
const clone = value => JSON.parse(JSON.stringify(value));
const isoDate = value => typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0,10) === value;
const canonical = value => JSON.stringify(value);

function hashEntry(previousHash, body) {
  return createHash("sha256").update(canonical({ previousHash, ...body })).digest("hex");
}

/** Internal, append-only double-entry journal. It does not connect to a bank or move money. */
export class EquityLedger {
  constructor({ entries = [] } = {}) {
    this.entries = clone(entries);
    const result = this.verifyChain();
    if (!result.valid) throw new Error("invalid_ledger_chain");
  }

  post({ id, date, currency, description, evidenceReference, lines }) {
    if (typeof id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(id)) throw new Error("invalid_entry_id");
    if (!isoDate(date)) throw new Error("invalid_date");
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) throw new Error("invalid_currency");
    if (typeof description !== "string" || description.trim().length < 3 || description.length > 500) throw new Error("invalid_description");
    if (typeof evidenceReference !== "string" || !evidenceReference.trim() || evidenceReference.length > 500) throw new Error("evidence_reference_required");
    if (!Array.isArray(lines) || lines.length < 2 || lines.length > 50) throw new Error("invalid_lines");

    const normalizedLines = lines.map(line => {
      const account = accounts.get(line?.accountId);
      if (!account) throw new Error("unknown_account");
      if (!Number.isSafeInteger(line.amountMinor) || line.amountMinor <= 0) throw new Error("invalid_amount_minor");
      if (line.side !== "debit" && line.side !== "credit") throw new Error("invalid_side");
      return { accountId:account.id, side:line.side, amountMinor:line.amountMinor };
    });
    const debit = normalizedLines.filter(line => line.side === "debit").reduce((sum,line) => sum + line.amountMinor,0);
    const credit = normalizedLines.filter(line => line.side === "credit").reduce((sum,line) => sum + line.amountMinor,0);
    if (!Number.isSafeInteger(debit) || !Number.isSafeInteger(credit) || debit <= 0 || debit !== credit) throw new Error("unbalanced_entry");

    const body = {
      id, date, currency, description:description.trim(), evidenceReference:evidenceReference.trim(),
      lines:normalizedLines, debitMinor:debit, creditMinor:credit
    };
    const existing = this.entries.find(entry => entry.id === id);
    if (existing) {
      const comparable = ({ previousHash, hash, ...entry }) => entry;
      if (canonical(comparable(existing)) !== canonical(body)) throw new Error("entry_id_conflict");
      return clone(existing);
    }
    const previousHash = this.entries.at(-1)?.hash ?? "0".repeat(64);
    const entry = { ...body, previousHash, hash:hashEntry(previousHash, body) };
    this.entries.push(entry);
    return clone(entry);
  }

  list() { return clone(this.entries); }

  trialBalance({ currency, throughDate = "9999-12-31" } = {}) {
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) throw new Error("invalid_currency");
    if (!isoDate(throughDate)) throw new Error("invalid_date");
    const rows = EQUITY_ACCOUNTS.map(account => ({ ...account, debitMinor:0, creditMinor:0, balanceMinor:0 }));
    const rowById = new Map(rows.map(row => [row.id,row]));
    for (const entry of this.entries) {
      if (entry.currency !== currency || entry.date > throughDate) continue;
      for (const line of entry.lines) {
        const row = rowById.get(line.accountId);
        row[`${line.side}Minor`] += line.amountMinor;
        row.balanceMinor += line.side === row.normalSide ? line.amountMinor : -line.amountMinor;
      }
    }
    const debitMinor = rows.reduce((sum,row) => sum + row.debitMinor,0);
    const creditMinor = rows.reduce((sum,row) => sum + row.creditMinor,0);
    return { currency, throughDate, rows, debitMinor, creditMinor, balanced:debitMinor === creditMinor };
  }

  verifyChain() {
    let previousHash = "0".repeat(64);
    for (const entry of this.entries) {
      const { hash, previousHash:recordedPrevious, ...body } = entry;
      if (recordedPrevious !== previousHash || hashEntry(previousHash, body) !== hash) return { valid:false, entryId:entry.id };
      previousHash = hash;
    }
    return { valid:true, count:this.entries.length, head:previousHash };
  }
}
