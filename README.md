# Code miner

## 簡介

一款基於 Discord bot 的挖礦小遊戲，透過 Discord 聊天室的互動，讓玩家可以透過挖礦、購買工具、礦場等方式來獲得虛擬貨幣，並可兌換鑰匙來開啟不同的寶箱。

## 專案結構

```
code-miner
├── api 後端API
│   ├─ models 資料表Model
│   ├─ routes 路由
│   ├─ controllers 路由邏輯
│   ├─ utils 通用函式
│   ├─ app.js 進入點
│   └─ .env 環境變數
├── bot Discord 機器人
│   ├─ commands DC斜線指令
│   ├─ utils 通用函式
│   ├─ app.js 進入點
│   └─ .env 環境變數
└── .nvmrc Node.js指令版本
```
