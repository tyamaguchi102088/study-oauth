const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- 設定 ---
// 変換したいマークダウンファイル名（拡張子なし）
const TARGET_FILES = process.env.TARGET_FILES.split(","); 

const IMAGE_DIR = "images";
const IMAGE_FORMAT = "png";
// ------------

// 画像ディレクトリ作成
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
}

function processFile(baseName) {
  const inputFile = `/app/src/${baseName}.md`;
  const outputFile = `/app/${baseName}-dist.md`;

  if (!fs.existsSync(inputFile)) {
    console.warn(`⚠️  File not found: ${inputFile} (Skipping...)`);
    return;
  }

  console.log(`\n📖 Reading ${inputFile}...`);
  let content = fs.readFileSync(inputFile, "utf8");

  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  let count = 0;

  const newContent = content.replace(mermaidRegex, (match, code) => {
    count++;
    const fileName = `${baseName}-diagram-${count}.${IMAGE_FORMAT}`;
    const outputPath = path.join(IMAGE_DIR, fileName);
    const tempInputFile = `temp-${baseName}-${count}.mmd`;

    console.log(`⚙️  Rendering ${fileName}...`);

    try {
      // 1. 一時ファイル作成
      fs.writeFileSync(tempInputFile, code.trim());

      // 2. mermaid-cli (mmdc) を実行
      // Docker内なのでローカルのパッケージを使用。設定ファイル(-p)を指定。
      const cmd = `npx mmdc -i ${tempInputFile} -o ${outputPath} -b transparent -p puppeteer-config.json`;
      
      execSync(cmd, { stdio: "inherit" });

      // 3. 掃除
      fs.unlinkSync(tempInputFile);

      // 4. HTMLタグで画像を埋め込む（サイズ調整付き）
      return `<img src="./src/${IMAGE_DIR}/${fileName}" style="max-width:100%; max-height:450px; display:block; margin:0 auto;" />`;

    } catch (error) {
      console.error(`❌ Error rendering diagram #${count} in ${baseName}`);
      return match;
    }
  });

  fs.writeFileSync(outputFile, newContent);
  console.log(`✅ Generated: ${outputFile} (Images: ${count})`);
}

// 実行
console.log("🚀 Starting Dockerized conversion...");
TARGET_FILES.forEach(fileName => processFile(fileName));
console.log("🎉 Done!");
process.exit();

