#!/usr/bin/env node
// Verify that every activity is actually this account's work, by asking the
// GitHub API who authored the evidence. Structural validation alone cannot do
// this: a well-formed URL can still point at someone else's pull request.
//
// Usage:
//   node verify.mjs [--data activities.json] [--offline]
//
//   --offline  skip the API calls (structure and host rules only). Use locally;
//              CI must run the full check.
//
// Env: GITHUB_TOKEN (recommended — unauthenticated requests are rate limited)

import { loadActivities, parseGitHubEvidence, ACCOUNT, EVIDENCE_KINDS } from "./lib.mjs";

function parseArgs(argv) {
  const args = { data: process.env.ACTIVITIES_PATH || "activities.json", offline: process.env.OFFLINE === "true" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--data") args.data = argv[++i];
    else if (argv[i] === "--offline") args.offline = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

let useToken = Boolean(process.env.GITHUB_TOKEN);
let warnedAboutToken = false;

// GITHUB_API_URL is set by GitHub Actions (and lets tests point at a stub).
const API_BASE = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");

async function request(path, withToken) {
  return fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `${ACCOUNT}-activity-verifier`,
      ...(withToken ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
}

async function gh(path) {
  let res = await request(path, useToken);
  // A rejected token (an expired one, or a placeholder some environments set)
  // must not stop verification: the public API answers unauthenticated too.
  if (res.status === 401 && useToken) {
    useToken = false;
    if (!warnedAboutToken) {
      console.warn("WARN GITHUB_TOKEN was rejected (401); continuing unauthenticated (rate limits apply)");
      warnedAboutToken = true;
    }
    res = await request(path, false);
  }
  if (res.status === 404) return { notFound: true };
  if (res.status === 403 || res.status === 429) {
    throw new Error(`GitHub API rate limited on ${path} (set a valid GITHUB_TOKEN)`);
  }
  if (!res.ok) throw new Error(`GET ${path} failed: HTTP ${res.status}`);
  return res.json();
}

/**
 * Resolve who produced the thing an evidence URL points at.
 * Returns { login, detail } or { notFound } / { unknown }.
 */
async function resolveAuthor(ref) {
  const base = `/repos/${ref.owner}/${ref.repo}`;
  switch (ref.type) {
    case "pull-request": {
      const pr = await gh(`${base}/pulls/${ref.number}`);
      if (pr.notFound) return { notFound: true };
      return { login: pr.user?.login, detail: `PR #${ref.number} "${pr.title}"` };
    }
    case "commit": {
      const c = await gh(`${base}/commits/${ref.sha}`);
      if (c.notFound) return { notFound: true };
      // author is who wrote it; committer can be GitHub itself on web merges.
      return { login: c.author?.login, detail: `commit ${ref.sha.slice(0, 7)}` };
    }
    case "release": {
      const r = await gh(`${base}/releases/tags/${encodeURIComponent(ref.tag)}`);
      if (r.notFound) return { notFound: true };
      return { login: r.author?.login, detail: `release ${ref.tag}` };
    }
    case "repository": {
      const r = await gh(base);
      if (r.notFound) return { notFound: true };
      return { login: r.owner?.login, detail: `repository (fork=${r.fork})`, fork: r.fork };
    }
    default:
      return { unknown: true };
  }
}

const args = parseArgs(process.argv.slice(2));
let data;
try {
  data = loadActivities(args.data);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
console.log(`structure OK: ${data.items.length} items in ${args.data}`);

if (args.offline) {
  console.log("offline mode: skipped GitHub authorship verification");
  process.exit(0);
}

const problems = [];
let checked = 0;

for (const item of data.items) {
  for (const e of item.evidence) {
    if (EVIDENCE_KINDS[e.kind].verify !== "github") continue;
    const ref = parseGitHubEvidence(e.url);
    let result;
    try {
      result = await resolveAuthor(ref);
    } catch (err) {
      problems.push(`${item.id}: could not verify ${e.url} (${err.message})`);
      continue;
    }
    checked++;
    if (result.notFound) {
      problems.push(`${item.id}: evidence not found on GitHub — ${e.url}`);
      continue;
    }
    if (!result.login) {
      problems.push(`${item.id}: GitHub reports no author for ${e.url} (deleted account or unlinked email)`);
      continue;
    }
    if (result.login.toLowerCase() !== ACCOUNT.toLowerCase()) {
      problems.push(
        `${item.id}: ${result.detail} was authored by @${result.login}, not @${ACCOUNT} — ${e.url}\n` +
          `      本人の成果でないなら削除し、関与しただけなら attribution を reviewer / derived にして根拠を差し替えること`,
      );
      continue;
    }
    // A fork owned by the account is still upstream's project.
    if (ref.type === "repository" && result.fork && item.attribution !== "derived") {
      problems.push(
        `${item.id}: ${e.url} はフォークなので attribution: "derived" と upstream の明示が必要 ` +
          `(現在: "${item.attribution}")`,
      );
    }
  }
}

console.log(`verified ${checked} GitHub evidence link(s) against @${ACCOUNT}`);

if (problems.length > 0) {
  console.error(`\n帰属の検証に失敗しました (${problems.length}件):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    "\nこれらは他者の成果を自分の活動として記載している可能性があります。" +
      "activities.json を修正してください。",
  );
  process.exit(1);
}
console.log("all activities are attributable to this account");
