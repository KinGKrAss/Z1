import { randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const storePath = path.resolve(process.env.Z1_WINDPARK_DATA_FILE || path.join(process.cwd(), "data", "windpark-accounting.json"));
const entryKinds = new Set(["income", "expense", "production"]);
const evidenceStatuses = new Set(["documented", "reported"]);
const costClasses = new Set(["operating", "interest", "principal", "tax", "investment", "reserve", "other"]);
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/;
let writes = Promise.resolve();

function emptyStore() { return { schemaVersion: 1, parks: [], entries: [] }; }

async function readStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(storePath, "utf8"));
    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.parks) || !Array.isArray(parsed.entries)) {
      throw new Error("invalid_store_shape");
    }
    return parsed;
  } catch (error) {
    if (error?.code === "ENOENT") return emptyStore();
    throw Object.assign(new Error("windpark_store_unreadable"), { cause: error });
  }
}

async function changeStore(change) {
  const operation = writes.then(async () => {
    const store = await readStore();
    const result = change(store);
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporaryPath, storePath);
    return result;
  });
  writes = operation.catch(() => {});
  return operation;
}

function tokenMatches(header, expected) {
  if (!expected || typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7), "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function validText(value, max = 300) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function validMonth(value) { return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
function monthForDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value.slice(0, 7);
}

function addPark(store, body) {
  if (!validText(body.name, 120) || !validText(body.location, 240)) throw new Error("park_name_and_location_required");
  const park = {
    id: randomUUID(),
    name: body.name.trim(),
    location: body.location.trim(),
    operator: validText(body.operator, 160) ? body.operator.trim() : null,
    legalEntity: validText(body.legalEntity, 160) ? body.legalEntity.trim() : null,
    maStRId: validText(body.maStRId, 100) ? body.maStRId.trim() : null,
    ownershipStatus: "user_reported_unverified",
    ownershipReference: validText(body.ownershipReference, 500) ? body.ownershipReference.trim() : null,
    createdAt: new Date().toISOString()
  };
  store.parks.push(park);
  return park;
}

function addEntry(store, body) {
  const park = store.parks.find(item => item.id === body.parkId);
  if (!park) throw new Error("park_not_found");
  const month = monthForDate(body.date);
  if (!month || !validMonth(body.month) || month !== body.month) throw new Error("valid_date_and_matching_month_required");
  if (!entryKinds.has(body.kind) || !evidenceStatuses.has(body.evidenceStatus)) throw new Error("invalid_kind_or_evidence_status");
  if (!validText(body.category, 100) || !validText(body.description, 300) || !validText(body.sourceReference, 500)) {
    throw new Error("category_description_and_source_reference_required");
  }
  const entry = {
    id: randomUUID(),
    parkId: park.id,
    month,
    date: body.date,
    kind: body.kind,
    category: body.category.trim(),
    costClass: body.kind === "expense" ? body.costClass : null,
    description: body.description.trim(),
    sourceReference: body.sourceReference.trim(),
    evidenceStatus: body.evidenceStatus,
    amountMinor: null,
    energyKwh: null,
    createdAt: new Date().toISOString()
  };
  if (body.kind === "expense" && !costClasses.has(body.costClass)) throw new Error("valid_cost_class_required");
  if (body.kind === "production") {
    if (!Number.isSafeInteger(body.energyKwh) || body.energyKwh <= 0) throw new Error("positive_energy_kwh_required");
    entry.energyKwh = body.energyKwh;
  } else {
    if (!Number.isSafeInteger(body.amountMinor) || body.amountMinor <= 0) throw new Error("positive_amount_minor_required");
    entry.amountMinor = body.amountMinor;
  }
  store.entries.push(entry);
  return entry;
}

function summarize(store, month) {
  const entries = store.entries.filter(entry => entry.month === month);
  const parkSummaries = store.parks.map(park => {
    const rows = entries.filter(entry => entry.parkId === park.id);
    const sum = (kind, status, field) => rows
      .filter(row => row.kind === kind && row.evidenceStatus === status)
      .reduce((total, row) => total + (row[field] ?? 0), 0);
    const actualIncomeMinor = sum("income", "documented", "amountMinor");
    const actualExpensesMinor = sum("expense", "documented", "amountMinor");
    const reportedIncomeMinor = sum("income", "reported", "amountMinor");
    const reportedExpensesMinor = sum("expense", "reported", "amountMinor");
    const documentedOperatingExpensesMinor = rows.filter(row => row.kind === "expense" && row.costClass === "operating" && row.evidenceStatus === "documented").reduce((total, row) => total + row.amountMinor, 0);
    const reportedOperatingExpensesMinor = rows.filter(row => row.kind === "expense" && row.costClass === "operating" && row.evidenceStatus === "reported").reduce((total, row) => total + row.amountMinor, 0);
    return {
      park,
      recorded: rows.length > 0,
      documentedProductionKwh: sum("production", "documented", "energyKwh"),
      reportedProductionKwh: sum("production", "reported", "energyKwh"),
      documentedIncomeMinor: actualIncomeMinor,
      documentedExpenseMinor: actualExpensesMinor,
      documentedOperatingExpensesMinor,
      documentedOperatingResultMinor: actualIncomeMinor - documentedOperatingExpensesMinor,
      documentedNetCashflowMinor: actualIncomeMinor - actualExpensesMinor,
      reportedIncomeMinor,
      reportedExpenseMinor: reportedExpensesMinor,
      reportedOperatingExpensesMinor,
      reportedOperatingResultMinor: reportedIncomeMinor - reportedOperatingExpensesMinor,
      reportedNetCashflowMinor: reportedIncomeMinor - reportedExpensesMinor,
      missingEntryCount: rows.length
    };
  });
  const total = field => parkSummaries.reduce((sum, item) => sum + item[field], 0);
  return {
    month,
    currency: "EUR",
    basis: "Erfasste Buchungen; keine Hochrechnung",
    parks: parkSummaries,
    totals: {
      parkCount: store.parks.length,
      parksWithEntries: parkSummaries.filter(item => item.recorded).length,
      documentedProductionKwh: total("documentedProductionKwh"),
      reportedProductionKwh: total("reportedProductionKwh"),
      documentedIncomeMinor: total("documentedIncomeMinor"),
      documentedExpenseMinor: total("documentedExpenseMinor"),
      documentedOperatingExpensesMinor: total("documentedOperatingExpensesMinor"),
      documentedOperatingResultMinor: total("documentedOperatingResultMinor"),
      documentedNetCashflowMinor: total("documentedNetCashflowMinor"),
      reportedIncomeMinor: total("reportedIncomeMinor"),
      reportedExpenseMinor: total("reportedExpenseMinor"),
      reportedOperatingExpensesMinor: total("reportedOperatingExpensesMinor"),
      reportedOperatingResultMinor: total("reportedOperatingResultMinor"),
      reportedNetCashflowMinor: total("reportedNetCashflowMinor")
    }
  };
}

export async function handleWindparkAccountingApi(req, res, url, { json, readJson }) {
  if (!url.pathname.startsWith("/api/z1/windparks")) return false;
  const token = process.env.Z1_WINDPARK_API_TOKEN;
  if (!token) { json(res, 503, { error: "windpark_api_not_configured", message: "Z1_WINDPARK_API_TOKEN is not configured." }); return true; }
  if (!tokenMatches(req.headers.authorization, token)) { json(res, 401, { error: "unauthorized" }); return true; }

  try {
    if (req.method === "GET" && url.pathname === "/api/z1/windparks") {
      const month = url.searchParams.get("month");
      if (!validMonth(month)) return json(res, 400, { error: "month_must_be_yyyy_mm" }), true;
      const store = await readStore();
      return json(res, 200, summarize(store, month)), true;
    }
    if (req.method === "POST" && url.pathname === "/api/z1/windparks/parks") {
      const body = await readJson(req);
      const park = await changeStore(store => addPark(store, body));
      return json(res, 201, { park }), true;
    }
    if (req.method === "POST" && url.pathname === "/api/z1/windparks/entries") {
      const body = await readJson(req);
      const entry = await changeStore(store => addEntry(store, body));
      return json(res, 201, { entry }), true;
    }
    return json(res, 404, { error: "not_found" }), true;
  } catch (error) {
    const message = String(error?.message ?? error);
    const status = message === "park_not_found" ? 404 : message === "windpark_store_unreadable" ? 500 : 400;
    return json(res, status, { error: status === 500 ? message : "invalid_request", message: status === 500 ? "The ledger could not be read. No data was changed." : message }), true;
  }
}
