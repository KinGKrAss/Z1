import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from agents.goddess_registry import GoddessRegistry

GODDESSES_FILE = Path(__file__).resolve().parent / "api_endpoints.local.json"


def load_goddesses_data(path: Path = GODDESSES_FILE) -> List[Dict[str, Any]]:
    """Lädt die 33 Göttinnen aus der von server.ts erzeugten JSON-Datei."""
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


class Z1GoddessService:
    def __init__(self):
        self.registry = GoddessRegistry()
        self._is_ready = False

    async def boot(self, data: Optional[List[Dict[str, Any]]] = None) -> None:
        await self.registry.initialize_all(data if data is not None else load_goddesses_data())
        self._is_ready = True

    async def handle_api_status_request(self) -> Dict[str, Any]:
        """Äquivalent zum Endpunkt /api/goddesses/status."""
        if not self._is_ready:
            await self.boot()
        return {
            "system": "Z1",
            "active_goddesses_count": len(self.registry._agents),
            "agents": self.registry.get_all_states(),
        }

    async def handle_dispatch_request(
        self, goddess_id: str, task_type: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self._is_ready:
            await self.boot()
        return await self.registry.dispatch(goddess_id, task_type, payload)


if __name__ == "__main__":
    async def main():
        service = Z1GoddessService()
        await service.boot()
        status = await service.handle_api_status_request()
        print("System-Status:", json.dumps(status, indent=2, ensure_ascii=False))
        res = await service.handle_dispatch_request("nyx", "ANALYZE_SECTOR", {"sector": "Münsterland"})
        print("Task-Ergebnis:", res)

    asyncio.run(main())
