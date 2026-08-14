"""Bootstrap the canonical Z1 Core with all first-party domain adapters."""

from __future__ import annotations

import asyncio
import json

from core.system_z1_core import SystemZ1Core, Z1Config
from modules.z1_modules import default_modules


def build_core(config: Z1Config | None = None) -> SystemZ1Core:
    core = SystemZ1Core(config)
    for module in default_modules():
        core.register_module(module)
    return core


async def main() -> None:
    core = build_core()
    await core.start()
    try:
        print(json.dumps({"status": core.status(), "health": await core.health()}, ensure_ascii=False))
    finally:
        await core.stop()


if __name__ == "__main__":
    asyncio.run(main())
