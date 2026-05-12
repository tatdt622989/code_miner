const express = require('express');
const path = require('path');
const cors = require('cors');
const GameUiRenderer = require('./gameUiRenderer');

require('dotenv').config();

const app = express();
app.use(cors());

const port = process.env.PORT || 3000;

// 靜態文件服務
app.use(express.static(path.join(__dirname, 'game-ui/dist')));

// 取得api用戶資料
app.get('/api/users/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.API_PORT}`;
    const response = await fetch(`${apiUrl}/api/users/${discordId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API 請求錯誤:', error);
    res.status(500).json({ error: 'API 請求失敗' });
  }
});

// 截圖路由
app.get('/screenshot/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;

    // 1. 直接取得玩家資料
    // 註：如果你整合進 Discord Bot 的 controller，這裡甚至可以直接從資料庫 query，不需要透過 HTTP fetch
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.API_PORT}`;
    const response = await fetch(`${apiUrl}/api/users/${discordId}`);
    const userData = response.ok ? await response.json() : { level: 1, gold: 0 }; // 預設值備備案

    // 2. 呼叫封裝好的 Canvas 畫圖物件
    const buffer = await GameUiRenderer.generatePlayerProfile(discordId, userData);

    // 設置響應頭
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="game-${discordId}.png"`);

    // 發送截圖
    res.send(buffer);

  } catch (error) {
    console.error('截圖錯誤:', error);
    res.status(500).send('截圖生成失敗');
  }
});

app.listen(port, () => {
  console.log(`服務器運行在 http://localhost:${port}`);
});