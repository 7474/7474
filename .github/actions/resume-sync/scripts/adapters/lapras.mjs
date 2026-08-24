// LAPRAS adapter: maps the service-agnostic master data to LAPRAS-specific
// definitions (position type IDs, tech skill master IDs, year buckets) and
// writes them through the LAPRAS public API.
//
// API endpoints are the ones the official lapras-inc/lapras-mcp-server uses.
// Nothing outside this file knows about LAPRAS.

import { parseYearMonth } from "../lib/master.mjs";

export const name = "lapras";
export const displayName = "LAPRAS";

const DEFAULT_BASE_URL = "https://lapras.com/api/mcp";

// --- service-specific definitions -------------------------------------------

/** generic role (master.work[].x_roles) -> LAPRAS position type ID */
const ROLE_TO_POSITION_ID = {
  "frontend-engineer": 1,
  "backend-engineer": 2,
  "web-application-engineer": 3,
  "infrastructure-engineer": 4,
  sre: 5,
  "project-manager": 11,
  "product-manager": 12,
  "tech-lead": 13,
  "engineering-manager": 14,
  "qa-engineer": 16,
  architect: 17,
  "system-engineer": 18,
  "embedded-engineer": 19,
  "scrum-master": 23,
  "data-engineer": 28,
  other: 100,
};

/** LAPRAS accepts only these values for tech skill years */
const YEAR_BUCKETS = [10, 5, 3, 2, 1, 0];

/** Field length limits enforced by the API */
const LIMITS = { job_summary: 10000, want_to_do: 1000 };

function toYearBucket(years) {
  return YEAR_BUCKETS.find((bucket) => years >= bucket) ?? 0;
}

// --- mapping ----------------------------------------------------------------

/** Build the LAPRAS experience description (Markdown) from a master work entry. */
function toDescription(work) {
  const parts = [];
  if (work.summary) parts.push(work.summary);
  if (work.highlights?.length) parts.push(work.highlights.map((h) => `- ${h}`).join("\n"));
  return parts.join("\n\n");
}

function toPositions(work) {
  const positions = (work.x_roles || []).map((role) => {
    const id = ROLE_TO_POSITION_ID[role];
    if (!id) throw new Error(`${work.name}: role "${role}" has no LAPRAS position mapping`);
    return { id };
  });
  if (positions.length === 0) throw new Error(`${work.name}: at least one role is required`);
  return positions;
}

/** master.work[] entry -> LAPRAS experience payload */
export function toExperiencePayload(work) {
  const start = parseYearMonth(work.startDate, `${work.name} startDate`);
  const end = parseYearMonth(work.endDate, `${work.name} endDate`) ?? { year: 0, month: 0 };
  return {
    organization_name: work.name,
    positions: toPositions(work),
    position_name: work.position || "",
    is_client_work: Boolean(work.x_clientWork),
    ...(work.x_clientWork ? { client_company_name: work.x_clientCompanyName } : {}),
    start_year: start.year,
    start_month: start.month,
    end_year: end.year,
    end_month: end.month,
    description: toDescription(work),
  };
}

// --- API client -------------------------------------------------------------

function makeClient(apiKey, baseUrl) {
  return async function api(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        accept: "application/json, text/plain, */*",
      },
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
  };
}

// Response shapes are not formally documented, so accept a bare array as well
// as the documented wrapper key. Throwing when no array is found matters: a
// silently-empty list would make the sync create duplicates instead of
// updating, and would silently drop every skill.
function requireArray(data, keys, context) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (data && Array.isArray(data[key])) return data[key];
  }
  const seen = data && typeof data === "object" ? Object.keys(data).join(", ") : typeof data;
  throw new Error(`${context}: no array found in the response (expected one of: ${keys.join(", ")}; got: ${seen})`);
}

/** Match the normalization the official client uses when resolving skill names. */
function normalizeSkillName(name) {
  return String(name).replace(/\s+/g, "").toLowerCase();
}

function experienceKey(organizationName, startYear, startMonth) {
  return `${organizationName}|${startYear}-${startMonth}`;
}

function positionIdsOf(experience) {
  return (experience.positions || [])
    .map((p) => (typeof p === "object" ? (p.id ?? p.position_id ?? p.job_position_id) : p))
    .filter((id) => id !== undefined)
    .sort((a, b) => a - b);
}

function isUnchanged(payload, existing) {
  return (
    payload.organization_name === existing.organization_name &&
    JSON.stringify(payload.positions.map((p) => p.id).sort((a, b) => a - b)) === JSON.stringify(positionIdsOf(existing)) &&
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

// --- sync -------------------------------------------------------------------

/**
 * Sync master data to LAPRAS.
 * @param {object} args
 * @param {object} args.master        service-agnostic master data
 * @param {string} args.apiKey        LAPRAS API key (may be empty when dryRun)
 * @param {boolean} args.dryRun       print planned writes without performing them
 * @param {boolean} args.deleteMissing delete LAPRAS experiences absent from the master
 * @param {(line: string) => void} args.log
 * @param {(line: string) => void} args.summary
 * @returns {Promise<{skipped: string[]}>}
 */
export async function sync({ master, apiKey, dryRun, deleteMissing, log, summary }) {
  const baseUrl = process.env.LAPRAS_BASE_URL || DEFAULT_BASE_URL;
  const api = apiKey ? makeClient(apiKey, baseUrl) : null;
  const skipped = [];

  // 1. Text fields: basics.summary -> 職務要約, x_wantToDo -> やりたいこと
  const textFields = [
    { path: "/job_summary", key: "job_summary", label: "職務要約", value: master.basics.summary },
    { path: "/want_to_do", key: "want_to_do", label: "今後のキャリアでやりたいこと", value: master.x_wantToDo },
  ];
  for (const field of textFields) {
    if (!field.value) {
      log(`skip ${field.key}: master has no value`);
      continue;
    }
    if (field.value.length > LIMITS[field.key]) {
      throw new Error(`${field.key}: ${field.value.length} chars exceeds the LAPRAS limit of ${LIMITS[field.key]}`);
    }
    if (dryRun) {
      log(`[dry run] would PUT ${field.key} (${field.value.length} chars)`);
    } else {
      await api("PUT", field.path, { [field.key]: field.value });
      log(`synced ${field.key} (${field.value.length} chars)`);
    }
    summary(`- ${field.label}: ${field.value.length}文字`);
  }

  // 2. work[] -> experiences (matched on organization name + start year-month)
  const payloads = (master.work || []).map(toExperiencePayload);
  const existing = api
    ? requireArray(await api("GET", "/experiences"), ["experiences", "experience_list"], "GET /experiences")
    : [];
  const existingByKey = new Map(
    existing.map((item) => [experienceKey(item.organization_name, item.start_year, item.start_month), item]),
  );
  const seenKeys = new Set();

  for (const payload of payloads) {
    const key = experienceKey(payload.organization_name, payload.start_year, payload.start_month);
    seenKeys.add(key);
    const current = existingByKey.get(key);
    if (!current) {
      if (dryRun) log(`[dry run] would CREATE experience: ${payload.organization_name}`);
      else {
        await api("POST", "/experiences", payload);
        log(`created experience: ${payload.organization_name}`);
      }
      summary(`- 職歴 作成: ${payload.organization_name}`);
    } else if (!isUnchanged(payload, current)) {
      const id = current.id ?? current.experience_id;
      if (id === undefined) {
        log(`WARN cannot update ${payload.organization_name}: the existing entry has no id`);
        skipped.push(`experience ${payload.organization_name} (no id in API response)`);
        continue;
      }
      if (dryRun) log(`[dry run] would UPDATE experience ${id}: ${payload.organization_name}`);
      else {
        await api("PUT", `/experiences/${id}`, payload);
        log(`updated experience ${id}: ${payload.organization_name}`);
      }
      summary(`- 職歴 更新: ${payload.organization_name}`);
    } else {
      log(`unchanged: ${payload.organization_name}`);
      summary(`- 職歴 変更なし: ${payload.organization_name}`);
    }
  }

  for (const [key, item] of existingByKey) {
    if (seenKeys.has(key)) continue;
    const id = item.id ?? item.experience_id;
    if (deleteMissing && id !== undefined) {
      if (dryRun) log(`[dry run] would DELETE experience ${id}: ${item.organization_name}`);
      else {
        await api("DELETE", `/experiences/${id}`);
        log(`deleted experience ${id}: ${item.organization_name}`);
      }
      summary(`- 職歴 削除: ${item.organization_name}`);
    } else {
      log(`WARN LAPRAS has an experience absent from the master: ${item.organization_name} (set delete_missing_experiences to remove it)`);
      summary(`- 職歴 マスタ外(放置): ${item.organization_name}`);
    }
  }

  // 3. skills[] -> tech_skill (names resolved against the LAPRAS master at runtime)
  const skills = master.skills || [];
  if (skills.length > 0) {
    if (!api) {
      log(`[dry run] ${skills.length} skills to sync (name resolution requires an API key):`);
      for (const s of skills) log(`  - ${s.name}: ${s.x_years}y -> bucket ${toYearBucket(s.x_years)}`);
    } else {
      const catalog = requireArray(
        await api("GET", "/tech_skill/master"),
        ["tech_skill_list"],
        "GET /tech_skill/master",
      );
      if (catalog.length === 0) throw new Error("GET /tech_skill/master returned an empty catalog");
      const idByName = new Map(
        catalog.filter((m) => m?.name).map((m) => [normalizeSkillName(m.name), m.id ?? m.tech_skill_id]),
      );
      const list = [];
      for (const skill of skills) {
        const id = idByName.get(normalizeSkillName(skill.name));
        if (id === undefined) {
          log(`WARN skill not in the LAPRAS catalog, skipped: "${skill.name}"`);
          skipped.push(`skill ${skill.name} (not in LAPRAS catalog)`);
          summary(`- スキル 未同期(カタログに無い): ${skill.name}`);
          continue;
        }
        list.push({ tech_skill_id: id, years: toYearBucket(skill.x_years) });
      }
      // Every name failing to resolve means the catalog or the matching is
      // broken, not that the master lists 20 unknown technologies.
      if (list.length === 0) {
        throw new Error(
          `none of the ${skills.length} skills resolved against the LAPRAS catalog (${catalog.length} entries); the catalog format or name matching is likely broken`,
        );
      }
      if (list.length > 0) {
        if (dryRun) log(`[dry run] would PUT tech_skill with ${list.length} skills`);
        else {
          await api("PUT", "/tech_skill", { tech_skill_list: list });
          log(`synced ${list.length} tech skills`);
        }
        summary(`- 経験技術: ${list.length}件`);
      }
    }
  }

  return { skipped };
}

/** Master fields this service cannot accept (no API); reported so they can be entered by hand. */
export const unsupportedFields = ["希望年収・勤務地", "学歴"];
