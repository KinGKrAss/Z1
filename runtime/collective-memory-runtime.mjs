import { mkdir, readFile, rename, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const MAX_ITEMS = 10000;
const MAX_CONTENT = 8000;
const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase("de-DE");
const tokens = value => new Set(normalize(value).match(/[\p{L}\p{N}]{3,}/gu) || []);
const hash = value => createHash("sha256").update(value).digest("hex");

async function atomicWrite(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(value, null, 2), { encoding:"utf8", mode:0o600 });
  await chmod(tempPath, 0o600);
  await rename(tempPath, filePath);
}

/** Private, user-isolated shared knowledge for explicitly delegated Z1 role tasks. */
export class CollectiveMemoryStore {
  constructor({ filePath = process.env.Z1_COLLECTIVE_MEMORY_PATH || path.resolve("data/z1_collective_memory.json"), audit = async () => {} } = {}) {
    this.filePath = path.resolve(filePath);
    this.audit = audit;
    this.state = { version:1, items:[] };
    this.writeChain = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive:true, mode:0o700 });
    try {
      const stored = JSON.parse(await readFile(this.filePath, "utf8"));
      if (stored?.version !== 1 || !Array.isArray(stored.items)) throw new Error("invalid_memory_store");
      this.state = stored;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return this;
  }

  persist() {
    this.writeChain = this.writeChain.then(() => atomicWrite(this.filePath, this.state));
    return this.writeChain;
  }

  async add({ ownerId, title, content, sourceReference }) {
    if (typeof ownerId !== "string" || !ownerId.trim() || ownerId.length > 128) throw new Error("owner_required");
    if (typeof title !== "string" || title.trim().length < 3 || title.length > 160) throw new Error("invalid_title");
    if (typeof content !== "string" || !content.trim() || content.length > MAX_CONTENT) throw new Error("invalid_content");
    if (typeof sourceReference !== "string" || !sourceReference.trim() || sourceReference.length > 500) throw new Error("source_reference_required");
    const normalized = { title:title.trim(), content:content.trim(), sourceReference:sourceReference.trim() };
    const contentHash = hash(JSON.stringify(normalized));
    const duplicate = this.state.items.find(item => item.ownerId === ownerId && item.contentHash === contentHash);
    if (duplicate) return this.publicItem(duplicate);
    if (this.state.items.length >= MAX_ITEMS) throw new Error("memory_store_full");
    const item = {
      id:randomUUID(), ownerId, ...normalized, contentHash,
      createdAt:new Date().toISOString(), provenance:"user_provided", shared:true
    };
    await this.audit({ event:"z1_collective_memory_added", owner_id:ownerId, memory_id:item.id, content_sha256:contentHash });
    this.state.items.push(item);
    await this.persist();
    return this.publicItem(item);
  }

  publicItem(item) {
    const { ownerId, ...safe } = item;
    return safe;
  }

  list(ownerId) {
    return this.state.items.filter(item => item.ownerId === ownerId).map(item => this.publicItem(item));
  }

  search({ ownerId, query, limit = 5 }) {
    if (typeof ownerId !== "string" || !ownerId.trim()) throw new Error("owner_required");
    if (typeof query !== "string" || query.trim().length < 2 || query.length > 1000) throw new Error("invalid_query");
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("invalid_limit");
    const queryTokens = tokens(query);
    if (!queryTokens.size) return [];
    return this.state.items
      .filter(item => item.ownerId === ownerId && item.shared === true)
      .map(item => {
        const itemTokens = tokens(`${item.title} ${item.content}`);
        const matched = [...queryTokens].filter(token => itemTokens.has(token));
        return { item, score:matched.length / queryTokens.size, matched };
      })
      .filter(result => result.score > 0)
      .sort((a,b) => b.score-a.score || b.item.createdAt.localeCompare(a.item.createdAt))
      .slice(0,limit)
      .map(({item,score,matched}) => ({...this.publicItem(item), score, matchedTerms:matched}));
  }
}
