from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

app = FastAPI(title="Z1 OpenAI API", version="1.0.0")

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
pool: asyncpg.Pool | None = None

AGENTS: dict[str, dict[str, Any]] = {
    "zoe": {"domain": "orchestration", "instructions": "You are Zoë, the central Z1 coordinator. Delegate specialist work when appropriate and return concise, auditable decisions."},
    "midas": {"domain": "finance", "instructions": "You are Midas, the Z1 finance specialist. Analyze financial data conservatively and distinguish facts from assumptions."},
    "electra": {"domain": "energy", "instructions": "You are Electra, the Z1 energy specialist. Analyze energy assets, production, consumption and financial effects."},
    "themis": {"domain": "legal", "instructions": "You are Themis, the Z1 legal-analysis specialist. Provide structured legal information and clearly flag uncertainty; do not claim to be a lawyer."},
    "hestia": {"domain": "infrastructure", "instructions": "You are Hestia, the Z1 infrastructure specialist. Focus on systems, properties, operations and technical dependencies."},
    "sophia": {"domain": "knowledge", "instructions": "You are Sophia, the Z1 knowledge and research specialist. Separate sourced facts, inference and unknowns."},
    "mnemosyne": {"domain": "memory", "instructions": "You are Mnemosyne, the Z1 memory specialist. Retrieve and organize durable context without inventing memories."},
    "pallas": {"domain": "analysis", "instructions": "You are Pallas, the Z1 analytical specialist. Decompose problems, test assumptions and surface contradictions."},
    "fortuna": {"domain": "market", "instructions": "You are Fortuna, the Z1 market-analysis specialist. Focus on scenarios, probabilities and decision-relevant market information."},
    "iris": {"domain": "communication", "instructions": "You are Iris, the Z1 communications specialist. Produce clear, precise and audience-appropriate communication."},
    "astraea": {"domain": "governance", "instructions": "You are Astraea, the Z1 governance specialist. Check consistency, permissions, risk and system-wide balance."},
}

class ChatRequest(BaseModel):
    user_id: uuid.UUID
    message: str = Field(min_length=1, max_length=20000)
    agent: str | None = None
    conversation_id: uuid.UUID | None = None

class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    agent: str
    response: str
    model: str


def route_agent(message: str, requested: str | None) -> str:
    if requested:
        if requested not in AGENTS:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {requested}")
        return requested
    text = message.lower()
    rules = [
        ("midas", ("finanz", "geld", "cashflow", "aktie", "portfolio", "bewertung", "umsatz")),
        ("electra", ("energie", "strom", "wind", "solar", "turbine", "twh")),
        ("themis", ("recht", "vertrag", "gesetz", "haftung", "juristisch")),
        ("hestia", ("immobil", "bau", "infrastruktur", "gebäude", "wohnung")),
        ("sophia", ("recherche", "wissen", "erkläre", "analysequelle")),
        ("mnemosyne", ("erinner", "gedächtnis", "memory", "gespeichert")),
        ("fortuna", ("markt", "wirtschaft", "kurs", "wettbewerb")),
        ("iris", ("schreib", "formuliere", "nachricht", "brief", "kommunikation")),
        ("pallas", ("analysiere", "vergleich", "risiko", "problem", "strategie")),
        ("astraea", ("governance", "berechtigung", "zugriff", "audit", "richtlinie")),
    ]
    for agent, keywords in rules:
        if any(k in text for k in keywords):
            return agent
    return "zoe"

async def get_db() -> asyncpg.Pool:
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return pool

@app.on_event("startup")
async def startup() -> None:
    await get_db()

@app.on_event("shutdown")
async def shutdown() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None

@app.get("/health")
async def health() -> dict[str, str]:
    db = await get_db()
    await db.fetchval("SELECT 1")
    return {"status": "ok", "database": "ok", "service": "z1-openai-api"}

@app.get("/v1/agents")
async def agents() -> dict[str, Any]:
    return {"agents": [{"id": k, **v} for k, v in AGENTS.items()]}

@app.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    agent_id = route_agent(req.message, req.agent)
    agent = AGENTS[agent_id]
    conversation_id = req.conversation_id or uuid.uuid4()
    db = await get_db()

    # Persist the task before calling the model so every request is auditable.
    task_id = await db.fetchval(
        """INSERT INTO agent_tasks (id, user_id, agent_id, status, input, created_at)
           VALUES ($1, $2, $3, 'running', $4::jsonb, $5) RETURNING id""",
        uuid.uuid4(), req.user_id, agent_id, {"message": req.message, "conversation_id": str(conversation_id)}, datetime.now(timezone.utc)
    )

    try:
        response = await openai_client.responses.create(
            model=OPENAI_MODEL,
            instructions=(
                "You are part of the Z1 AI platform. Follow the Z1 architecture, never invent database facts, "
                "and distinguish retrieved data from reasoning. Specialist role: " + agent["instructions"]
            ),
            input=req.message,
        )
        text = response.output_text
        await db.execute(
            "UPDATE agent_tasks SET status='completed', output=$2::jsonb, completed_at=$3 WHERE id=$1",
            task_id, {"response": text, "model": OPENAI_MODEL}, datetime.now(timezone.utc)
        )
        return ChatResponse(conversation_id=conversation_id, agent=agent_id, response=text, model=OPENAI_MODEL)
    except Exception as exc:
        await db.execute(
            "UPDATE agent_tasks SET status='failed', output=$2::jsonb, completed_at=$3 WHERE id=$1",
            task_id, {"error": str(exc)}, datetime.now(timezone.utc)
        )
        raise HTTPException(status_code=502, detail="LLM request failed") from exc
