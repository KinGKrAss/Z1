-- Z1 Memory Core: provenance, versioning and conversation transport.
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS memory_key TEXT;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 5;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_current_key
    ON memory_entries(memory_key)
    WHERE is_current = TRUE AND memory_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memory_category_priority
    ON memory_entries(category, priority DESC);

CREATE TABLE IF NOT EXISTS memory_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    memory_type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0,
    priority INTEGER NOT NULL DEFAULT 5,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(memory_key, version)
);

CREATE INDEX IF NOT EXISTS idx_memory_versions_key ON memory_versions(memory_key, version DESC);

CREATE TABLE IF NOT EXISTS memory_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_external_id TEXT UNIQUE NOT NULL,
    title TEXT,
    source TEXT NOT NULL DEFAULT 'import',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES memory_conversations(id) ON DELETE CASCADE,
    external_message_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    message_timestamp TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE(conversation_id, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_messages_conversation ON memory_messages(conversation_id, message_timestamp);
CREATE INDEX IF NOT EXISTS idx_memory_messages_fts_data ON memory_messages USING gin (to_tsvector('simple', content));

ALTER TABLE source_references ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES memory_conversations(id) ON DELETE SET NULL;
ALTER TABLE source_references ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES memory_messages(id) ON DELETE SET NULL;
ALTER TABLE source_references ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0;
ALTER TABLE source_references ADD COLUMN IF NOT EXISTS provenance_type TEXT NOT NULL DEFAULT 'source';

CREATE INDEX IF NOT EXISTS idx_source_memory ON source_references(memory_id);
CREATE INDEX IF NOT EXISTS idx_source_conversation ON source_references(conversation_id);
CREATE INDEX IF NOT EXISTS idx_source_message ON source_references(message_id);
