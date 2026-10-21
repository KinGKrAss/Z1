const ORBS_HOST = "https://ton.access.orbs.network";
const STALE_AFTER_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

function isTonAddress(value) {
  if (typeof value !== "string") return false;
  const address = value.trim();
  return /^0:[0-9a-fA-F]{64}$/.test(address) || /^[A-Za-z0-9_-]{48}$/.test(address);
}

async function fetchJson(fetchImpl, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Orbs TON Access returned HTTP " + response.status);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverOrbsTonNodes({ fetchImpl = fetch, network = "mainnet", now = Date.now() } = {}) {
  if (network !== "mainnet" && network !== "testnet") {
    throw new Error("ORBS_TON_NETWORK must be mainnet or testnet");
  }
  let nodes;
  try {
    nodes = await fetchJson(fetchImpl, ORBS_HOST + "/mngr/nodes?npm_version=2.3.0");
  } catch {
    nodes = await fetchJson(fetchImpl, ORBS_HOST + "/edge/mngr/nodes");
  }
  if (!Array.isArray(nodes)) throw new Error("Orbs TON Access returned an invalid node list");

  const protocolNetwork = (network === "mainnet" ? "v2-" : "v2-") + network;
  return nodes.filter((node) => {
    const successAt = Number(node?.Mngr?.successTS);
    return node?.Healthy === "1"
      && Number(node?.Weight) > 0
      && node?.Mngr?.health?.[protocolNetwork] === true
      && Number.isFinite(successAt)
      && now - successAt <= STALE_AFTER_MS;
  });
}

function chooseWeightedNode(nodes, random = Math.random) {
  const totalWeight = nodes.reduce((sum, node) => sum + Number(node.Weight), 0);
  if (!totalWeight) throw new Error("No healthy Orbs TON Access node is available");
  let target = Math.floor(random() * totalWeight);
  for (const node of nodes) {
    target -= Number(node.Weight);
    if (target < 0) return node;
  }
  return nodes.at(-1);
}

export async function readTonBalance(address, options = {}) {
  if (!isTonAddress(address)) throw new Error("Provide a valid raw or user-friendly TON address");
  const fetchImpl = options.fetchImpl ?? fetch;
  const network = options.network ?? "mainnet";
  const nodes = await discoverOrbsTonNodes({ fetchImpl, network, now: options.now });
  const node = chooseWeightedNode(nodes, options.random);
  const url = ORBS_HOST + "/" + encodeURIComponent(node.NodeId) + "/1/" + network
    + "/toncenter-api-v2/getAddressBalance?address=" + encodeURIComponent(address.trim());
  const payload = await fetchJson(fetchImpl, url);
  if (payload?.ok === false || payload?.result === undefined) {
    throw new Error("TON provider did not return a balance");
  }
  const nanoTon = BigInt(payload.result).toString();
  const negative = nanoTon.startsWith("-");
  const digits = negative ? nanoTon.slice(1) : nanoTon;
  const whole = digits.length > 9 ? digits.slice(0, -9) : "0";
  const fraction = (digits.length > 9 ? digits.slice(-9) : digits.padStart(10, "0").slice(-9)).replace(/0+$/, "");
  return {
    asset: "TON",
    network,
    address: address.trim(),
    balanceNanoTon: nanoTon,
    balanceTon: (negative ? "-" : "") + whole + (fraction ? "." + fraction : ""),
    provider: "Orbs TON Access",
    checkedAt: new Date(options.now ?? Date.now()).toISOString(),
  };
}

