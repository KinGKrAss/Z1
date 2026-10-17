from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class GoddessFrame:
    """Frame/Status einer Göttin für Dashboard und Z1-WebSocket."""

    id: str
    name: str
    domain: str
    status: str = "active"
    telemetry: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "domain": self.domain,
            "status": self.status,
            "telemetry": self.telemetry,
        }


class BaseGoddessAgent:
    """Basisklasse für alle 33 Göttinnen-Agentinnen."""

    def __init__(self, goddess_id: str, name: str, domain: str):
        self.goddess_id = goddess_id
        self.name = name
        self.domain = domain
        self.status = "ready"
        self.active_tasks: List[str] = []

    async def initialize(self) -> None:
        self.status = "active"

    async def execute_task(self, task_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Jede Göttin muss ihre eigene execute_task-Methode definieren.")

    def get_state(self) -> GoddessFrame:
        return GoddessFrame(
            id=self.goddess_id,
            name=self.name,
            domain=self.domain,
            status=self.status,
            telemetry={"active_tasks_count": len(self.active_tasks)},
        )
