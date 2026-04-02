#!/usr/bin/env python3
"""
koudenpa のポジティブなインターネット活動を収集して activities.md を生成するスクリプト。

収集元:
- GitHub public events API
- はてなブログ RSS (koudenpa.hatenablog.com)
- Zenn RSS (zenn.dev/koudenpa)
- Qiita RSS (qiita.com/koudenpa)

GitHub Models (LLM) を使ってポジティブ判定と日本語サマリーを生成する。
"""

import os
import json
import time
import textwrap
from datetime import datetime, timezone, timedelta

import requests
import feedparser
from openai import OpenAI

# ────────────────────────────────────────────────
# 設定
# ────────────────────────────────────────────────
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
GITHUB_USER = "koudenpa"
OUTPUT_FILE = "activities.md"

# GitHub Models のエンドポイント（OpenAI 互換）
MODELS_BASE_URL = "https://models.inference.ai.azure.com"
# 軽量モデルで十分なタスク
MODEL_NAME = "gpt-4o-mini"

# 収集する最大日数（過去 N 日）
LOOKBACK_DAYS = 90

# ────────────────────────────────────────────────
# GitHub Events API
# ────────────────────────────────────────────────

POSITIVE_EVENT_TYPES = {
    "PushEvent": "コミット",
    "CreateEvent": "ブランチ/タグ作成",
    "PullRequestEvent": "プルリクエスト",
    "IssuesEvent": "Issue",
    "IssueCommentEvent": "Issueコメント",
    "WatchEvent": "スター",
    "ForkEvent": "フォーク",
    "ReleaseEvent": "リリース",
    "PublicEvent": "リポジトリ公開",
    "MemberEvent": "コラボレーター追加",
}

# さらに絞り込む「ポジティブ」サブアクション
POSITIVE_ACTIONS = {
    "PullRequestEvent": ["opened", "closed"],  # merged は closed + merged=true
    "IssuesEvent": ["opened", "closed"],
    "ReleaseEvent": ["published"],
    "CreateEvent": None,  # すべて
    "PushEvent": None,
    "WatchEvent": ["started"],
    "ForkEvent": None,
    "PublicEvent": None,
    "MemberEvent": ["added"],
}


def _since_str() -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    return dt.isoformat()


def fetch_github_events() -> list[dict]:
    """GitHub public events を取得してポジティブなものを返す。"""
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    events = []
    page = 1
    since = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)

    while page <= 10:  # 最大 10 ページ
        resp = requests.get(
            f"https://api.github.com/users/{GITHUB_USER}/events/public",
            headers=headers,
            params={"per_page": 100, "page": page},
            timeout=30,
        )
        if resp.status_code == 422 or resp.status_code == 404:
            break
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break

        for ev in data:
            created_at = datetime.fromisoformat(ev["created_at"].replace("Z", "+00:00"))
            if created_at < since:
                return events  # 古すぎたら終了
            etype = ev.get("type", "")
            if etype not in POSITIVE_EVENT_TYPES:
                continue
            allowed_actions = POSITIVE_ACTIONS.get(etype)
            if allowed_actions is not None:
                action = (ev.get("payload") or {}).get("action", "")
                if action not in allowed_actions:
                    # PullRequestEvent の merge チェック
                    if etype == "PullRequestEvent":
                        pr = (ev.get("payload") or {}).get("pull_request", {})
                        if not pr.get("merged"):
                            continue
                    else:
                        continue
            events.append(ev)
        page += 1

    return events


def format_github_event(ev: dict) -> dict:
    """GitHub event を統一形式に変換する。"""
    etype = ev["type"]
    payload = ev.get("payload", {}) or {}
    repo = (ev.get("repo") or {}).get("name", "")
    created_at = datetime.fromisoformat(ev["created_at"].replace("Z", "+00:00"))
    created_at_jst = created_at.astimezone(timezone(timedelta(hours=9)))

    title = POSITIVE_EVENT_TYPES.get(etype, etype)
    url = f"https://github.com/{repo}"
    description = ""

    if etype == "PushEvent":
        commits = payload.get("commits", [])
        msgs = [c.get("message", "").splitlines()[0] for c in commits[:3]]
        description = " / ".join(msgs)
    elif etype == "PullRequestEvent":
        pr = payload.get("pull_request", {})
        title = "プルリクエストマージ" if pr.get("merged") else "プルリクエスト"
        description = pr.get("title", "")
        url = pr.get("html_url", url)
    elif etype == "IssuesEvent":
        issue = payload.get("issue", {})
        title = "Issue クローズ" if payload.get("action") == "closed" else "Issue オープン"
        description = issue.get("title", "")
        url = issue.get("html_url", url)
    elif etype == "CreateEvent":
        ref_type = payload.get("ref_type", "")
        ref = payload.get("ref", "")
        title = f"リポジトリ作成" if ref_type == "repository" else f"{ref_type} 作成"
        description = ref or repo
    elif etype == "WatchEvent":
        title = "スター付与"
        description = repo
    elif etype == "ForkEvent":
        title = "フォーク"
        description = repo
    elif etype == "ReleaseEvent":
        release = payload.get("release", {})
        title = "リリース公開"
        description = release.get("name") or release.get("tag_name", "")
        url = release.get("html_url", url)
    elif etype == "PublicEvent":
        title = "リポジトリ公開"
        description = repo
    elif etype == "MemberEvent":
        title = "コラボレーター追加"
        description = repo

    return {
        "source": "GitHub",
        "title": title,
        "description": description,
        "url": url,
        "date": created_at_jst.strftime("%Y-%m-%d"),
        "raw": f"[{title}] {repo}: {description}",
    }


# ────────────────────────────────────────────────
# RSS フィード
# ────────────────────────────────────────────────

RSS_FEEDS = {
    "はてなブログ": "https://koudenpa.hatenablog.com/rss",
    "Zenn": "https://zenn.dev/koudenpa/feed",
    "Qiita": "https://qiita.com/koudenpa/feed.atom",
}


def fetch_rss_entries(source_name: str, feed_url: str) -> list[dict]:
    """RSS/Atom フィードのエントリを取得する。"""
    since = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    feed = feedparser.parse(feed_url)
    entries = []

    for entry in feed.entries:
        # 日付の取得
        published = None
        for attr in ("published_parsed", "updated_parsed"):
            if hasattr(entry, attr) and getattr(entry, attr):
                t = getattr(entry, attr)
                published = datetime.fromtimestamp(time.mktime(t), tz=timezone.utc)
                break

        if published and published < since:
            continue

        date_str = published.astimezone(timezone(timedelta(hours=9))).strftime("%Y-%m-%d") if published else "日付不明"
        entries.append({
            "source": source_name,
            "title": getattr(entry, "title", ""),
            "description": getattr(entry, "summary", "")[:200].strip(),
            "url": getattr(entry, "link", ""),
            "date": date_str,
            "raw": f"[{source_name}] {getattr(entry, 'title', '')}",
        })

    return entries


# ────────────────────────────────────────────────
# GitHub Models (LLM) によるポジティブ判定・サマリー生成
# ────────────────────────────────────────────────


def classify_and_summarize(activities: list[dict]) -> list[dict]:
    """
    GitHub Models を使って各アクティビティにポジティブスコアとコメントを付与する。
    LLM 呼び出しはバッチで行いコストを最小化する。
    """
    if not activities:
        return []

    client = OpenAI(base_url=MODELS_BASE_URL, api_key=GITHUB_TOKEN)

    # バッチサイズ 30 で処理
    batch_size = 30
    enriched = []

    for i in range(0, len(activities), batch_size):
        batch = activities[i : i + batch_size]
        items_json = json.dumps(
            [{"id": j, "source": a["source"], "title": a["title"], "description": a["description"]} for j, a in enumerate(batch)],
            ensure_ascii=False,
        )

        prompt = textwrap.dedent(f"""
            あなたは日本人エンジニア koudenpa さんのインターネット活動を評価するアシスタントです。
            以下の活動リスト（JSON形式）を確認し、各活動が「ポジティブ」かどうかを判定してください。

            ポジティブとみなす基準:
            - 技術的な成果物の公開（コード、ブログ記事、スライドなど）
            - コミュニティへの貢献（PR, Issue, コメントなど）
            - 学習・探求の証（スター、フォーク、新技術試用など）
            - 情報発信・共有

            各アクティビティに対して以下のJSONを返してください:
            {{
              "id": <元のid>,
              "is_positive": true/false,
              "short_comment": "活動を一言で表す日本語の説明（30文字以内）"
            }}

            活動リスト:
            {items_json}

            JSONの配列のみを返してください。説明文は不要です。
        """).strip()

        try:
            resp = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            content = resp.choices[0].message.content or "[]"
            # モデルが {"results": [...]} または直接配列を返す場合に対応
            parsed = json.loads(content)
            if isinstance(parsed, list):
                results = parsed
            elif isinstance(parsed, dict):
                results = parsed.get("results", [])
                if not results:
                    print(f"[LLM] 予期しないレスポンス構造。'results' キーが見つかりません: {list(parsed.keys())}")
            else:
                results = []

            result_map = {r["id"]: r for r in results if isinstance(r, dict)}
        except Exception as e:
            print(f"[LLM] 判定スキップ (エラー: {e})")
            result_map = {}

        for j, activity in enumerate(batch):
            result = result_map.get(j, {})
            activity["is_positive"] = result.get("is_positive", True)
            activity["comment"] = result.get("short_comment", activity["title"])
            enriched.append(activity)

    return enriched


# ────────────────────────────────────────────────
# activities.md 生成
# ────────────────────────────────────────────────

SOURCE_EMOJI = {
    "GitHub": "🐙",
    "はてなブログ": "📝",
    "Zenn": "📘",
    "Qiita": "🟩",
}


def generate_markdown(activities: list[dict]) -> str:
    """ポジティブなアクティビティから activities.md を生成する。"""
    positive = [a for a in activities if a.get("is_positive", True)]
    # 日付降順に並べる
    positive.sort(key=lambda a: a["date"], reverse=True)

    now_jst = datetime.now(timezone(timedelta(hours=9))).strftime("%Y-%m-%d %H:%M JST")

    lines = [
        "# 活動履歴",
        "",
        f"> 最終更新: {now_jst}  ",
        f"> 収集期間: 直近 {LOOKBACK_DAYS} 日間  ",
        f"> ポジティブな活動 {len(positive)} 件",
        "",
    ]

    # ソース別集計
    sources: dict[str, list[dict]] = {}
    for a in positive:
        sources.setdefault(a["source"], []).append(a)

    for source, items in sources.items():
        emoji = SOURCE_EMOJI.get(source, "🔗")
        lines.append(f"## {emoji} {source}")
        lines.append("")
        lines.append("| 日付 | 活動 | 詳細 |")
        lines.append("|------|------|------|")
        for item in items:
            title = item["comment"] or item["title"]
            desc = item["description"][:60].replace("|", "｜") if item["description"] else ""
            url = item["url"]
            link = f"[{title}]({url})" if url else title
            lines.append(f"| {item['date']} | {link} | {desc} |")
        lines.append("")

    return "\n".join(lines)


# ────────────────────────────────────────────────
# メイン
# ────────────────────────────────────────────────


def main():
    print("=== koudenpa 活動収集スクリプト ===")

    all_activities: list[dict] = []

    # 1. GitHub Events
    print(f"[1/2] GitHub Events を取得中...")
    try:
        events = fetch_github_events()
        formatted = [format_github_event(ev) for ev in events]
        all_activities.extend(formatted)
        print(f"  → {len(formatted)} 件のイベントを取得")
    except Exception as e:
        print(f"  [警告] GitHub Events 取得失敗: {e}")

    # 2. RSS フィード
    print(f"[2/2] RSS フィードを取得中...")
    for source_name, feed_url in RSS_FEEDS.items():
        try:
            entries = fetch_rss_entries(source_name, feed_url)
            all_activities.extend(entries)
            print(f"  {source_name}: {len(entries)} 件")
        except Exception as e:
            print(f"  [警告] {source_name} フィード取得失敗: {e}")

    print(f"\n合計 {len(all_activities)} 件のアクティビティを収集")

    # 3. LLM でポジティブ判定・サマリー生成
    print("\n[LLM] ポジティブ判定とサマリー生成中...")
    enriched = classify_and_summarize(all_activities)
    positive_count = sum(1 for a in enriched if a.get("is_positive", True))
    print(f"  → ポジティブ: {positive_count} 件 / 全体: {len(enriched)} 件")

    # 4. Markdown 生成
    print(f"\n[出力] {OUTPUT_FILE} を生成中...")
    md = generate_markdown(enriched)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  → {OUTPUT_FILE} を出力しました ({len(md)} 文字)")


if __name__ == "__main__":
    main()
