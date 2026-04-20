# プロジェクト & 活動ハイライト

> このページは GitHub Actions ワークフローにより自動生成されます。  
> 最終更新: 2026-04-20 21:42 JST  
> 収集期間: 全履歴（ブログ記事・新規リポジトリ追加）

7474 (koudenpa) のプロジェクト成果・技術スキル・活動ハイライトをまとめたポートフォリオです。  
GitHub リポジトリの深い分析・Web 上の活動から自動構成されています。

---

## 🔥 最近の注目活動

### phpMyAdmin を AWS Lambda Function URL で低コスト運用（2026-04）
App Runner で運用していた phpMyAdmin を AWS Lambda + Lambda Web Adapter 構成に移行。Lambda の読み取り専用ファイルシステム制約、Apache の起動ユーザー問題（`getpwnam` が NULL を返す環境への対応）、amd64/arm64 両対応のマトリクスビルドなど、Lambda 特有のハマりどころを実際に踏んで解決したリポジトリ（`php-my-admin-lambda-web-adapter`）とブログ記事として公開した。

### Azure CDN 廃止を機に趣味拠点を AWS CloudFront へ完全移行（2026-04）
Azure CDN が予定より早く「証明書更新停止」の通告を受け、急遽 AWS CloudFront への移行を実施。運用している NantoNBai（N 倍グラフ API）の CDN 層を Azure から AWS へ切り替え、クラウドベンダーロックインへの依存を低減した。

### gh-aw-compile-action — GitHub Agentic Workflows の CI 自動化 Action（2026-04）
GitHub Agentic Workflows の `.md` ファイルに変更があった際、`gh aw compile` を自動実行して `.lock.yml` を生成する GitHub Action を作成・公開。AI エージェントを活用した開発ワークフローの自動化を実現している。

### SRC v0.5.0 リリース — Copilot Coding Agent による移植加速（2026-02）
SRC#（Simulation RPG Construction Sharp）の v0.5.0 をリリース。.NET 8 対応に加え、**GitHub Copilot Coding Agent を活用した移植作業の進行**が最大のトピック。大規模レガシーコードベースの C# 移植において AI 支援開発を積極的に導入したマイルストーンとなった。

### VPS10年物Laravelアプリを生成AI活用でAWSサーバーレスへ移行（2026-03）
LAMP スタック（Laravel 5）で VPS 1 台で動いていた 10 年物の Web アプリを、生成 AI の力を借りながら AWS サーバーレス（Laravel 12 on App Runner）へ移行。「億劫だった作業が生成 AI なら手間をかけずに実現できる」という仮説を実証した記事として、はてなブックマークで注目を集めた。

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
- ⭐ 12

### NantoNBai — Azure Functions × PowerPoint で「N 倍グラフ」を API 化
- **概要**: はてな技術発表で話題になった「N 倍グラフ」スタイルの画像を URL パラメータで動的生成する Azure Functions アプリ。「オフィスソフトで雑に作った感」を再現するため、PowerPoint ファイルをサーバー上で生成し画像変換するという独創的なアーキテクチャを採用した。
- **技術スタック**: C# / .NET 8, Azure Functions, AWS CloudFront（CDN）, ShapeCrawler（PPTX 生成）, Spire.Presentation（PPTX→画像変換）, Swagger
- **主な成果**:
  - `n-bai.koudenpa.dev` として本番稼働
  - E2E テスト（GitHub Actions）による品質保証
  - 2026-04: Azure CDN 廃止通告を受け AWS CloudFront へ CDN 層を移行
  - OpenXML SDK の難解さを克服し、高レベルライブラリで解決した技術的判断
- **リンク**: [リポジトリ](https://github.com/7474/NantoNBai) | [API Spec](https://n-bai.koudenpa.dev/api/swagger/ui)
- ⭐ 4

### php-my-admin-lambda-web-adapter — phpMyAdmin を AWS Lambda Function URL で運用
- **概要**: AWS App Runner で運用していた phpMyAdmin を、Lambda Web Adapter を用いて Lambda Function URL 上で動かす構成に移行したプロジェクト。Lambda 特有の制約（読み取り専用ファイルシステム・起動ユーザー問題・アーキテクチャ対応）を実装で解決した実践リポジトリ。
- **技術スタック**: PHP, phpMyAdmin, AWS Lambda, Lambda Web Adapter, AWS CloudFront, Docker（amd64/arm64 マトリクスビルド）
- **主な成果**:
  - CloudFront → Lambda Function URL → Lambda (phpMyAdmin + Apache) のサーバーレス構成を実現
  - Lambda 読み取り専用 FS 制約への対処（Apache PID/Lock・PHP セッション・TempDir を全て `/tmp` にリダイレクト）
  - `getpwnam("www-data")` が NULL を返す環境での Apache 起動失敗を数値 UID/GID 指定で回避
  - amd64 / arm64 両対応: `arm64v8/phpmyadmin` ベースイメージを利用したマトリクスビルド
  - OCI マニフェスト問題（`provenance: false` 必須）を発見・対処
- **リンク**: [リポジトリ](https://github.com/7474/php-my-admin-lambda-web-adapter)

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
| クラウド | AWS CloudFront | NantoNBai（CDN 層移行）、php-my-admin-lambda-web-adapter |
| クラウド | AWS Lambda / Lambda Web Adapter | php-my-admin-lambda-web-adapter（phpMyAdmin サーバーレス運用） |
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

#### 生成AI活用

- [Webサービス開発に生成AIが入り込んできている例](https://koudenpa.hatenablog.com/entry/2026/03/29/225222)（2026-03-29）— 副業で関わる中小 Web サービスの開発現場に生成 AI が浸透してきた現状を記録
- [VPS1台で動いていたLAMPなLaravel5をServerlessなLaravel12にした](https://koudenpa.hatenablog.com/entry/2026/03/24/015051)（2026-03-24）— 10 年物の VPS Laravel アプリを生成 AI 活用で AWS サーバーレス（Laravel 12）に移行した実践記録
- [この半年の生成AIの仕事ぶりの成長に感動した](https://koudenpa.hatenablog.com/entry/2026/02/25/133045)（2026-02-25）— Copilot Coding Agent を使った SRC# 移植進行の棚卸しと、モデル世代差への感動
- [GitHub Copilot coding agentにWebサービスを作ってもらう](https://koudenpa.hatenablog.com/entry/2025/10/15/225935)（2025-10-15）— shumilog を Copilot Coding Agent に作ってもらった経緯と所感
- [生成AI仕様駆動開発所感](https://koudenpa.hatenablog.com/entry/2025/09/29/232730)（2025-09-29）— GitHub Spec Kit を使った仕様駆動開発の使い心地（遅い・トークン消費大など）を記録
- [生成AIにプラモの塗装プランを作ってもらう](https://koudenpa.hatenablog.com/entry/2025/09/21/215604)（2025-09-21）— 趣味のプラモデル塗装に生成 AI を活用する実験
- [AWSコンソールにくっついているQが結構よい](https://koudenpa.hatenablog.com/entry/2025/09/15/002508)（2025-09-15）— AWS コンソールに統合された生成 AI「Q」の使い心地レポート
- [生成AIは電脳執事の夢を見るか？](https://koudenpa.hatenablog.com/entry/2025/07/26/024536)（2025-07-26）— Gemini に相談を重ねる中で感じた、電脳執事実現への期待と危惧
- [生成AIに工数を入力させるのが局地的に流行っていた](https://koudenpa.hatenablog.com/entry/2025/06/06/214831)（2025-06-06）— 生成 AI に勤怠ツールへの工数入力を委ねる試みの記録

#### インフラ・クラウド・運用

- [Azure嫌になっちまったな —— 趣味の拠点をAWS CloudFrontへ移す話](https://koudenpa.hatenablog.com/entry/2026/04/10/094719)（2026-04-10）— Azure CDN の証明書更新停止通告を受け、趣味プロジェクト（NantoNBai 等）の CDN 層を AWS CloudFront へ移行した実録
- [phpMyAdminをAWSのLambda関数URLで動かす](https://koudenpa.hatenablog.com/entry/2026/04/06/105622)（2026-04-06）— App Runner から Lambda Function URL へ phpMyAdmin を移行した際の技術的ハマりどころと解決策
- [Aurora for MySQL r6g to r8g のパフォーマンス変化例](https://koudenpa.hatenablog.com/entry/2026/04/04/202642)（2026-04-04）— Aurora インスタンス世代（r6g→r8g）アップグレードによるパフォーマンス変化の実測記録
- [見せてもらおうか、RDSのBlue/Greenデプロイの性能とやらを](https://koudenpa.hatenablog.com/entry/2026/01/28/235749)（2026-01-28）— RDS Blue/Green Deployments の 5 秒未満ダウンタイムを自ら検証した実録
- [Laravel LighthouseのGraphQLをOpenTelemetryトレース](https://koudenpa.hatenablog.com/entry/2025/03/23/203242)（2025-03-23）— Laravel + Lighthouse の GraphQL サーバーに OpenTelemetry トレースを導入した手順
- [PHPを運用するときはOPcacheを有効にしておけ](https://koudenpa.hatenablog.com/entry/2025/02/23/225354)（2025-02-23）— OPcache 有効化の実践と設定値・運用状況の記録
- [CloudWatchメトリクスの歩き方](https://koudenpa.hatenablog.com/entry/2025/01/02/000000)（2025-01-02）— はてなエンジニア Advent Calendar 2024 寄稿。CloudWatch の効果的な活用法をまとめた
- [AzureというかMicrosoftの魅力というか強みというか](https://koudenpa.hatenablog.com/entry/2024/09/01/082256)（2024-09-01）— .NET との深い統合など、クラウド単体ではなくエコシステムとしての Azure を語る
- [AWS Parameters and Secrets Lambda Extension vs AWS SDK](https://koudenpa.hatenablog.com/entry/2024/08/30/001018)（2024-08-30）— Lambda から Secrets Manager を参照する 2 手法を比較検証（結論: AWS SDK の圧勝）
- [Application Insightsのアップグレード体験はすこぶる良かった](https://koudenpa.hatenablog.com/entry/2024/08/04/004157)（2024-08-04）— Azure App Service 上の .NET アプリで Application Insights をアップグレードした体験記
- [Mackerelの式グラフで前日比とか先週比とかを眺める](https://koudenpa.hatenablog.com/entry/2024/06/25/204211)（2024-06-25）— Mackerel の式グラフ機能で曜日別負荷傾向を可視化する方法の紹介
- [実録Aurora Serverless v2はコスト最適化の夢を見るか？](https://koudenpa.hatenablog.com/entry/2024/05/24/235244)（2024-05-24）— オンデマンド Aurora を Serverless v2 に切り替えてコスト最適化を試みた実録

#### Webサービス設計・開発

- [中小塩漬けWebサービスの今後とか、ソフトウェアのアップグレード戦略とか](https://koudenpa.hatenablog.com/entry/2024/09/08/223459)（2024-09-08）— 中小規模サービスを長期維持するためのアップグレード戦略の考察

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
| 2026-04 | NantoNBai CDN 層を Azure CDN から AWS CloudFront へ移行 |
| 2026-04 | php-my-admin-lambda-web-adapter 公開（phpMyAdmin on Lambda Function URL）|
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
