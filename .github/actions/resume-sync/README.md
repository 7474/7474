# Resume Sync Action

Gitリポジトリで管理しているMarkdownの職務経歴書を、CIから求職サイトのプロフィールへ同期するGitHub Action。

現在の対応サービスは **LAPRAS** のみ(下記「求職サイトのCI対応状況」参照)。LLMを使わない決定的な同期(見出しセクションの抽出→APIへのPUT)なので、生成誤りの混入がなく冪等。

## 背景

- LAPRAS公式の [lapras-inc/resume-sync-action](https://github.com/lapras-inc/resume-sync-action) は2025年12月15日に提供終了した(LLMでMarkdownを構造化する方式だった)
- 一方でLAPRASの公開API( [lapras-inc/lapras-mcp-server](https://github.com/lapras-inc/lapras-mcp-server) が使用している `https://lapras.com/api/mcp` 配下)は現役のため、本Actionはこれを直接呼ぶ

## 同期内容

| 同期元(Markdownセクション) | 同期先(LAPRAS) | 上限 |
|---|---|---|
| `job_summary_heading` で指定した見出しのセクション(既定: `## 紹介文`) | 職務要約 `PUT /api/mcp/job_summary` | 10,000文字 |
| `want_to_do_heading` で指定した見出しのセクション(既定: `## このさきやってみたいこと`) | 今後のキャリアでやりたいこと `PUT /api/mcp/want_to_do` | 1,000文字 |
| `career_data_path` で指定したJSONの `experiences` | 職歴 `POST/PUT/DELETE /api/mcp/experiences` | 組織名+開始年月で突合し作成/更新(削除は `delete_missing_experiences: true` 時のみ) |
| 同JSONの `tech_skills` | 経験技術 `PUT /api/mcp/tech_skill` | スキル名はLAPRASマスタ(`GET /tech_skill/master`)で実行時に名前解決。経験年数は 0/1/2/3/5/10 のバケットに丸められる |

同期は**上書き**。LAPRAS側で直接編集した内容はリポジトリ側の内容で置き換えられるため、編集はリポジトリ側に一本化すること。

**APIが無くCI同期できないLAPRAS項目**(手動入力が必要): 希望年収・勤務地、学歴、ポートフォリオ連携設定。

## 使い方

```yaml
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/resume-sync   # 切り出し後: 7474/resume-sync-action@v1
        with:
          resume_path: 職務経歴.md
          lapras_api_key: ${{ secrets.LAPRAS_API_KEY }}
```

### inputs

| name | 必須 | 既定値 | 説明 |
|---|---|---|---|
| `resume_path` | ✓ | — | 職務経歴書Markdownのパス |
| `career_data_path` | | (空) | 職歴・経験技術の構造化データJSONのパス。空なら職歴・スキル同期をスキップ。フォーマットは `scripts/sync-lapras-career.mjs` 冒頭コメント参照 |
| `delete_missing_experiences` | | `false` | `true`でJSONに無いLAPRAS上の職歴を削除(既定は警告のみ) |
| `services` | | `lapras` | 同期先(カンマ区切り。現在は `lapras` のみ) |
| `lapras_api_key` | ✓(lapras時) | — | [LAPRAS APIキー](https://lapras.com/config/api-key)。Secretsに保存すること |
| `job_summary_heading` | | `紹介文` | 職務要約に同期する見出し名 |
| `want_to_do_heading` | | `このさきやってみたいこと` | やりたいことに同期する見出し名 |
| `dry_run` | | `false` | `true`でAPIを呼ばず抽出結果のみ表示 |

### セットアップ

1. https://lapras.com/config/api-key でAPIキーを発行
2. リポジトリの Settings > Secrets and variables > Actions に `LAPRAS_API_KEY` として登録
3. まず `workflow_dispatch` の `dry_run: true` で抽出結果を確認してから本同期する

## 求職サイトのCI対応状況(2026-08調査)

| サービス | CI同期 | 手段 |
|---|---|---|
| LAPRAS | ○ 可能 | 公開API(Bearerキー)。本Actionが対応。職務経歴(experiences)・テックスキルもAPIはあるが職種マスタID等の構造化が必要なため本Actionでは未対応 |
| GitHubプロフィール | ○ 可能 | プロフィールリポジトリ(このリポジトリ)自体がCI対象 |
| Findy / Forkwell | △ 間接 | 公開APIなし。GitHub連携によりリポジトリ活動が自動反映される(pushそのものが更新) |
| LAPRAS(アウトプット) | 自動 | ブログ・Qiita・Zenn・connpass等を自動クロール(連携設定のみ) |
| Wantedly | △ 限定 | [Open API](https://sg.wantedly.com/developers)はパートナー(学習サービス)向けで、スキル・資格の追加のみ。職歴・紹介文の更新APIなし |
| LinkedIn | × 実質不可 | プロフィール編集APIはパートナー制 |
| 転職ドラフト / Green / ビズリーチ / paiza / doda | × 不可 | 公開APIなし(職務経歴書ファイルの手動アップロード・AIインポートのみ) |

## リポジトリ切り出し(再利用)手順

このディレクトリは自己完結しており、他リポジトリからの再利用は以下で可能:

1. 公開リポジトリ `7474/resume-sync-action` を作成
2. このディレクトリ(`action.yml`, `scripts/`, `README.md`)の内容をそのリポジトリのルートにコピーし、タグ `v1` を付与
3. 利用側ワークフローの `uses: ./.github/actions/resume-sync` を `uses: 7474/resume-sync-action@v1` に変更

## 拡張ポイント

- LAPRASの職務経歴(experiences)・テックスキル同期: `POST/PUT /api/mcp/experiences`, `PUT /api/mcp/tech_skill`(職種マスタIDの解決と冪等なupsert設計が必要)
- 他サービス対応: `services` 入力に追加し、`scripts/sync-<service>.mjs` を実装して `action.yml` にステップを足す
