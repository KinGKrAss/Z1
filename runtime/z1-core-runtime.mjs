"""Z1 Node.js runtime launcher.

Node.js owns the service/API runtime. Z1 Core remains the Python system kernel.
"""

import { spawn } from "node:child_process";

const child = spawn("python", ["-m", "core.system_z1_core"], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("[Z1] Python Core failed to start:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.exitCode = 1;
  else process.exitCode = code ?? 1;
});
