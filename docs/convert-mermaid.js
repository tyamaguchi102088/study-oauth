const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- 設定 ---
const INPUT_FILE = "slides.md"; // 読み込むマークダウン
const OUTPUT_FILE = "slides-dist.md"; // 書き出すマークダウン（上書き防止のため別名にしています）
const IMAGE_DIR = "images"; // 画像の保存先フォルダ
const IMAGE_FORMAT = "png"; // 'png' または 'svg' (スライドならsvgが綺麗ですが、安定重視ならpng)
// ------------

// 画像ディレクトリがなければ作成
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
}

// マークダウンを読み込み
console.log(`📖 Reading ${INPUT_FILE}...`);
let content = fs.readFileSync(INPUT_FILE, "utf8");

// Mermaidブロックを検出する正規表現
// ```mermaid ... ``` の部分をキャプチャします
const mermaidRegex = /```mermaid([\s\S]*?)```/g;

let count = 0;

// 置換処理
const newContent = content.replace(mermaidRegex, (match, code) => {
  count++;
  const fileName = `diagram-${count}.${IMAGE_FORMAT}`;
  const outputPath = path.join(IMAGE_DIR, fileName);
  const tempInputFile = `temp-${count}.mmd`;

  console.log(`⚙️  Rendering diagram #${count} to ${outputPath}...`);

  try {
    // 1. 一時的にMermaidのコードをファイルに保存 (.mmd)
    fs.writeFileSync(tempInputFile, code.trim());

    // 2. mermaid-cli (mmdc) を実行して画像を生成
    // -i: 入力ファイル, -o: 出力ファイル, -b: 背景色(transparent)
    // npx経由で実行することでローカルのパッケージを使用
    execSync(`npx mmdc -i ${tempInputFile} -o ${outputPath} -b transparent`, {
      stdio: "inherit", // ログを表示
    });

    // 3. 一時ファイルを削除
    fs.unlinkSync(tempInputFile);

    // 4. マークダウンのコードブロックを画像タグに置換して返す
    // Remarkで表示する際、画像サイズ調整が必要な場合はHTMLタグ <img> を使うことも検討してください
    return `![mermaid-diagram-${count}](./${IMAGE_DIR}/${fileName})`;
  } catch (error) {
    console.error(`❌ Error rendering diagram #${count}:`, error);
    // エラー時は元のコードブロックをそのまま残す
    return match;
  }
});

// 新しいマークダウンファイルを保存
fs.writeFileSync(OUTPUT_FILE, newContent);

console.log("--------------------------------------------------");
console.log(`✅ Completed!`);
console.log(`Original: ${INPUT_FILE}`);
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`Images: ${count} files in ./${IMAGE_DIR}/`);
