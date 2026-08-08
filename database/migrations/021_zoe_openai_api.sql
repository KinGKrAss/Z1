BEGIN;

-- Provider-agnostic task execution metadata for the Zoë API layer.
ALTER TABLE agent_tasks
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS input JSONB,
  ADD COLUMN IF NOT EXISTS output JSONB,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_agent_created
  ON agent_tasks (user_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status
  ON agent_tasks (status);

COMMIT;
