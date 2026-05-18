# Limerick — BtoB Wholesale Ordering Platform

## プロジェクト概要

卸業者・メーカーが小売業者向けに提供するBtoB発注ポータル。通常のECと異なり、締日請求・得意先別価格・掛け払いを前提とした業務システム。

Cloudflare Workers + D1 + SvelteKitで動作するコンパクトな構成を特徴とし、`wrangler deploy` 一発でデプロイ可能なOSSプロダクト。

## ポジショニング

- **ターゲット**: 中小規模の卸業者・メーカー
- **競合**: OroCommerce / Shopify Plus B2B / BigCommerce B2B（いずれも高額・重量級）
- **差別化**: Cloudflare-native・セルフホスト・OSS・シンプルな機能範囲

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend / SSR | SvelteKit (Cloudflare Pages adapter) |
| ORM | DrizzleORM |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| Session | Cloudflare KV |
| Email | アダプター形式（Resend / Amazon SES 推奨） |
| Deploy | Cloudflare Workers / Pages via Wrangler |

## ユーザーロール

| ロール | 説明 |
|---|---|
| **Supplier（サプライヤー）** | 卸業者・メーカー。システム管理者 |
| **Buyer（バイヤー）** | 小売業者・仕入担当者。サプライヤーに招待される |

## 機能スコープ（v1）

### サプライヤー側
- 商品管理（登録・編集・カテゴリ・在庫数）
- 得意先管理（登録・招待・グループ化）
- 価格設定（得意先グループ別の契約価格）
- 締日設定（得意先ごと）
- 受注管理（ステータス管理・CSV出力）
- 請求書発行（締日単位での自動集計）

### バイヤー側
- 商品カタログ閲覧（契約価格で表示）
- カート・発注
- 発注履歴・再注文
- 請求書確認・ダウンロード
- 納品ステータス確認

### システム共通
- メール通知（発注時・確認時・締日請求時）
- 日英多言語対応
- セルフホスト前提（マルチテナントなし）

## スコープ外（v1では実装しない）

- 決済連携（掛け払い前提のため不要）
- 複雑な在庫管理（ERPと連携する想定）
- 多通貨対応
- マルチテナント（1インスタンス = 1サプライヤー）

## デプロイフロー

```bash
# 初回
wrangler d1 create limerick-db
wrangler r2 bucket create limerick-storage
wrangler kv:namespace create limerick-sessions
wrangler deploy

# マイグレーション
wrangler d1 migrations apply limerick-db
```

## ディレクトリ構成（予定）

```
limerick/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/          # DrizzleORM schema・クエリ
│   │   │   ├── email/       # メールアダプター
│   │   │   └── auth/        # セッション管理
│   │   └── components/      # 共通UIコンポーネント
│   ├── routes/
│   │   ├── (supplier)/      # サプライヤー管理画面
│   │   ├── (buyer)/         # バイヤー発注画面
│   │   └── api/             # APIエンドポイント
├── drizzle/
│   └── migrations/          # D1マイグレーション
├── wrangler.toml
└── drizzle.config.ts
```
