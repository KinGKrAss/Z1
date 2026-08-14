"""System Z1 Core - provider-agnostic orchestration kernel.

The core owns lifecycle, module registration, events, configuration, health
checks and audit records. Domain logic belongs in GAIA, FORTUNA, ELECTRA,
DIPLOMATIE and ZOE adapters rather than in this module.

Python 3.11+; standard library only.
"""

from __future__ import annotations

import asyncio
import inspect
import json
import os
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Mapping, Protocol


CORE_VERSION = "1.0.0"


class Z1Module(Protocol):
    """Minimal contract implemented by every Z1 domain module."""

    name: str
    version: str

    async def health(self) -> "ModuleHealth": ...


@dataclass(frozen=True, slots=True)
class Z1Config:
    """Runtime configuration loaded from environment variables."""

    environment: str = "development"
    instance_id: str = ""
    audit_path: str = "data/z1_audit.jsonl"
    event_history_limit: int = 1000
    health_timeout_seconds: float = 3.0
    openai_api_key_present: bool = False
    openai_model: str = "gpt-5.6"

    @classmethod
    def from_env(cls) -> "Z1Config":
        return cls(
            environment=os.getenv("Z1_ENV", "development"),
            instance_id=os.getenv("Z1_INSTANCE_ID", str(uuid.uuid4())),
            audit_path=os.getenv("Z1_AUDIT_PATH", "data/z1_audit.jsonl"),
            event_history_limit=max(1, int(os.getenv("Z1_EVENT_HISTORY_LIMIT", "1000"))),
            health_timeout_seconds=max(0.1, float(os.getenv("Z1_HEALTH_TIMEOUT", "3"))),
            # Never expose the key; only record whether one is configured.
            openai_api_key_present=bool(os.getenv("OPENAI_API_KEY")),
            openai_model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
        )


@dataclass(frozen=True, slots=True)
class Event:
    """Immutable event emitted through the Z1 event bus."""

    type: str
    source: str
    payload: Mapping[str, Any] = field(default_factory=dict)
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass(frozen=True, slots=True)
class ModuleHealth:
    """Normalized health result for a registered module."""

    name: str
    status: str
    version: str = "unknown"
    latency_ms: float | None = None
    detail: str | None = None

    @property
    def healthy(self) -> bool:
        return self.status == "online"


Handler = Callable[[Event], Awaitable[None] | None]


class EventBus:
    """Small async event bus with bounded in-memory history."""

    def __init__(self, history_limit: int = 1000) -> None:
        self._handlers: dict[str, list[Handler]] = {}
        self._history: list[Event] = []
        self._history_limit = max(1, history_limit)

    def subscribe(self, event_type: str, handler: Handler) -> None:
        if not event_type:
            raise ValueError("event_type is required")
        self._handlers.setdefault(event_type, []).append(handler)

    def history(self) -> tuple[Event, ...]:
        return tuple(self._history)

    async def publish(self, event: Event) -> None:
        self._history.append(event)
        if len(self._history) > self._history_limit:
            del self._history[: len(self._history) - self._history_limit]

        handlers = [*self._handlers.get("*", []), *self._handlers.get(event.type, [])]
        for handler in handlers:
            result = handler(event)
            if inspect.isawaitable(result):
                await result


class ModuleRegistry:
    """Registry and lifecycle boundary for Z1 modules."""

    def __init__(self) -> None:
        self._modules: dict[str, Z1Module] = {}

    def register(self, module: Z1Module) -> None:
        name = str(getattr(module, "name", "")).strip().lower()
        if not name:
            raise ValueError("Z1 modules require a non-empty name")
        if name in self._modules:
            raise ValueError(f"Module already registered: {name}")
        self._modules[name] = module

    def get(self, name: str) -> Z1Module:
        try:
            return self._modules[name.strip().lower()]
        except KeyError as exc:
            raise KeyError(f"Unknown Z1 module: {name}") from exc

    def names(self) -> tuple[str, ...]:
        return tuple(sorted(self._modules))

    def values(self) -> tuple[Z1Module, ...]:
        return tuple(self._modules.values())


class AuditLog:
    """Append-only JSONL audit sink with no secret material."""

    def __init__(self, path: str) -> None:
        self.path = Path(path)

    def write(self, action: str, actor: str, data: Mapping[str, Any] | None = None) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "actor": actor,
            "data": dict(data or {}),
        }
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")


class SystemZ1Core:
    """Central runtime for System Z1."""

    name = "Z1 Core"
    version = CORE_VERSION

    def __init__(self, config: Z1Config | None = None) -> None:
        self.config = config or Z1Config.from_env()
        self.registry = ModuleRegistry()
        self.events = EventBus(self.config.event_history_limit)
        self.audit = AuditLog(self.config.audit_path)
        self.started_at: float | None = None
        self._started = False

    async def start(self) -> None:
        if self._started:
            return
        self.started_at = time.monotonic()
        self._started = True
        self.audit.write("core.started", "system", {"version": self.version})
        await self.events.publish(Event("core.started", self.name, {"version": self.version}))

    async def stop(self) -> None:
        if not self._started:
            return
        self._started = False
        self.audit.write("core.stopped", "system", {"version": self.version})
        await self.events.publish(Event("core.stopped", self.name, {"version": self.version}))

    def register_module(self, module: Z1Module) -> None:
        self.registry.register(module)
        self.audit.write(
            "module.registered",
            "system",
            {"name": module.name, "version": getattr(module, "version", "unknown")},
        )

    async def health(self) -> dict[str, Any]:
        """Run module health checks without allowing one module to block Z1."""
        results: list[ModuleHealth] = []
        for module in self.registry.values():
            started = time.perf_counter()
            try:
                result = await asyncio.wait_for(
                    module.health(), timeout=self.config.health_timeout_seconds
                )
                latency = (time.perf_counter() - started) * 1000
                results.append(
                    ModuleHealth(
                        name=result.name,
                        status=result.status,
                        version=result.version,
                        latency_ms=round(latency, 2),
                        detail=result.detail,
                    )
                )
            except asyncio.TimeoutError:
                results.append(
                    ModuleHealth(
                        module.name,
                        "degraded",
                        getattr(module, "version", "unknown"),
                        round((time.perf_counter() - started) * 1000, 2),
                        "health check timeout",
                    )
                )
            except Exception as exc:  # noqa: BLE001 - health must be failure-isolated
                results.append(
                    ModuleHealth(
                        module.name,
                        "offline",
                        getattr(module, "version", "unknown"),
                        round((time.perf_counter() - started) * 1000, 2),
                        str(exc),
                    )
                )

        online = sum(item.healthy for item in results)
        status = "online" if online == len(results) else "degraded"
        if not results:
            status = "online"
        return {
            "system": self.name,
            "version": self.version,
            "status": status,
            "environment": self.config.environment,
            "instance_id": self.config.instance_id,
            "uptime_seconds": round(time.monotonic() - self.started_at, 3) if self.started_at else 0,
            "modules": [asdict(item) for item in results],
            "module_count": len(results),
        }

    async def dispatch(self, event_type: str, payload: Mapping[str, Any] | None = None) -> Event:
        """Create and publish a system event."""
        if not self._started:
            raise RuntimeError("Z1 Core is not started")
        event = Event(event_type, self.name, payload or {})
        await self.events.publish(event)
        self.audit.write("event.published", "system", {"type": event.type, "event_id": event.event_id})
        return event

    def status(self) -> dict[str, Any]:
        """Return a non-secret operational snapshot."""
        return {
            "name": self.name,
            "version": self.version,
            "started": self._started,
            "environment": self.config.environment,
            "instance_id": self.config.instance_id,
            "modules": list(self.registry.names()),
            "openai_api_key_configured": self.config.openai_api_key_present,
            "openai_model": self.config.openai_model,
        }


async def main() -> None:
    """Minimal CLI smoke entry point."""
    core = SystemZ1Core()
    await core.start()
    print(json.dumps(core.status(), indent=2, ensure_ascii=False))
    await core.stop()


if __name__ == "__main__":
    asyncio.run(main())
