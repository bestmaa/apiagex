#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { runRuntimeCli } from "./runtime.js";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runRuntimeCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
