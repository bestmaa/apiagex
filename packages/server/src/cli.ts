#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runRuntimeCli } from "./runtime.js";

if (isDirectRun()) {
  const result = await runRuntimeCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && realpathSync(entry) === fileURLToPath(import.meta.url));
}
