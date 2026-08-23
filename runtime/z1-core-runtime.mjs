/**
 * Z1 Node.js runtime launcher.
 * Node owns the service/runtime layer; the canonical Z1 Core remains Python.
 */
import { spawn } from "node:child_process";

const child = spawn("python", ["-m", "modules.bootstrap"], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("[Z1] Core launcher failed:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
