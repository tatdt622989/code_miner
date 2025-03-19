const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');

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
    const response = await fetch(`http://localhost:${process.env.API_PORT}/api/users/${discordId}`);
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

    // 啟動瀏覽器
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 設置視窗大小
    await page.setViewport({
      width: 456,
      height: 226
    });

    // 訪問遊戲UI頁面
    await page.goto(`https://app.6yuwei.com/code_miner_ui/?discordId=${discordId}&v=${Date.now()}`, {
      waitUntil: 'domcontentloaded'
    });

    // 等待截圖
    await new Promise(resolve => setTimeout(resolve, 500));

    // 截圖
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true
    });

    await browser.close();

    // 設置響應頭
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="game-${discordId}.png"`);

    // 發送截圖
    res.send(screenshot);

  } catch (error) {
    console.error('截圖錯誤:', error);
    res.status(500).send('截圖生成失敗');
  }
});

app.listen(port, () => {
  console.log(`服務器運行在 http://localhost:${port}`);
});