// Render the master data as Markdown, in two views:
//   - renderMarkdown: the page published on GitHub Pages
//   - renderReview:   every field in the master, for reviewing a JSON diff
// Service-agnostic: this is the human-facing view of the same master data the
// adapters sync to job sites.

import { formatPeriod, formatYearMonth, sortedByStartDesc } from "./master.mjs";

const GENERATED_NOTICE =
  "<!-- このファイルは resume.json から生成されています。直接編集せず resume.json を編集し、" +
  "`node .github/actions/resume-sync/scripts/generate.mjs` で再生成してください。 -->";

const REVIEW_NOTICE = [
  "<!-- このファイルはマスタデータ(JSON)から生成されたレビュー用ビューです。直接編集せずマスタを編集し、",
  "`node .github/actions/resume-sync/scripts/generate.mjs --review --master <マスタ> --out <このファイル>` で再生成してください。 -->",
  "",
  "> **レビュー用ビュー**: マスタデータの全項目をレンダリングしたもの(公開ページに出さない項目を含む)。",
  "> 編集対象はマスタのJSONで、このファイルはその内容を読むためのもの。",
].join("\n");

function section(title, body) {
  return body && body.length > 0 ? `## ${title}\n\n${body}\n` : "";
}

function highlightList(highlights) {
  return (highlights || []).map((h) => `- ${h}`).join("\n");
}

function workTable(work) {
  const rows = sortedByStartDesc(work)
    .filter((w) => !w.x_sideJob)
    .map((w) => {
      const start = formatYearMonth(w.startDate);
      const end = w.endDate ? formatYearMonth(w.endDate) : "";
      const name = w.url ? `[${w.name}](${w.url})` : w.name;
      const note = w.x_note ? w.x_note : "";
      return `| ${start} | ${end} | ${name} | ${note} |`;
    });
  return ["| 入社 | 退社 | 社名 | 備考 |", "|----|----|----|----|", ...rows].join("\n");
}

function workDetail(w) {
  const parts = [`### ${w.name}`, "", `${formatPeriod(w.startDate, w.endDate)}${w.position ? ` / ${w.position}` : ""}`];
  if (w.x_clientWork) parts.push("", `クライアントワーク: ${w.x_clientCompanyName}`);
  if (w.summary) parts.push("", w.summary);
  const highlights = highlightList(w.highlights);
  if (highlights) parts.push("", highlights);
  return parts.join("\n");
}

function projectDetail(p) {
  const period = formatPeriod(p.startDate, p.endDate);
  const heading = [`### ${p.name}`, ""];
  const meta = [p.x_affiliation, period].filter(Boolean).join(" / ");
  const parts = [...heading];
  if (meta) parts.push(meta, "");
  if (p.description) parts.push(p.description, "");
  const highlights = highlightList(p.highlights);
  if (highlights) parts.push(highlights, "");
  if (p.keywords?.length) parts.push(`要素技術: ${p.keywords.join(", ")}`, "");
  if (p.url) parts.push(`関連: ${p.url}`, "");
  return parts.join("\n").trimEnd();
}

function skillTable(skills) {
  const rows = (skills || []).map((s) => {
    const years = s.x_years >= 1 ? `約${s.x_years}年` : "1年未満";
    const keywords = s.keywords?.length ? s.keywords.join(", ") : "";
    return `| ${s.name} | ${years} | ${s.level || ""} | ${keywords} |`;
  });
  return ["| 技術 | 経験 | レベル | 備考 |", "|----|----|----|----|", ...rows].join("\n");
}

function talkList(talks) {
  return (talks || [])
    .map((t) => {
      const title = t.url ? `[${t.title}](${t.url})` : t.title;
      return `- ${t.date} ${t.event}: ${title}`;
    })
    .join("\n");
}

function outputList(outputs) {
  return (outputs || [])
    .map((group) => [`### ${group.category}`, "", ...group.items.map((i) => `- ${i}`)].join("\n"))
    .join("\n\n");
}

function profileList(profiles) {
  return (profiles || []).map((p) => `- ${p.network}: ${p.url}`).join("\n");
}

function educationTable(education) {
  const rows = (education || []).map((e) => {
    // With no start date, show the end date alone ("2005年3月") rather than an
    // open-ended range ("〜 2005年3月").
    const period = e.startDate ? formatPeriod(e.startDate, e.endDate) : formatYearMonth(e.endDate);
    return `| ${period} | ${e.institution} | ${e.area || ""} | ${e.studyType || ""} |`;
  });
  return ["| 期間 | 学校 | 学科 | 区分 |", "|----|----|----|----|", ...rows].join("\n");
}

/** Sections common to both views. */
function commonSections(master) {
  const work = master.work || [];
  const sideJobs = work.filter((w) => w.x_sideJob);
  const employments = sortedByStartDesc(work.filter((w) => !w.x_sideJob));
  const sideJobNote =
    sideJobs.length > 0 ? "\n\n他に、副業として下記に関わっています(「在籍企業ごとの職務内容」に記載)。" : "";

  return [
    section("紹介文", master.basics.summary),
    section("このさきやってみたいこと", master.x_wantToDo),
    section("職歴", `${workTable(work)}${sideJobNote}`),
    section("テクニカルスキル", skillTable(master.skills)),
    section("在籍企業ごとの職務内容", [...employments, ...sideJobs].map(workDetail).join("\n\n")),
    section("主なプロジェクト", (master.projects || []).map(projectDetail).join("\n\n")),
    section("登壇", talkList(master.x_talks)),
    section("アウトプット", outputList(master.x_outputs)),
    section("リンク", profileList(master.basics.profiles)),
  ];
}

/**
 * Build the full Markdown document from master data.
 *
 * NOTE: `education` is deliberately NOT rendered. It is kept in the master
 * because job sites ask for it as a form field, but it is not wanted on the
 * published page. Do not "fix" this by adding an education section.
 */
export function renderMarkdown(master) {
  const sections = commonSections(master).filter(Boolean);
  return `${[GENERATED_NOTICE, "", "# 職務経歴", "", ...sections].join("\n").trimEnd()}\n`;
}

/**
 * Render every field of the master, for reviewing a JSON diff in readable form.
 * Unlike renderMarkdown this includes fields kept out of the published page
 * (currently `education`), so a reviewer sees the whole master.
 */
export function renderReview(master) {
  const sections = [
    ...commonSections(master),
    section("学歴 ※公開ページには出さない項目", educationTable(master.education)),
  ].filter(Boolean);
  return `${[REVIEW_NOTICE, "", "# 職務経歴(マスタデータ全項目)", "", ...sections].join("\n").trimEnd()}\n`;
}
