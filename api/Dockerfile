FROM node:20-slim

WORKDIR /app

# 複製 package.json 和 lock 檔案
COPY package.json pnpm-lock.yaml* ./

# 安裝 pnpm 並安裝相依套件
RUN npm install -g pnpm && \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

# 複製其餘的專案檔案
COPY . .

# 曝露 port
EXPOSE 3000

# 執行指令
CMD ["node", "app.js"]
