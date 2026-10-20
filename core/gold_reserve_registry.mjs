import { createHash } from "node:crypto";

const clone = value => JSON.parse(JSON.stringify(value));
const canonical = value => JSON.stringify(value);
const isoDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0,10) === value;

function entryHash(previousHash, body) {
  return createHash("sha256").update(canonical({previousHash,...body})).digest("hex");
}

/**
 * Append-only register of user-claimed gold bars and later evidence reviews.
 * A "verified" status records a human review; the software cannot prove title,
 * custody, authenticity, or auditor independence.
 */
export class GoldReserveRegistry {
  constructor({ events = [] } = {}) {
    this.events = clone(events);
    if (!this.verifyChain().valid) throw new Error("invalid_reserve_chain");
  }

  append(body) {
    if (this.events.length >= 100000) throw new Error("reserve_registry_full");
    const previousHash = this.events.at(-1)?.hash ?? "0".repeat(64);
    const event = {...body, previousHash, hash:entryHash(previousHash,body)};
    this.events.push(event);
    return clone(event);
  }

  registerBar({ barId, recordedOn, weightGrams, finenessPpm, titleHolder, custodian, evidenceReference }) {
    if (typeof barId !== "string" || !/^[A-Za-z0-9._:-]{1,100}$/.test(barId)) throw new Error("invalid_bar_id");
    if (!isoDate(recordedOn)) throw new Error("invalid_date");
    if (!Number.isSafeInteger(weightGrams) || weightGrams < 1) throw new Error("invalid_weight_grams");
    if (!Number.isSafeInteger(finenessPpm) || finenessPpm < 900000 || finenessPpm > 999999) throw new Error("invalid_fineness");
    for (const [key,value] of Object.entries({titleHolder,custodian,evidenceReference})) {
      if (typeof value !== "string" || !value.trim() || value.length > 500) throw new Error(`invalid_${key}`);
    }
    if (this.events.some(e => e.type === "bar_registered" && e.barId === barId)) throw new Error("bar_id_exists");
    return this.append({
      type:"bar_registered", barId, recordedOn, weightGrams, finenessPpm,
      titleHolder:titleHolder.trim(), custodian:custodian.trim(),
      evidenceReference:evidenceReference.trim(), status:"unverified"
    });
  }

  recordReview({ barId, reviewedOn, reviewerOrganization, reviewReference, outcome }) {
    if (!this.events.some(e => e.type === "bar_registered" && e.barId === barId)) throw new Error("bar_not_found");
    if (!isoDate(reviewedOn)) throw new Error("invalid_date");
    for (const [key,value] of Object.entries({reviewerOrganization,reviewReference})) {
      if (typeof value !== "string" || !value.trim() || value.length > 500) throw new Error(`invalid_${key}`);
    }
    if (!["verified","disputed","rejected"].includes(outcome)) throw new Error("invalid_review_outcome");
    return this.append({
      type:"review_recorded", barId, reviewedOn, reviewerOrganization:reviewerOrganization.trim(),
      reviewReference:reviewReference.trim(), outcome
    });
  }

  listBars() {
    const bars = new Map();
    for (const event of this.events) {
      if (event.type === "bar_registered") bars.set(event.barId,{...event,status:"unverified",lastReview:null});
      if (event.type === "review_recorded") {
        const bar = bars.get(event.barId);
        if (bar) { bar.status = event.outcome; bar.lastReview = event.reviewReference; }
      }
    }
    return [...bars.values()].map(({previousHash,hash,...bar}) => bar);
  }

  summary() {
    const bars = this.listBars();
    const totalRecordedFineGrams = bars.reduce((sum,bar) => sum + Math.floor(bar.weightGrams*bar.finenessPpm/1_000_000),0);
    const verifiedFineGrams = bars.filter(bar => bar.status === "verified")
      .reduce((sum,bar) => sum + Math.floor(bar.weightGrams*bar.finenessPpm/1_000_000),0);
    return { bars:bars.length, unverifiedBars:bars.filter(b=>b.status==="unverified").length,
      disputedBars:bars.filter(b=>b.status==="disputed").length,
      rejectedBars:bars.filter(b=>b.status==="rejected").length,
      totalRecordedFineGrams, verifiedFineGrams };
  }

  verifyChain() {
    let previousHash = "0".repeat(64);
    for (const event of this.events) {
      const {hash,previousHash:recordedPrevious,...body} = event;
      if (recordedPrevious !== previousHash || entryHash(previousHash,body) !== hash) return {valid:false};
      previousHash = hash;
    }
    return {valid:true,count:this.events.length,head:previousHash};
  }

  listEvents() { return clone(this.events); }
}

