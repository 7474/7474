# プロジェクト & 活動ハイライト

> このページは GitHub Actions ワークフローにより自動生成されます。  
> 最終更新: 2026-04-02 22:37 JST  
> 収集期間: 全履歴（初回）

7474 (koudenpa) のプロジェクト成果・技術スキル・活動ハイライトをまとめたポートフォリオです。  
GitHub リポジトリの深い分析・Web 上の活動から自動構成されています。

---

## 🔥 最近の注目活動

### gh-aw-compile-action — GitHub Agentic Workflows の CI 自動化 Action（2026-04）
GitHub Agentic Workflows の `.md` ファイルに変更があった際、`gh aw compile` を自動実行して `.lock.yml` を生成する GitHub Action を作成・公開。AI エージェントを活用した開発ワークフローの自動化を実現している。

### SRC v0.5.0 リリース — Copilot Coding Agent による移植加速（2026-02）
SRC#（Simulation RPG Construction Sharp）の v0.5.0 をリリース。.NET 8 対応に加え、**GitHub Copilot Coding Agent を活用した移植作業の進行**が最大のトピック。大規模レガシーコードベースの C# 移植において AI 支援開発を積極的に導入したマイルストーンとなった。

### shumilog — Cloudflare エッジスタックで趣味ログアプリを本番運用（2025-09〜2026-03）
趣味コンテンツのログ記録アプリ `shumilog.dev` を Cloudflare Workers + D1 + R2 + React 19 + Tailwind CSS 4 のフルスタック構成で構築・運用。OpenAPI ファーストの開発フロー（仕様 → コントラクトテスト → 実装）と、フロントエンドの型定義自動生成による **API 仕様と実装の乖離を CI で防ぐ仕組み**を導入した。

### cut-in-killer — 物理エンジン搭載の Web ゲームをリリース（2026-01）
駅ホームを舞台にした割り込み排除カジュアルゲームを HTML5 Canvas + Matter.js（2D 物理エンジン）で実装し GitHub Pages で公開。逆二乗則による群衆シミュレーション、モバイルタッチ操作対応、60FPS パフォーマンス最適化など、ゲームロジックと物理演算の組み合わせに挑戦した。

---

## 🎯 主要プロジェクト

### SRC# — Simulation RPG Construction の C# .NET 移植
- **概要**: 2000 年代の VB 製シミュレーション RPG エンジン「SRC」を C# / .NET へ移植するプロジェクト。GPL-3.0 ライセンスのオリジナルを継承し、.NET Standard / .NET 8 対応のコアライブラリ（SRCCore）、Windows Forms 実装（SRC#Form）、Blazor WebAssembly 実装、データ検証ツール（SRCDataLinter）など複数コンポーネントで構成される。
- **技術スタック**: C# / .NET 8, .NET Standard 2.1, Windows Forms, Blazor WebAssembly, Docker, GitHub Actions, Terraform
- **主な成果**:
  - v0.1 〜 v0.5 まで継続リリース（2021〜2026 年）
  - SRCDataLinter を Docker Image（`koudenpa/srcdatalinter`）と GitHub Marketplace Action（`7474/SRC-DataLinter`）として公開
  - Blazor WebAssembly でブラウザ上での SRC データ閲覧を実現
  - Copilot Coding Agent を活用した大規模レガシーコードの AI 支援移植（v0.5.0）
  - 3,000 コミット超の継続的な開発・リファクタリング
- **リンク**: [リポジトリ](https://github.com/7474/SRC) | [リリース](https://github.com/7474/SRC/releases) | [ヘルプサイト](https://srch.7474.jp/)
- ⭐ 11

### NantoNBai — Azure Functions × PowerPoint で「N 倍グラフ」を API 化
- **概要**: はてな技術発表で話題になった「N 倍グラフ」スタイルの画像を URL パラメータで動的生成する Azure Functions アプリ。「オフィスソフトで雑に作った感」を再現するため、PowerPoint ファイルをサーバー上で生成し画像変換するという独創的なアーキテクチャを採用した。
- **技術スタック**: C# / .NET 8, Azure Functions, Azure CDN (Front Door), ShapeCrawler（PPTX 生成）, Spire.Presentation（PPTX→画像変換）, Swagger
- **主な成果**:
  - `n-bai.koudenpa.dev` として本番稼働
  - E2E テスト（GitHub Actions）による品質保証
  - Azure CDN キャッシュで低コスト・高速配信を実現
  - OpenXML SDK の難解さを克服し、高レベルライブラリで解決した技術的判断
- **リンク**: [リポジトリ](https://github.com/7474/NantoNBai) | [API Spec](https://n-bai.koudenpa.dev/api/swagger/ui)
- ⭐ 4

### shumilog — Cloudflare エッジスタック全活用の趣味ログ Web アプリ
- **概要**: アニメ・ゲーム・音楽など趣味コンテンツの記録・共有サービス。Cloudflare のエッジインフラ（Workers / D1 / R2）を全面採用し、サーバーレスで運用コストを抑えながら本番稼働させている。
- **技術スタック**: TypeScript 5.9+, Cloudflare Workers, Hono, Cloudflare D1（SQLite）, Cloudflare R2, React 19, Vite 7, Tailwind CSS 4.1, shadcn/ui, Vitest, OpenAPI 3.0
- **主な成果**:
  - `shumilog.dev` として本番運用中
  - OpenAPI ファースト開発フロー（仕様→コントラクトテスト→実装）を確立
  - フロントエンドの TypeScript 型定義を OpenAPI から自動生成し、仕様との乖離を CI で検知
  - バックエンド・フロントエンドそれぞれに独立した CI/CD パイプライン
- **リンク**: [リポジトリ](https://github.com/7474/shumilog) | [運用サイト](https://shumilog.dev/)

### cut-in-killer — 物理エンジン搭載の駅ホーム割り込み排除 Web ゲーム
- **概要**: 日本の駅ホームを舞台に、列車降車後に割り込もうとする赤いモブを排除し、行儀の良い青いモブを安全に退出させるカジュアルゲーム。Matter.js の 2D 物理エンジンを活用したリアルな群衆シミュレーションが特徴。
- **技術スタック**: Vanilla JavaScript, HTML5 Canvas, Matter.js v0.20.0（物理エンジン）, CSS3, LocalStorage
- **主な成果**:
  - 新宿・渋谷・東京の 3 マップを実装
  - 逆二乗則による群衆の自然な反発・回避動作を物理演算で実現
  - タッチ操作最適化でモバイルフレンドリーを達成
  - GitHub Pages で公開（サーバー不要）
- **リンク**: [リポジトリ](https://github.com/7474/cut-in-killer) | [プレイ](https://7474.github.io/cut-in-killer/)

### text2image — Markdown をそのまま SNS 投稿画像に変換するブラウザツール
- **概要**: Markdown テキストを GitHub Flavored Markdown としてレンダリングし、クリップボードにコピーまたはダウンロードできる完全クライアントサイドの Web ツール。Twitter/X 投稿用の最適サイズ出力と長文の自動分割機能を備える。
- **技術スタック**: HTML, Vanilla JavaScript, Marked.js, html2canvas, Clipboard API
- **主な成果**:
  - 外部サーバー不要のフル クライアントサイド処理
  - 日本語・中国語・韓国語のマルチバイト文字対応
  - 長文テキストの複数画像への自動分割
- **リンク**: [リポジトリ](https://github.com/7474/text2image) | [使う](https://7474.github.io/text2image/)

### JITECKakomon — 情報処理技術者試験過去問 PDF を Azure Functions で問題単位に変換
- **概要**: JITEC（情報処理推進機構）が公開する過去問 PDF を読み込み、1 問ずつ画像化して活用するツール。Azure Functions でバックエンド処理を担い、Web Viewer でブラウザから過去問を確認できる。
- **技術スタック**: C# / .NET, Azure Functions
- **リンク**: [リポジトリ](https://github.com/7474/JITECKakomon)

---

## 🛠 技術スキル（リポジトリ分析に基づく）

| カテゴリ | 技術 | 実績の根拠 |
|---------|------|-----------|
| 言語 | C# | SRC#（3,000+コミット）、NantoNBai、JITECKakomon |
| 言語 | TypeScript | shumilog（Cloudflare Workers + React）|
| 言語 | JavaScript | cut-in-killer（Matter.js 物理ゲーム）、text2image |
| フレームワーク | .NET 8 / .NET Standard 2.1 | SRC#（SRCCore）、NantoNBai |
| フレームワーク | Blazor WebAssembly | SRC#（SRCTestBlazor）|
| フレームワーク | React 19 | shumilog フロントエンド |
| フレームワーク | Hono | shumilog バックエンド（Cloudflare Workers） |
| クラウド | Azure Functions | NantoNBai、JITECKakomon |
| クラウド | Azure CDN / Front Door | NantoNBai（キャッシュ・配信層） |
| クラウド | Cloudflare Workers | shumilog（サーバーレス API） |
| クラウド | Cloudflare D1 / R2 | shumilog（DB・オブジェクトストレージ） |
| DevOps | GitHub Actions | SRC#（CI/CD・リリース）、NantoNBai（E2E）、shumilog（CI/CD） |
| DevOps | Docker | SRC-DataLinter（Docker Hub: `koudenpa/srcdatalinter`） |
| DevOps | Terraform | SRC#（インフラ管理） |
| テスト | Vitest（コントラクトテスト） | shumilog（OpenAPI 検証付きコントラクトテスト） |
| API 設計 | OpenAPI 3.0 | shumilog（API ファースト開発）、NantoNBai（Swagger） |
| ゲーム開発 | Matter.js（2D 物理エンジン） | cut-in-killer |
| インフラ | Terraform | SRC#（Azure インフラ） |

---

## 📝 技術発信

### ブログ（koudenpa.hatenablog.com）
*※ 収集時点でブログサーバーへの接続ができなかったため、記事一覧の取得は次回更新時に再試行します。*

---

## 🌐 その他の活動

### GitHub Marketplace — SRC-DataLinter Action 公開
SRC ゲームデータのバリデーションを自動化する GitHub Marketplace Action を公開。リポジトリオーナーが SRC シナリオのデータ品質を CI で担保できるツールキットとして提供している。

### Docker Hub — `koudenpa/srcdatalinter` 公開
SRCDataLinter を Docker イメージとして Docker Hub に公開。`koudenpa/srcdatalinter` として誰でも pull して利用可能。

---

## 📅 過去の主要マイルストーン

| 時期 | マイルストーン |
|------|-------------|
| 2026-04 | gh-aw-compile-action 公開（Agentic Workflows CI 自動化） |
| 2026-02 | SRC v0.5.0 リリース（.NET 8 + Copilot Coding Agent 活用） |
| 2025-09 | shumilog 開発開始（Cloudflare エッジスタック、shumilog.dev 本番運用） |
| 2026-01 | cut-in-killer 公開（Matter.js 物理ゲーム）|
| 2026-01 | text2image 公開（Markdown → SNS 画像変換ツール） |
| 2023-09 | NantoNBai 公開（Azure Functions × PowerPoint で N 倍グラフ API 化）|
| 2022-07 | SRC v0.3.1 リリース（DATALinter データ処理順改善） |
| 2021-11 | SRC v0.3.0 リリース（.NET 5 → .NET 6 アップグレード） |
| 2021-05 | SRC v0.2.0 リリース（SRC# 最初期の安定リリース） |
| 2021-03 | SRC# 開発開始・リポジトリ公開（VB→C# 移植プロジェクト着手） |
