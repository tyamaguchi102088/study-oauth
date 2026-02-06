// 変数置き場
let auth0Config = {};
let accessToken = null;

// ロガー用ヘルパー
function log(msg, data = "") {
  const logDiv = document.getElementById("logs");
  const timestamp = new Date().toLocaleTimeString();
  let text = `[${timestamp}] ${msg}`;
  if (data) text += `\n${JSON.stringify(data, null, 2)}`;
  logDiv.innerText = text + "\n------------------\n" + logDiv.innerText;
  console.log(`[PKCE] ${msg}`, data);
}

// ==========================================
// 1. 暗号化関連ヘルパー関数 (ここがPKCEのキモ！)
// ==========================================

// ランダムな文字列(Verifier)を生成
function generateRandomString(length) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

// SHA-256でハッシュ化
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

// Base64URLエンコード (ハッシュ値をURLで使える形式に変換)
function base64UrlEncode(a) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Challenge生成 (Verifier -> SHA256 -> Base64URL)
async function generateCodeChallenge(v) {
  const hashed = await sha256(v);
  return base64UrlEncode(hashed);
}

// ==========================================
// 2. メイン処理
// ==========================================

// 初期化
async function init() {
  // サーバーからAuth0設定を取得
  const res = await fetch("/config");
  auth0Config = await res.json();
  log("Config loaded", auth0Config);

  // URLに "code" があるか確認 (Callback時)
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    handleCallback(params.get("code"));
  }
}

// ▼ ボタンクリック時の処理：ログイン開始 (Step 1)
document.getElementById("btn-login").addEventListener("click", async () => {
  // 1. Code Verifier (正解) を生成
  const verifier = generateRandomString(43);

  // 2. Code Challenge (問題) を生成
  const challenge = await generateCodeChallenge(verifier);

  // 3. 正解を忘れないようにSessionStorageに保存 (Exchangeで使うため)
  sessionStorage.setItem("pkce_verifier", verifier);

  log("1. Generated Verifier (Secret)", verifier);
  log("2. Generated Challenge (Public)", challenge);

  // 4. Auth0の認可URLを作成
  const redirectUri = window.location.origin; // http://localhost:3000
  const args = new URLSearchParams({
    response_type: "code",
    client_id: auth0Config.clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge, // ★ここで問題を渡す！
    code_challenge_method: "S256",
    scope: "openid profile email",
  });

  const url = `https://${auth0Config.domain}/authorize?${args}`;

  log("3. Redirecting to Auth0...", url);

  // 5. リダイレクト実行
  window.location.href = url;
});

// ▼ Callback処理：トークン交換 (Step 3)
async function handleCallback(code) {
  // URLのクエリパラメータを削除して綺麗にする
  window.history.replaceState({}, document.title, "/");

  log("4. Received Authorization Code (引換券)", code);

  // 保存しておいた正解(Verifier)を取り出す
  const verifier = sessionStorage.getItem("pkce_verifier");
  if (!verifier) {
    log("Error: Verifier not found in session storage!");
    return;
  }

  // トークン交換リクエスト
  const redirectUri = window.location.origin;

  const payload = {
    grant_type: "authorization_code",
    client_id: auth0Config.clientId,
    code: code, // 引換券
    code_verifier: verifier, // ★ここで正解を渡す！
    redirect_uri: redirectUri,
  };

  log("5. Exchanging Code + Verifier for Token...", payload);

  try {
    const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.access_token) {
      log("6. Success! Token Received", data);
      accessToken = data.access_token;
      showProfileView();
    } else {
      log("Error exchanging token", data);
    }
  } catch (e) {
    log("Network Error", e);
  }
}

// ▼ APIコール (Step 4)
document.getElementById("btn-api").addEventListener("click", async () => {
  if (!accessToken) return alert("No token!");

  log("7. Calling Backend API with Token...");

  const res = await fetch("/api/protected", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  log("API Response", data);
});

// ▼ 画面切り替え
function showProfileView() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("profile-view").classList.remove("hidden");
  document.getElementById("access-token").value = accessToken;
}

// ▼ ログアウト処理
document.getElementById("btn-logout").addEventListener("click", () => {
  log("Logging out...");

  // 1. ローカルの状態をクリア
  accessToken = null;
  sessionStorage.removeItem("pkce_verifier"); // 念のため削除

  // 2. Auth0のログアウトURLを作成
  // ※ returnTo には、Auth0ダッシュボードの "Allowed Logout URLs" に登録したURLを指定
  const returnTo = window.location.origin; // http://localhost:3000

  const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${returnTo}`;

  log("Redirecting to Auth0 logout endpoint...", logoutUrl);

  // 3. Auth0へリダイレクト (これでAuth0側のセッションクッキーが削除される)
  window.location.href = logoutUrl;
});

// 起動
init();
