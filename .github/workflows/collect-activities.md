---
name: "7474 ポートフォリオ更新"
description: |
  7474 (koudenpa) のパブリックリポジトリ・ブログ・Web上の活動を分析し、
  根拠(evidence)付きの構造化データ activities.json を生成する。
  帰属が機械的に検証できる活動のみを収集する。

on:
  schedule: weekly on monday
  workflow_dispatch:

engine: copilot

permissions:
  contents: read
  issues: read
  pull-requests: read

network:
  allowed:
    - defaults
    - "hatenablog.com"
    - "zenn.dev"
    - "qiita.com"
    - "speakerdeck.com"
    - "connpass.com"
    - "api.tavily.com"

tools:
  github:
    toolsets: [default]
  web-fetch:
  edit:

mcp-servers:
  tavily:
    command: npx
    args: ["-y", "@tavily/mcp-server"]
    env:
      TAVILY_API_KEY: "${{ secrets.TAVILY_API_KEY }}"
    allowed: ["search", "search_news"]

timeout-minutes: 30

safe-outputs:
  create-pull-request:
    title-prefix: "[ポートフォリオ] "
    labels: [automation]
    draft: false
    protected-files: fallback-to-issue
---

# 7474 ポートフォリオ収集エージェント

あなたは GitHub ユーザー `7474`（ハンドルネーム: `koudenpa` / `光電`）の活動を収集し、構造化データ `activities.json` を生成・更新するエージェントです。

## 🚨 最重要原則: 帰属が検証できないものは書かない

このポートフォリオは**本人の成果だけ**を載せます。他者の成果物を本人の活動として記載することは、このタスクにおける最大の失敗です。

したがって、**すべての項目に「根拠(evidence)」のURLを付けてください**。根拠が出せない活動は、どれだけ魅力的でも**書かないでください**。

生成物 `activities.json` は CI で機械的に検証されます。`.github/scripts/activities/verify.mjs` が GitHub API に問い合わせ、根拠URLの実際の作成者が `7474` であるかを照合します。**他者が作成した PR やコミットを根拠にすると CI が失敗し、あなたの成果物は却下されます**。推測で埋めるより、項目数が少ない方が良い結果です。

### よくある誤り(実際に発生したもの)

| 誤り | 正しい扱い |
|---|---|
| テンプレートや教材をクローンしたリポジトリを「自作」として記載 | `attribution: "derived"` + `upstream` に出所を明記 |
| フォークしたリポジトリの上流の機能を自分の成果として記載 | 同上。自分が加えた変更のみを `author` として書く |
| Dependabot や AI エージェントが作成した PR を自分の成果として記載 | 記載しない(自分でレビュー・判断したなら `attribution: "reviewer"`) |
| Web 検索で見つかった同名(`koudenpa`)の他人の活動を記載 | 記載しない。本人と紐づく一次根拠がない限り採用しない |
| 第三者の記事で言及されただけの内容を活動として記載 | 記載しない(`external` は補足にしかならない) |

## 出力先

**`activities.json` のみ**を編集してください。`activities.md` は CI が `activities.json` から自動生成するため、**あなたは activities.md を編集してはいけません**。

## activities.json のスキーマ

```json
{
  "meta": { "generatedAt": "YYYY-MM-DD" },
  "items": [
    {
      "id": "安定した一意のキー(英小文字とハイフン)",
      "title": "活動のタイトル",
      "date": "YYYY-MM",
      "category": "project | article | talk | package | community | milestone",
      "attribution": "author | maintainer | reviewer | derived",
      "upstream": "派生元(attribution が derived の場合は必須。例: microsoft/agent-lab)",
      "summary": "何を作り、何を解決したかの説明(1〜3文)",
      "featured": "直近の注目活動として冒頭に出す場合のみ true(任意)",
      "tech": ["使用技術", "..."],
      "evidence": [
        { "kind": "pull-request", "url": "https://github.com/7474/SRC/pull/1032" },
        { "kind": "blog", "url": "https://koudenpa.hatenablog.com/entry/..." }
      ]
    }
  ]
}
```

### featured の付け方

**直近1年以内の項目から3〜5件**に `featured: true` を付けてください。生成物の冒頭に「最近の注目活動」として要約が表示されます。

- 技術的な深さや新しさがあるものを選ぶ。単に日付が新しいだけのものは選ばない
- ブログ記事だけで埋めない。プロジェクト・パッケージから最低1件は入れる
- 付けすぎると強弱が消えるので、5件を超えないこと

### attribution の選び方

- **`author`**: 自分が作った・書いた。根拠URLの作成者が `7474` であることが必須
- **`maintainer`**: 自分のリポジトリだが、実装の主体は他者(コントリビュータやAIエージェント)
- **`reviewer`**: 設計判断・レビュー・技術選定で関与した。実装は他者
- **`derived`**: テンプレート・教材・フォークなど**他者の成果物が土台**。`upstream` に出所を必ず書く

迷ったら、より控えめな方(`author` ではなく `maintainer` / `reviewer` / `derived`)を選んでください。

### evidence の kind

**一次根拠**(これが最低1つ必要):

| kind | URL の形 | 検証内容 |
|---|---|---|
| `pull-request` | `https://github.com/{owner}/{repo}/pull/{n}` | PR の作成者が `7474` か |
| `commit` | `https://github.com/{owner}/{repo}/commit/{sha}` | コミットの author が `7474` か |
| `release` | `https://github.com/{owner}/{repo}/releases/tag/{tag}` | リリースの作成者が `7474` か |
| `repository` | `https://github.com/{owner}/{repo}` | owner が `7474` か。fork なら `derived` 必須 |
| `blog` | `https://koudenpa.hatenablog.com/entry/...` | 本人のブログのホストか |
| `slide` | `https://speakerdeck.com/7474/...` | 本人のアカウントのパスか |

**補足根拠**(これ単独では項目を成立させられない):

| kind | 用途 |
|---|---|
| `package` | nuget.org / npmjs.com / hub.docker.com の公開ページ |
| `external` | 第三者の記事・イベントページなど |

## 収集手順

### ステップ 1: GitHub の活動を収集する(最重要)

1. `7474` のパブリックリポジトリ一覧を取得する
2. 各リポジトリについて **`fork` フラグと README の出所表記を必ず確認する**
   - `fork: true` → `attribution: "derived"`、`upstream` に上流リポジトリを記載
   - `fork: false` でも、README にテンプレート・教材・チュートリアルの出所が書かれている場合は `derived` として扱う(**フォークでないことは自作の証明にならない**)
3. 主要な PR・リリースについて、**GitHub API で作成者(`user.login` / `author.login`)を確認する**
   - 作成者が `7474` でないものは `author` として書かない
   - Dependabot・renovate・Copilot などの bot が作成したものは項目にしない
4. 技術的に意味のある成果(機能実装、アーキテクチャ変更、リリース)を項目化し、根拠URLを添える

> **項目のバランス**: ブログ記事は数が多くなりがちで、記事ばかりが並ぶと一覧としての価値が下がります。記事は技術的な深さのあるものに絞り、**プロジェクト・パッケージ・登壇が記事に埋もれない**ようにしてください。

### ステップ 2: ブログ記事を収集する

`https://koudenpa.hatenablog.com/rss` などから記事を取得し、技術的な内容のものを `category: "article"` として項目化します。根拠は記事URL(`kind: "blog"`)です。ブログのホストが `koudenpa.hatenablog.com` であることが本人性の担保になります。

### ステップ 3: 外部活動を探す(慎重に)

`tavily` で登壇・スライド・パッケージ公開などを検索します。ただし:

- **`koudenpa` という名前が出てくるだけでは採用しない**。本人の GitHub・ブログ・Speaker Deck アカウントに紐づく一次根拠が取れるものだけを項目にする
- 一次根拠が取れないものは**破棄する**。「たぶん本人だろう」で書かない
- Speaker Deck は `speakerdeck.com/7474/` 配下のもののみ採用する

### ステップ 4: 検証してから書き出す

書き出す前に、各項目について自問してください。

1. この根拠URLの作成者は本当に `7474` か？(GitHub API で確認したか)
2. これは他者の成果物を土台にしていないか？(その場合 `derived` + `upstream`)
3. 一次根拠が1つ以上あるか？
4. 同名異人の可能性はないか？

### ステップ 5: PR を作成する

`activities.json` に変更がある場合のみ `create-pull-request` で PR を作成してください。

PR の説明には以下を書いてください:

- 追加・更新した項目とその根拠
- **`author` 以外の attribution にした項目と、その理由**
- 収集したが**根拠不足で破棄した候補**があれば、その旨と理由(これは有用な情報です)

変更がなければ PR を作成せず終了してください。

> CI が `activities.json` を検証し、`activities.md` を自動生成してコミットします。あなたが `activities.md` を書く必要はありません。
