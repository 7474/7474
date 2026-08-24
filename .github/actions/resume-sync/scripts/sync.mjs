#!/usr/bin/env node
// Sync the master resume data to job-site profiles.
//
// Service-agnostic entry point: it loads the master data and hands it to each
// requested adapter, which owns the mapping to that service's own definitions.
//
// Usage:
//   node sync.mjs [--master resume.json] [--services lapras] [--dry-run]
//
// Env:
//   MASTER_PATH, SERVICES, DRY_RUN, DELETE_MISSING
//   LAPRAS_API_KEY   (per-service credential, read by its adapter's caller below)

import { appendFileSync } from "node:fs";
import { loadMaster } from "./lib/master.mjs";
import * as lapras from "./adapters/lapras.mjs";

/** Registered adapters, keyed by service name. Add new services here. */
const ADAPTERS = {
  [lapras.name]: { module: lapras, apiKeyEnv: "LAPRAS_API_KEY" },
};

function parseArgs(argv) {
  const args = {
    master: process.env.MASTER_PATH || "resume.json",
    services: (process.env.SERVICES || "lapras")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    dryRun: process.env.DRY_RUN === "true",
    deleteMissing: process.env.DELETE_MISSING === "true",
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--master") args.master = argv[++i];
    else if (argv[i] === "--services") args.services = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === "--dry-run") args.dryRun = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

const log = (line) => console.log(line);
const summary = (line) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
};

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

const unknown = args.services.filter((s) => !ADAPTERS[s]);
if (unknown.length > 0) {
  console.error(`unknown service(s): ${unknown.join(", ")} (supported: ${Object.keys(ADAPTERS).join(", ")})`);
  process.exit(2);
}
if (args.services.length === 0) {
  console.error("no services requested");
  process.exit(2);
}

let master;
try {
  master = loadMaster(args.master);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

let failed = false;
for (const service of args.services) {
  const { module: adapter, apiKeyEnv } = ADAPTERS[service];
  const apiKey = process.env[apiKeyEnv] || "";
  if (!apiKey && !args.dryRun) {
    console.error(`${adapter.displayName}: ${apiKeyEnv} is required (or use --dry-run)`);
    failed = true;
    continue;
  }
  summary(`## ${adapter.displayName} への同期${args.dryRun ? " (dry run)" : ""}`);
  log(`=== ${adapter.displayName}${args.dryRun ? " (dry run)" : ""} ===`);
  try {
    const { skipped } = await adapter.sync({
      master,
      apiKey,
      dryRun: args.dryRun,
      deleteMissing: args.deleteMissing,
      log,
      summary,
    });
    if (skipped.length > 0) {
      log(`WARN not synced: ${skipped.join(", ")}`);
      summary(`\n未同期: ${skipped.join(", ")}`);
    }
    if (adapter.unsupportedFields?.length > 0) {
      summary(`\nAPIが無くCI同期できない項目(手動入力): ${adapter.unsupportedFields.join(", ")}`);
    }
  } catch (e) {
    console.error(`${adapter.displayName}: ${e.message}`);
    summary(`\n**失敗**: ${e.message}`);
    failed = true;
  }
}

if (!args.dryRun && !failed) summary("\n同期は上書きです。反映結果をサービス側で確認してください。");
process.exit(failed ? 1 : 0);
