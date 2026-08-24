#!/usr/bin/env node
// Sync structured career data (work experiences and tech skills) to a LAPRAS
// profile via the public API (the same endpoints used by lapras-inc/lapras-mcp-server).
//
// Env:
//   CAREER_DATA_PATH  (required) path to the career data JSON file
//   LAPRAS_API_KEY    (required unless DRY_RUN=true) https://lapras.com/config/api-key
//   DRY_RUN           "true" to print planned operations without writing
//   DELETE_MISSING    "true" to delete LAPRAS experiences absent from the data file
//                     (default: warn only)
//   LAPRAS_BASE_URL   override for testing (default: https://lapras.com/api/mcp)
//
// Data file format:
// {
//   "experiences": [{
//     "organization_name": "株式会社...",       // required
//     "positions": ["テックリード", ...],       // required, names from POSITION_IDS
//     "position_name": "肩書き",                // optional free text
//     "is_client_work": false,                  // required
//     "client_company_name": "...",             // required when is_client_work
//     "start": "2018-11",                       // required, YYYY-MM
//     "end": "2022-03" | null,                  // null = ongoing
//     "description": "Markdown..."              // optional
//   }],
//   "tech_skills": [{ "name": "AWS", "years": 10 }]
// }

import { readFileSync, appendFileSync } from "node:fs";

const BASE_URL = process.env.LAPRAS_BASE_URL || "https://lapras.com/api/mcp";

// Position type IDs defined by the LAPRAS API
// (see lapras-inc/lapras-mcp-server createExperience tool schema)
const POSITION_IDS = {
  フロントエンドエンジニア: 1,
  バックエンドエンジニア: 2,
  Webアプリケーションエンジニア: 3,
  インフラエンジニア: 4,
  SRE: 5,
  機械学習エンジニア: 9,
  プロジェクトマネージャー: 11,
  プロダクトマネージャー: 12,
  テックリード: 13,
  エンジニアリングマネージャー: 14,
  "QA・テストエンジニア": 16,
  アーキテクト: 17,
  システムエンジニア: 18,
  組み込みエンジニア: 19,
  データベースエンジニア: 20,
  セキュリティエンジニア: 22,
  スクラムマスター: 23,
  データエンジニア: 28,
  ITエンジニアその他: 32,
  その他: 100,
};

// LAPRAS accepts only these bucket values for tech skill years
function yearsToBucket(years) {
  if (years >= 10) return 10;
  if (years >= 5) return 5;
  if (years >= 3) return 3;
  if (years >= 2) return 2;
  if (years >= 1) return 1;
  return 0;
}

function parseYearMonth(value, label) {
  if (value === null || value === undefined || value === "") return { year: 0, month: 0 };
  const m = String(value).match(/^(\d{4})-(\d{1,2})$/);
  if (!m) throw new Error(`${label}: "${value}" is not in YYYY-MM format`);
  return { year: Number(m[1]), month: Number(m[2]) };
}

function toPayload(exp) {
  const start = parseYearMonth(exp.start, `${exp.organization_name} start`);
  const end = parseYearMonth(exp.end, `${exp.organization_name} end`);
  const positions = (exp.positions || []).map((name) => {
    const id = POSITION_IDS[name];
    if (!id) throw new Error(`unknown position "${name}" for ${exp.organization_name}; known: ${Object.keys(POSITION_IDS).join(", ")}`);
    return { id };
  });
  if (positions.length === 0) throw new Error(`${exp.organization_name}: positions must not be empty`);
  if (exp.is_client_work && !exp.client_company_name) {
    throw new Error(`${exp.organization_name}: client_company_name is required when is_client_work is true`);
  }
  return {
    organization_name: exp.organization_name,
    positions,
    position_name: exp.position_name || "",
    is_client_work: Boolean(exp.is_client_work),
    ...(exp.is_client_work ? { client_company_name: exp.client_company_name } : {}),
    start_year: start.year,
    start_month: start.month,
    end_year: end.year,
    end_month: end.month,
    description: exp.description || "",
  };
}

const headers = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  accept: "application/json, text/plain, */*",
});

async function api(method, path, apiKey, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(apiKey),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} failed: HTTP ${res.status} ${text}`);
  }
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// API response shapes are not formally documented; accept both bare arrays
// and common wrapper keys.
function pickArray(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (data && Array.isArray(data[key])) return data[key];
  }
  return null;
}

function experienceKey(orgName, startYear, startMonth) {
  return `${orgName}|${startYear}-${startMonth}`;
}

function payloadEquals(payload, existing) {
  const existingPositions = (existing.positions || [])
    .map((p) => (typeof p === "object" ? p.id ?? p.position_id ?? p.job_position_id : p))
    .filter((id) => id !== undefined)
    .sort();
  const desiredPositions = payload.positions.map((p) => p.id).sort();
  return (
    payload.organization_name === existing.organization_name &&
    JSON.stringify(desiredPositions) === JSON.stringify(existingPositions) &&
    payload.position_name === (existing.position_name || "") &&
    payload.is_client_work === Boolean(existing.is_client_work) &&
    (payload.client_company_name || "") === (existing.client_company_name || "") &&
    payload.start_year === existing.start_year &&
    payload.start_month === existing.start_month &&
    payload.end_year === (existing.end_year || 0) &&
    payload.end_month === (existing.end_month || 0) &&
    payload.description === (existing.description || "")
  );
}

function stepSummary(line) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  }
}

const dataPath = process.env.CAREER_DATA_PATH;
if (!dataPath) {
  console.error("CAREER_DATA_PATH is required");
  process.exit(1);
}
const dryRun = process.env.DRY_RUN === "true";
const deleteMissing = process.env.DELETE_MISSING === "true";
const apiKey = process.env.LAPRAS_API_KEY;
if (!dryRun && !apiKey) {
  console.error("LAPRAS_API_KEY is required (or set DRY_RUN=true)");
  process.exit(1);
}

const data = JSON.parse(readFileSync(dataPath, "utf8"));
stepSummary(`## Career sync to LAPRAS${dryRun ? " (dry run)" : ""}`);

// --- Experiences ---
const desired = (data.experiences || []).map(toPayload);
if (desired.length > 0) {
  let existingList = [];
  if (apiKey) {
    const res = await api("GET", "/experiences", apiKey);
    existingList = pickArray(res, ["experiences", "experience_list", "results", "items"]) || [];
  }
  const existingByKey = new Map();
  for (const item of existingList) {
    existingByKey.set(experienceKey(item.organization_name, item.start_year, item.start_month), item);
  }
  const desiredKeys = new Set();
  for (const payload of desired) {
    const key = experienceKey(payload.organization_name, payload.start_year, payload.start_month);
    desiredKeys.add(key);
    const existing = existingByKey.get(key);
    if (!existing) {
      if (dryRun) {
        console.log(`[dry run] would CREATE experience: ${payload.organization_name} (${payload.start_year}-${payload.start_month})`);
      } else {
        await api("POST", "/experiences", apiKey, payload);
        console.log(`created experience: ${payload.organization_name}`);
      }
      stepSummary(`- 職歴 作成: ${payload.organization_name}`);
    } else if (!payloadEquals(payload, existing)) {
      const id = existing.id ?? existing.experience_id;
      if (id === undefined) {
        console.warn(`cannot update ${payload.organization_name}: existing entry has no id field`);
        continue;
      }
      if (dryRun) {
        console.log(`[dry run] would UPDATE experience ${id}: ${payload.organization_name}`);
      } else {
        await api("PUT", `/experiences/${id}`, apiKey, payload);
        console.log(`updated experience ${id}: ${payload.organization_name}`);
      }
      stepSummary(`- 職歴 更新: ${payload.organization_name}`);
    } else {
      console.log(`unchanged: ${payload.organization_name}`);
      stepSummary(`- 職歴 変更なし: ${payload.organization_name}`);
    }
  }
  for (const [key, item] of existingByKey) {
    if (desiredKeys.has(key)) continue;
    const id = item.id ?? item.experience_id;
    if (deleteMissing && id !== undefined) {
      if (dryRun) {
        console.log(`[dry run] would DELETE experience ${id}: ${item.organization_name}`);
      } else {
        await api("DELETE", `/experiences/${id}`, apiKey);
        console.log(`deleted experience ${id}: ${item.organization_name}`);
      }
      stepSummary(`- 職歴 削除: ${item.organization_name}`);
    } else {
      console.warn(`LAPRAS has an experience not in ${dataPath}: ${item.organization_name} (set DELETE_MISSING=true to delete)`);
      stepSummary(`- 職歴 データ外(放置): ${item.organization_name}`);
    }
  }
}

// --- Tech skills ---
const skills = data.tech_skills || [];
if (skills.length > 0) {
  if (!apiKey) {
    console.log(`[dry run] would sync ${skills.length} tech skills (name resolution needs LAPRAS_API_KEY):`);
    for (const s of skills) console.log(`  - ${s.name}: ${s.years}y -> bucket ${yearsToBucket(s.years)}`);
  } else {
    const masterRes = await api("GET", "/tech_skill/master", apiKey);
    const master = pickArray(masterRes, ["tech_skill_master", "tech_skills", "master", "results", "items"]) || [];
    const byName = new Map();
    for (const m of master) {
      if (m && m.name) byName.set(String(m.name).toLowerCase(), m.id ?? m.tech_skill_id);
    }
    const list = [];
    for (const s of skills) {
      const id = byName.get(String(s.name).toLowerCase());
      if (id === undefined) {
        console.warn(`tech skill not in LAPRAS master, skipped: "${s.name}"`);
        stepSummary(`- スキル 未登録(マスタに無い): ${s.name}`);
        continue;
      }
      list.push({ tech_skill_id: id, years: yearsToBucket(s.years) });
      if (dryRun) console.log(`[dry run] tech skill: ${s.name} (id=${id}, years bucket=${yearsToBucket(s.years)})`);
    }
    if (list.length > 0) {
      if (dryRun) {
        console.log(`[dry run] would PUT tech_skill with ${list.length} skills`);
      } else {
        await api("PUT", "/tech_skill", apiKey, { tech_skill_list: list });
        console.log(`synced ${list.length} tech skills`);
      }
      stepSummary(`- 経験技術: ${list.length}件を同期`);
    }
  }
}

if (!dryRun) {
  stepSummary("\n同期は上書きです。反映結果を https://lapras.com/career で確認してください。");
}
