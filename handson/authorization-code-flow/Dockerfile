# ベースイメージ
FROM node:24-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存関係ファイルのコピー
COPY package*.json ./

# 依存パッケージのインストール
RUN npm install

# ソースコードのコピー
COPY . .

# ポートの公開（server.jsで3000番を使っているため）
EXPOSE 3000

# 起動コマンド
CMD ["npm", "start"]
