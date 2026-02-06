# Authorization Code Flow with PKCE ハンズオン

このリポジトリは、Auth0を使用した **Authorization Code Flow with PKCE** の仕組みを、ライブラリ（SDK）を使わずに素のJavaScriptで実装し、動作原理を理解するためのハンズオン用コードです。

## 🎯 ハンズオンのゴール

1. ブラウザ上で **Code Verifier（正解）** と **Code Challenge（問題）** が生成される瞬間を見る。
2. ログイン時のリダイレクトURLに `code_challenge` が付与されていることを確認する。
3. トークン交換時に、隠し持っていた `code_verifier` が送信されていることを確認する。

---

## 🚀 事前準備 (Auth0設定)

1. **Auth0 ダッシュボード** にログイン。
2. **Applications** -> **Create Application** をクリック。
3. 名前を適当に決め（例: `PKCE Handson`）、**Single Page Web Applications** を選択して作成。
4. **Settings** タブで以下を設定:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
5. 最下部の **Save Changes** をクリック。
6. 同画面上部の **Domain** と **Client ID** をコピーしておく。

---

## ファイル構成

```
authorization-code-flow/  # このディレクトリ
├── .env                  # 設定ファイル（Auth0の情報）
├── package.json
├── server.js             # バックエンド（静的ファイル配信 & 擬似API）
├── README.md             # この手順書
└── public/
    ├── index.html        # フロントエンド画面
    └── app.js            # ★PKCEロジックの実装
├── Dockerfile            #
└── docker-compose.yml    #
```

---

## 🛠 インストールと起動

2. 設定ファイルの作成
   `.env` ファイルを作成し、Auth0の情報を書き込む。

   ```ini
   AUTH0_DOMAIN=your-tenant.jp.auth0.com
   AUTH0_CLIENT_ID=your_client_id_here
   ```

3. アプリケーションの起動

   ```bash
   docker compose up --build
   ```

4. ブラウザでアクセス
   [http://localhost:3000](http://localhost:3000)

---

## 🧪 ハンズオン手順 (ここが本番！)

**⚠️ ボタンを押す前に、必ず Chrome DevTools を開いてください！**

### ステップ 0: 観測準備

1. `F12` キーで DevTools を開く。
2. **Network** タブを開く。
3. **Preserve log (ログを保持)** にチェックを入れる（超重要）。
   - ※これがないとリダイレクト時にログが消えます。
4. フィルタ欄に `authorize` と入力しておく。

### ステップ 1: 問題提出 (Login)

1. 画面上の **「Login with Auth0 (PKCE)」** ボタンをクリック。
2. Auth0のログイン画面に遷移したら、**操作を止めて** Networkログを確認。
3. `authorize?...` というリクエストをクリックし、**Payload** (または Headers) タブを見る。
   - `code_challenge`: 文字列が存在することを確認（これが「問題」！）。
   - `code_challenge_method`: `S256` になっていることを確認。

### ステップ 2: 引換券の受け取り

1. DevToolsのフィルタを `token` に書き換える。
2. Auth0画面でログイン（ユーザー名/パスワード入力）を完了させる。
3. アプリ画面に戻ってくる（URLに `code=...` が付いている）。

### ステップ 3: トークン交換 (Exchange)

アプリに戻った瞬間、自動的にトークン交換処理が走ります。
Networkタブに表示された `token` (POST) リクエストをクリックし、**Payload** を確認。

- `grant_type`: `authorization_code`
- `code`: URLから取得した引換券
- `code_verifier`: **★ここ注目！** ステップ1で送った「問題」の元ネタ（正解）がここで送信されています。

### ステップ 4: APIコール

トークン取得に成功すると、画面に `Access Token` が表示されます。
「Call API」ボタンを押して、バックエンドからデータを取得できるか試してみましょう。

---

## 🧠 学びのポイント

ソースコードの `public/app.js` を見てください。通常は SDK が隠蔽している以下の処理を自力で行っています。

1. **`generateCodeVerifier()`**: ランダムな文字列（正解）を作成。
2. **`generateCodeChallenge()`**: 正解を SHA-256 でハッシュ化（問題）を作成。
3. **`sessionStorage`**: リダイレクト中も「正解」を忘れないように一時保存。
