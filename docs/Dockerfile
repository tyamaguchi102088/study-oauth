# ベースイメージ
FROM node:24-slim

# Puppeteer/Chromeに必要な依存ライブラリをインストール
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ
WORKDIR /app

# 依存関係のインストール（キャッシュ効率化のため先にコピー）
COPY package.json ./
RUN npm install

# ソースコードをコピー
COPY ./src ./src
COPY ./convert.js ./
COPY ./puppeteer-config.json ./

# コンテナ起動時はデフォルトで何もしない（外部からコマンドを指定するため）
CMD ["node", "convert.js"]
