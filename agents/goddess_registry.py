import asyncio
from typing import Any, Dict, List, Optional

from .goddess_base import BaseGoddessAgent


class SpecificGoddessAgent(BaseGoddessAgent):
    """Generische Implementierung für alle konfigurierten Göttinnen."""

    async def execute_task(self, task_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.active_tasks.append(task_type)
        try:
            await asyncio.sleep(0.01)
        finally:
            self.active_tasks.remove(task_type)
        return {
            "agent_id": self.goddess_id,
            "agent_name": self.name,
            "domain": self.domain,
            "task": task_type,
            "result": "success",
            "payload_echo": payload,
        }


class GoddessRegistry:
    """Zentrale Verwaltung aller Göttinnen-Agentinnen im System Z1."""

    def __init__(self):
        self._agents: Dict[str, BaseGoddessAgent] = {}

    def register_agent(self, goddess_id: str, name: str, domain: str) -> BaseGoddessAgent:
        agent = SpecificGoddessAgent(goddess_id=goddess_id, name=name, domain=domain)
        self._agents[goddess_id] = agent
        return agent

    async def initialize_all(self, goddesses_data: List[Dict[str, Any]]) -> None:
        for item in goddesses_data:
            gid = item.get("id") or item.get("name", "").lower()
            name = item.get("name", "Goddess")
            domain = item.get("domain", "General")
            agent = self.register_agent(goddess_id=gid, name=name, domain=domain)
            await agent.initialize()

    def get_agent(self, goddess_id: str) -> Optional[BaseGoddessAgent]:
        return self._agents.get(goddess_id)

    def get_all_states(self) -> List[Dict[str, Any]]:
        return [agent.get_state().to_dict() for agent in self._agents.values()]

    async def dispatch(self, goddess_id: str, task_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        agent = self.get_agent(goddess_id)
        if not agent:
            raise ValueError(f"Göttin mit ID '{goddess_id}' ist im System Z1 nicht registriert.")
        return await agent.execute_task(task_type, payload)
