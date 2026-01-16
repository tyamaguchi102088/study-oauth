name: inverse
layout: true
class: center, middle, inverse

---

# Scope

## Step 2: Scope（スコープ）で権限を操る

---

layout: false

## 本日のゴール

1.  **「マスターキー」からの脱却**
    - 「何でもできるトークン」のリスクを理解する。
2.  **Scope（スコープ）の概念理解**
    - トークンに「できること」を書き込む仕組み。
3.  **ハンズオン実装**
    - 「読み取り専用」トークンを作り、書き込みリクエストを拒否させる。

---

## 現状の課題：マスターキー問題

前回、サーバー間通信の基本を学んだ際に取得したトークン（鍵）には、**権限の制限**がありませんでした。
鍵さえあれば、API に対して **「閲覧」も「作成」も「削除」も自由自在** です。

**リスクの例:**

- 「データの分析用（読むだけ）」のシステムに鍵を渡したい。
- もしその鍵が漏れたら、データが全て削除されるかもしれない。

👉 **「必要な権限だけを持った鍵」** を発行する必要があります。

---

## 解決策：Scope（スコープ）

**Scope = 「トークンに付与される権限のリスト」**

鍵（トークン）を発行する際、「これは閲覧専用 (`read:todos`) ですよ」という情報を焼き付けます。

- **従来のトークン:** 「入館証（全エリア OK）」
- **Scope 付きトークン:** 「入館証（**1F ロビーのみ**）」

API 側は、トークンの中身を見て「ここに入っていい権限があるか？」を追加でチェックします。

---

## 実装の 3 ステップ

Scope を機能させるには、3 者すべての変更が必要です。

1.  **Auth0 (認可サーバー):**
    - 「どんな権限が存在するか」を定義し、アプリに許可を与える。
2.  **Client (アプリ):**
    - トークンをもらう時に「`read:todos` の権限もください」とお願いする。
3.  **API (リソースサーバー):**
    - トークンの中身を見て、「`read:todos` が書いてあるか？」をチェックする。

```mermaid
flowchart LR
    %% スタイル定義
    classDef auth0 fill:#EB5424,stroke:#333,stroke-width:0px,color:white;
    classDef client fill:#005b96,stroke:#333,stroke-width:0px,color:white;
    classDef api fill:#10944f,stroke:#333,stroke-width:0px,color:white;

    %% Step 1: Auth0
    subgraph S1 [Step 1: Auth0 設定]
        direction TB
        A1(Permission定義<br/>read:todos)
        A2(M2Mアプリに<br/>権限を許可)
        A1 --> A2
    end

    %% Step 2: Client
    subgraph S2 [Step 2: Client 実装]
        C1(POST /oauth/token)
        C2(scope: 'read:todos'<br/>をリクエストに追加)
        C1 --- C2
    end

    %% Step 3: API
    subgraph S3 [Step 3: API 実装]
        P1(Middleware追加)
        P2(requiredScopes<br/>でチェック)
        P1 --- P2
    end

    %% 関係線
    S1 -->|許可された範囲で| S2
    S2 -->|Scope付きトークン| S3

    %% クラス適用
    class A1,A2 auth0;
    class C1,C2 client;
    class P1,P2 api;
```

---

## データの流れ

```mermaid
sequenceDiagram
    participant C as Client (アプリ)
    participant A as Auth0 (認可サーバー)
    participant S as API (サーバー)

    Note over A: Step 1: 事前設定<br/>(Permissions & Grant)

    Note over C: Step 2: 要求
    C->>A: ID + Secret + scope: 'read:todos'

    A->>A: 設定を確認<br/>「このアプリは read 権限OK？」
    A-->>C: Access Token (scope: 'read:todos')

    Note over S: Step 3: 検証
    C->>S: Token を持ってアクセス
    S->>S: 署名検証 OK?
    S->>S: scopeに 'read' 入ってる?
    S-->>C: データ提供 (OK)
```

---

## 【ハンズオン】アプリ設定と実行

https://x.gd/6ijsw
上記ガイドに従ってアプリを実行してみてください

---

# お疲れ様でした！
