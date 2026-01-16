# 構成

```
handson/
├── .env.sample # Auth0・DB 設定
├── docker-compose.yml # コンテナ定義
├── db/
│ └── init.sql # DB 初期化 SQL
├── api/ # Node.js API
│ ├── Dockerfile
│ ├── package.json
│ └── server.js
├── frontend/ # React 確認用画面
│ ├── Dockerfile
│ ├── package.json
│ ├── index.html
│ ├── vite.config.js
│ └── src/
│ ├── main.jsx
│ └── App.jsx
└── m2m-client/ # 実行用スクリプト
├── package.json
└── client.js
```

# Auth0 設定手順ガイド (Client Credentials Flow)

## Step 1: API (Resource Server) の登録

> ![NOTES]
> 事前に Auth 0 へのサインアップが必要です。

API サーバー（保護される側）を Auth0 に登録します。

1.  **APIs 画面へ移動**
    - Auth0 ダッシュボード左メニュー： [Applications] > [APIs] を選択。
2.  **API の新規作成**
    - 右上の [+ Create API] ボタンをクリック。
3.  **情報の入力**
    - **Name**: `My Todo API`
    - **Identifier**: `http://localhost:3001`
      - ※重要：この値が `.env` の `AUTH0_AUDIENCE` になります。
    - **Signing Algorithm**: `RS256` (デフォルト)
4.  **保存**
    - [Create] をクリック。

---

## Step 2: Application (Client) の登録

スクリプト（アクセスする側）の認証情報を作成します。

1.  **Applications 画面へ移動**
    - 左メニュー： [Applications] > [Applications] を選択。
2.  **アプリの新規作成**
    - 右上の [+ Create Application] をクリック。
3.  **情報の入力**
    - **Name**: `M2M Client App`
    - **Application Type**: `Machine to Machine Applications` を選択。
4.  **API の選択**
    - `My TODO API` を選択
5.  **保存**
    - [Authorize] をクリック。

---

## Step 4: 認証情報の取得と .env への反映

プログラムに設定するための情報をコピーします。

**コピー元（Auth0 ダッシュボード）**

1.  **Applications 画面へ移動**
    - 左メニュー： [Applications] > [Applications] を選択。
2.  **対象 API の選択**
    - `M2M Client App` を選択し Settings タブに記載されている Domain, Client ID, Client Secret を確認

**コピー先（handson ディレクトリ内）**

1.  **.env.sample** を **.env** にリネームしてください
2.  **Auth0 ダッシュボードに表示されている以下の値を .env ファイルに転記する**
    - **Domain** → `AUTH0_DOMAIN`
    - **Client ID** → `AUTH0_CLIENT_ID`
    - **Client Secret** → `AUTH0_CLIENT_SECRET`

---

<br>

# Auth0 Client Credentials Flow ハンズオン実行ガイド

## Step 1. アプリケーションの起動

ターミナルでプロジェクトルート (handson) へ移動し、以下のコマンドを実行します。

```bash
docker-compose up -d
```

> **起動するサービス:**
>
> - **API (Port 3001):** Resource Server（トークンを検証するサーバー）
> - **Frontend (Port 5173):** 結果確認用のダッシュボード
> - **DB (Port 5432):** PostgreSQL

## Step 2: ダッシュボードの確認

ブラウザで以下の URL を開きます。
**URL:** [http://localhost:5173](http://localhost:5173)

初期データ（または空のリスト）が表示されていることを確認してください。この画面は 2 秒ごとに自動更新されます。

## Step 3: M2M スクリプトの実行

別のターミナルを開き、クライアントディレクトリへ移動してスクリプトを実行します。

```bash
cd m2m-client
npm install
node client.js
```

**成功時のログ:**

1. `✅ Token Acquired`: Auth0 から JWT を取得成功
2. `✅ API Success`: 取得したトークンを使って API への書き込み成功

## Step 4: 結果の反映を確認

ブラウザ（Dashboard）に戻り、新しい Todo が追加されていることを確認してください。

---

## Step5. 署名検証のエラーを体験する

アクセストークンをわざと書き換えて、API サーバーが不正なアクセスを拒否する様子を確認します。

1. m2m-client/client.js の 31 行目から 35 行目のコメントアウトを外してください
   ```
   const accessToken = tokenResponse.data.access_token.slice(0, -1) + "[";
   console.log(
     `\nOriginal Access Token: \n${tokenResponse.data.access_token} \n`
   );
   console.log(`Updated Access Token: \n${accessToken}\n`);
   ```
2. m2m-client/client.js の 37 行目から 39 行目をコメントアウトしてください
   ```
   // const accessToken = tokenResponse.data.access_token;
   // console.log("✅ Access Token acquired!");
   // console.log("Token:", accessToken); // デモなので全て表示
   ```
3. M2M スクリプトを実行します

**期待される結果:**

- レスポンスとして **`HTTP/1.1 401 Unauthorized`** が返ってきます。
- API サーバーは、数学的に署名が一致しないことを検知し、DB 処理を行う前にリクエストを遮断しました。

---

## 5. 後片付け

ハンズオン終了後は、以下のコマンドでコンテナを停止・削除してください。

```bash
docker-compose down
```

---

# Scope の実装ハンズオン実行ガイド

## Step 1: Auth0 Dashboard 設定

1.  **Permissions の定義:**
    - `Applications` > `APIs` > 作成した API (`My Todo API`) を選択。
    - `APIs` タブへ移動。
    - `My Todo API`を選択。
    - `Permissions` タブへ移動。
    - 以下を追加して `Add`。
      - Permission: `read:todos`, Description: `Read access`
      - Permission: `create:todos`, Description: `Create access`
2.  **M2M アプリへの許可:**
    - 同画面の `Machine to Machine Applications` タブへ移動。
    - 作成したアプリ (`M2M Client App`) の行にある `∨` (展開ボタン) をクリック。
    - Permissions の `read:todos` にのみチェックを入れる。
    - `Update` をクリックして保存。

## Step 2: M2M スクリプトの修正

```javascript
// 1. Auth0からアクセストークンを取得 (Client Credentials Flow)
const tokenResponse = await axios.post(
  `https://${DOMAIN}/oauth/token`,
  {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: AUDIENCE,
    grant_type: "client_credentials",
    scope: "read:todos", // 👈 ここから以下を追加
  },
  {
    headers: { "content-type": "application/json" },
  }
);

// (...get token)

// 読み取り (GET) -> 成功するはず
console.log("Testing Read Access...");
const getResponse = await axios.get("http://localhost:3001/todos", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
console.log("📦 GET Success:", getResponse.data);
```

## Step 3: API Server コードの修正 (api/server.js)

requiredScopes をインポートし、POST メソッドに適用します。

```javascript
// 1. requiredScopes を追加でインポート

const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
// ... (app setup)

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

// 2. スコープチェック用ミドルウェアを定義
const checkCreateScope = requiredScopes("create:todos");

// 3. POSTメソッドに checkCreateScope を追加
//    checkJwt (認証) -> checkCreateScope (認可) の順で実行されます
app.post("/todos", checkJwt, checkCreateScope, (req, res) => {
  console.log("📝 Creating a todo...");
  res.json({ message: "Todo created!" });
});

// GETメソッドはScopeチェックなし（または read:todos を付けてもOK）
app.get("/todos", checkJwt, (req, res) => {
  res.json([{ id: 1, title: "Learn OAuth Scope" }]);
});

// ... (listen)
```

## Step 4: M2M スクリプトの実行

別のターミナルを開き、クライアントディレクトリへ移動してスクリプトを実行します。

```bash
cd m2m-client
npm install
node client.js
```

**期待される結果:**

- レスポンスとして **`HTTP/1.1 403 Unauthorized`** が返ってきます。
- API サーバーは、数学的に署名が一致しないことを検知し、DB 処理を行う前にリクエストを遮断しました。

## Step 5: M2M スクリプトの修正（m2m-client/client.js）

token リクエストのパラメタに `scope: "create:todos"` を追加します

```javascript
const tokenResponse = await axios.post(
  `https://${DOMAIN}/oauth/token`,
  {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: AUDIENCE,
    grant_type: "client_credentials",
    scope: "read:todos create:todos", // 👈 【変更点】書き込み権限を要求する
  },
  {
    headers: { "content-type": "application/json" },
  }
);
```

## Step 6: M2M スクリプトの再実行

別のターミナルから M2M スクリプトを再実行します。

```bash
node client.js
```

**期待される結果:**

- 書き込み成功のログが表示されます。

---

# 💡 トラブルシューティング

- **401 Unauthorized**: `.env` の `AUTH0_DOMAIN` や `AUTH0_AUDIENCE` が間違っている（末尾のスラッシュの有無など）。
- **403 Forbidden**: Auth0 設定手順ガイド (Client Credentials Flow) Step 3 の **Authorized** スイッチが ON になっていない。
- **Token 取得エラー**: `Client ID` または `Client Secret` が間違っている。
