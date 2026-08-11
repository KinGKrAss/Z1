CREATE TABLE IF NOT EXISTS memory_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT,
    title TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_conversations_external_source
    ON memory_conversations(source, external_id)
    WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS memory_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES memory_conversations(id) ON DELETE CASCADE,
    external_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_memory_messages_conversation_time
    ON memory_messages(conversation_id, occurred_at, id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_messages_external
    ON memory_messages(conversation_id, external_id)
    WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS memory_buffer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES memory_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES memory_messages(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'short_term',
    score NUMERIC(6,5) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    promoted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_memory_buffer_status_score
    ON memory_buffer(status, score DESC, created_at DESC);

ALTER TABLE memory_entries
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE memory_entries
    ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE memory_entries
    ADD COLUMN IF NOT EXISTS supersedes_id UUID REFERENCES memory_entries(id) ON DELETE SET NULL;
ALTER TABLE source_references
    ADD COLUMN IF NOT EXISTS provenance_type TEXT NOT NULL DEFAULT 'original';
ALTER TABLE source_references
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0;

CREATE INDEX IF NOT EXISTS idx_memory_entries_status_updated
    ON memory_entries(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_references_memory
    ON source_references(memory_id);

CREATE OR REPLACE VIEW memory_context_sources AS
SELECT
    m.id AS memory_id,
    m.title,
    m.content,
    m.memory_type,
    m.confidence,
    m.status,
    m.origin,
    s.source_type,
    s.source_id,
    s.source_text,
    s.provenance_type,
    s.confidence AS source_confidence
FROM memory_entries m
LEFT JOIN source_references s ON s.memory_id = m.id;
