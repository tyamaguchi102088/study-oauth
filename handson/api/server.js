const express = require("express");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// DB接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Auth0 ミドルウェア (JWTの検証)
// ここで検証の「ルール（どこの誰が発行したトークンを、どういう基準で検証するか）」を定義
// 以下の「数学的な検証」が自動で実行されています。
// 1.公開鍵の取得: issuerBaseURL（Auth0のドメイン）にアクセスし、Auth0の公開鍵（JWKS形式）を自動でダウンロードしてキャッシュします。
// 2.数学的照合: 届いたトークンの「署名部分」を、その公開鍵を使って解読し、ヘッダーとペイロードの内容が改ざんされていないか計算します。
// 3.妥当性チェック: 署名が正しくても、「期限切れ(exp)」だったり「自分宛て(aud)」でなければ、ここでエラーを返します。
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

// 公開エンドポイント (動作確認用)
app.get("/", (req, res) => {
  res.send("API Server is running!");
});

// 保護されたエンドポイント: Todo一覧取得
// 今回はReactでの表示用に、GETだけは認証なしでも見れるようにするか、
// あるいはReact側でもToken取得させるかですが、M2Mのデモなので
// 「GETは誰でも見れる、POST(追加)は管理者(M2M)のみ」というシナリオにします。
app.get("/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 保護されたエンドポイント: Todo追加 (要アクセストークン)
// ここがハンズオンの肝です。
app.post("/todos", checkJwt, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).send("Title is required");

  try {
    const result = await pool.query(
      "INSERT INTO todos (title) VALUES ($1) RETURNING *",
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
