# Limerick — 詳細設計

## 認証・セッション

- セッションIDはCookieに保存（HttpOnly・Secure）
- バイヤーはサプライヤーから招待メールを受け取り、初回ログイン時にパスワードを設定
- パスワードはbcryptでハッシュ化

### 招待フロー

```
サプライヤーが得意先を登録
→ 招待トークン生成（KVに保存、有効期限24h）
→ 招待メール送信
→ バイヤーがリンクを開きパスワード設定
→ アカウント有効化
```

## 価格モデル

得意先をグループに分けて、グループごとに商品の契約価格を設定する。

```
PriceGroup（価格グループ）
  └── 複数のBuyer（得意先）が属する
  └── 商品ごとにGroupPriceを持つ

表示価格の決定順:
  1. GroupPrice が存在すればその価格
  2. なければ商品のデフォルト価格（base_price）
```

バイヤーが複数のグループに属するケースは持たない（1バイヤー = 1グループ）。

## 締日・請求モデル

得意先ごとに締日（1〜31日）を設定する。

```
締日設定例: 毎月20日締め → 翌月末払い

集計ロジック:
  - 前回締日の翌日〜今回締日 の受注を集計
  - 集計結果からInvoiceを生成
  - バイヤーにメール通知
```

Invoiceは手動生成（サプライヤーが締日に実行）または自動生成（Cron Triggers）。  
v1では手動生成から始める。

## 受注ステータス

```
pending     → 受注済み（バイヤーが発注、サプライヤー未確認）
confirmed   → 確認済み（サプライヤーが確認）
shipped     → 出荷済み
completed   → 完了（バイヤーが受領確認）
cancelled   → キャンセル
```

## メールアダプター

環境変数でプロバイダーを切り替える。

```typescript
// src/lib/server/email/index.ts
interface EmailAdapter {
  send(to: string, subject: string, html: string): Promise<void>
}

// 環境変数: EMAIL_PROVIDER=resend | ses | smtp
```

各プロバイダーの実装をアダプターとして差し込む形にする。  
v1ではResendを推奨実装として提供する。

## ファイル管理

商品画像はCloudflare R2に保存。

```
R2バケット構成:
  limerick-storage/
    └── products/{product_id}/{filename}
```

アップロードはWorkers経由（R2への直接アップロードは行わない）。  
画像URLはR2のパブリックアクセスを使用する（またはWorkers経由で配信）。

## 多言語対応

SvelteKitのi18n対応はParaglideJSを使用する予定。

- デフォルト言語: 日本語（ja）
- 対応言語: 英語（en）
- URLベース: `/en/...` / `/ja/...`

## セキュリティ

- CSRF対策: SvelteKit標準のCSRF保護を使用
- SQLインジェクション: DrizzleORMのパラメータバインディングで防止
- XSS: SvelteのHTMLエスケープ（デフォルト）
- レート制限: Cloudflare WAFのレート制限ルールを推奨（Workers側では実装しない）
- 招待トークン: 暗号論的乱数（crypto.randomUUID）

## API設計

SvelteKitのServer Actionsを基本とし、データ取得はload関数を使用する。  
外部API連携が必要な箇所のみ `/api/` エンドポイントを設ける。

### エンドポイント一覧（主要）

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/setup-password      # 招待からの初回パスワード設定

# サプライヤー側（認証必須）
GET  /supplier/dashboard
GET  /supplier/products
POST /supplier/products            # 商品登録 (Action)
GET  /supplier/orders
POST /supplier/orders/[id]/confirm # 受注確認 (Action)
GET  /supplier/buyers
POST /supplier/buyers/invite       # 招待 (Action)
GET  /supplier/invoices
POST /supplier/invoices/generate   # 請求書生成 (Action)

# バイヤー側（認証必須）
GET  /buyer/catalog
GET  /buyer/cart
POST /buyer/cart/checkout          # 発注 (Action)
GET  /buyer/orders
GET  /buyer/invoices
```
