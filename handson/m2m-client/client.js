const axios = require("axios");
require("dotenv").config({ path: "../.env" }); // 親ディレクトリの.envを読み込む

// 設定値の読み込み
const DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUDIENCE = process.env.AUTH0_AUDIENCE;
const API_URL = "http://localhost:3001/todos";

async function main() {
  try {
    console.log("--- 1. Token Request ---");
    console.log(`Requesting token from https://${DOMAIN}/oauth/token ...`);

    // 1. Auth0からアクセストークンを取得 (Client Credentials Flow)
    const tokenResponse = await axios.post(
      `https://${DOMAIN}/oauth/token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: AUDIENCE,
        grant_type: "client_credentials",
      },
      {
        headers: { "content-type": "application/json" },
      }
    );

    // 一文字でも変更したらエラーが返るのを実演するためのデモ
    // const accessToken = tokenResponse.data.access_token.slice(0, -1) + "[";
    // console.log(
    //   `\nOriginal Access Token: \n${tokenResponse.data.access_token} \n`
    // );
    // console.log(`Updated Access Token: \n${accessToken}\n`);

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ Access Token acquired!");
    console.log("Token:", accessToken); // デモなので全て表示
    // console.log("Token:", accessToken.substring(0, 20) + "..."); // 先頭だけ表示

    // 2. 取得したトークンを使ってAPIを叩く
    console.log("\n--- 2. API Request (Create Todo) ---");
    const newTodoTitle = `自動登録タスク ${new Date().toLocaleTimeString()}`;

    const apiResponse = await axios.post(
      API_URL,
      {
        title: newTodoTitle,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ここでトークンを渡す
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ API Response Status:", apiResponse.status);
    console.log("✅ Created Data:", apiResponse.data);
  } catch (error) {
    if (error.response) {
      console.error("❌ Error:", error.response.status, error.response.data);
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

main();
