require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

// 静的ファイル（HTML, JS）を配信
app.use(express.static("public"));

// 環境変数をフロントエンドに渡すためのエンドポイント
// (本来はビルド時に埋め込みますが、ハンズオン用に簡易実装)
app.get("/config", (req, res) => {
  res.json({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
  });
});

// 擬似的な保護されたAPI
// ハンズオン簡略化のため、トークンの検証ロジックは省略し、
// ヘッダーの有無だけチェックしています。
app.get("/api/protected", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided!" });
  }

  // 本来はここでJWTの検証を行います (verify JWT)
  console.log("Token received:", authHeader);

  res.json({
    message: "🎉 Success! You accessed the protected API.",
    timestamp: new Date(),
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
