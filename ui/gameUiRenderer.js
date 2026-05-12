const { createCanvas, GlobalFonts, loadImage, Path2D } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

// 載入外部字體以解決中文字變方塊 (豆腐塊) 的問題
const fontPath = path.join(__dirname, 'font', 'Noto_Sans_TC', 'static', 'NotoSansTC-Regular.ttf');
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'Noto Sans TC');
} else {
  console.warn(`⚠️ 警告：找不到字體檔 (${fontPath})，中文字可能會無法顯示！\n請確認 Noto_Sans_TC 資料夾是否已正確移動到 font 裡面。`);
}

// 對應 Vue 檔案中的 $quality-color-map 與 bg (lighten 20%)
const qualityColors = {
  1: { main: '#A0A0A0', bg: '#cccccc' }, // 灰色
  2: { main: '#32CD32', bg: '#85e085' }, // 綠色
  3: { main: '#1E90FF', bg: '#8cd4ff' }, // 藍色
  4: { main: '#8A2BE2', bg: '#c99bf2' }, // 紫色
  5: { main: '#FF4500', bg: '#ff9973' }, // 橘紅
  6: { main: '#FFD700', bg: '#ffe666' }, // 金色
  default: { main: '#b1b5ff', bg: '#d0d3fc' } // 預設框顏色
};

class GameUiRenderer {
  /**
   * 輔助函式：載入 Discord Emoji 圖片，若失敗則回傳 null
   */
  static async loadDiscordEmoji(emojiId) {
    if (!emojiId) return null;
    try {
      // 如果傳入的是完整網址就直接用，否則當作 Discord Emoji ID 處理
      const url = emojiId.startsWith('http') ? emojiId : `https://cdn.discordapp.com/emojis/${emojiId}.png`;
      return await loadImage(url);
    } catch (error) {
      return null;
    }
  }

  /**
   * 依照 App.vue 樣式生成遊戲 UI 圖片
   */
  static async generatePlayerProfile(discordId, userData) {
    // 解析度放大 2 倍 (Retina Display 等級)，解決圖片模糊問題
    const SCALE = 2;
    const canvas = createCanvas(400 * SCALE, 220 * SCALE);
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE); // 自動將後續所有座標與繪圖指令放大 2 倍
    ctx.textBaseline = 'top'; // 方便文字排版

    // 1. 繪製 body 背景 (可選，避免透明邊角)
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 繪製 .container 背景與圓角 (background: #1b1b1f, border-radius: 12px)
    ctx.fillStyle = '#1b1b1f';
    ctx.beginPath();
    ctx.roundRect(0, 0, 400, 220, 12);
    ctx.fill();
    ctx.clip(); // 裁切，確保內部不會超出圓角

    // 3. 處理 API 資料 (模擬 App.vue 中 watch 內的邏輯)
    const equipped = userData.equipped || {};
    const weapons = userData.weapons || [];
    // 尋找玩家裝備的武器實體
    const userWeapon = weapons.find(w => w.weapon?._id === equipped.weapon) || {};
    const equippedWeapon = userWeapon.weapon ? userWeapon : null;

    // 整理四個版塊的資料對應
    const items = [
      { title: '礦場', name: equipped.mine?.name, emojiId: equipped.mine?.emojiId },
      { title: '寵物', name: equipped.pet?.name, emojiId: equipped.pet?.emojiId },
      { title: '工具', name: equipped.tool?.name, emojiId: equipped.tool?.emojiId },
      { 
        title: '武器', 
        name: equippedWeapon ? `${equippedWeapon.weapon?.name || ''} +${equippedWeapon.level || 0}` : null, 
        emojiId: equippedWeapon?.weapon?.emojiId,
        quality: equippedWeapon?.quality,
        qualityName: equippedWeapon?.qualityName
      }
    ];

    // 4. 迴圈繪製 4 個 .item
    // padding: 20px。分為 2 欄 (寬 50% = 180px)，每列高度抓 90px
    for (let i = 0; i < items.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      
      const itemX = 20 + col * 180;
      const itemY = 20 + row * 90;

      const item = items[i];
      
      // --- 計算框線與顏色 (Quality Color) ---
      const qColors = (item.quality && qualityColors[item.quality]) 
        ? qualityColors[item.quality] 
        : qualityColors.default;

      // a. 畫 box-shadow 模擬 (最外層 74x74)
      ctx.fillStyle = qColors.main;
      ctx.beginPath();
      ctx.roundRect(itemX, itemY, 74, 74, 8);
      ctx.fill();

      // b. 畫 border (中間層 #212131 邊框)
      ctx.fillStyle = '#212131';
      ctx.beginPath();
      ctx.roundRect(itemX + 3, itemY + 3, 68, 68, 6);
      ctx.fill();

      // c. 畫 .img 的 background
      ctx.fillStyle = qColors.bg;
      ctx.beginPath();
      ctx.roundRect(itemX + 5, itemY + 5, 64, 64, 5);
      ctx.fill();

      // d. 載入並畫出 Emoji Image 或 預設 SVG
      if (item.emojiId) {
        const img = await this.loadDiscordEmoji(item.emojiId);
        if (img) {
          ctx.drawImage(img, itemX + 5, itemY + 5, 64, 64);
        }
      } else if (i === 3 && !equippedWeapon) {
        // 如果是武器且無裝備，繪製與 Vue 一致的預設劍 SVG
        ctx.save();
        // 將原點移到圖片框的中心 (X: itemX + 5 + 32, Y: itemY + 5 + 32)
        ctx.translate(itemX + 37, itemY + 37);
        // 旋轉 45 度
        ctx.rotate(45 * Math.PI / 180);
        
        // 縮放 SVG (SVG 原始 viewBox 是 454.635)
        const scale = 64 / 454.635;
        ctx.scale(scale, scale);
        
        // 將原點移到 SVG 座標系的中心點 (-227.317, -227.317)
        ctx.translate(-227.317, -227.317);

        const svgPath = new Path2D("M286.306,301.929h-17.472L295.141,82.85c0.708-5.89-1.709-13.694-5.621-18.155L236.506,4.255 C234.134,1.551,230.785,0,227.317,0s-6.816,1.551-9.188,4.255l-53.015,60.439c-3.912,4.461-6.328,12.266-5.621,18.155 l26.307,219.079h-17.472c-8.412,0-15.256,6.844-15.256,15.256v18.984c0,8.412,6.844,15.256,15.256,15.256h37.118v33.143 c-10.014,6.95-16.588,18.523-16.588,31.609c0,21.206,17.252,38.458,38.458,38.458s38.458-17.252,38.458-38.458 c0-13.086-6.574-24.659-16.588-31.609v-33.143h37.118c8.412,0,15.256-6.844,15.256-15.256v-18.984 C301.562,308.772,294.718,301.929,286.306,301.929z");
        ctx.fillStyle = '#8a8fe9';
        ctx.fill(svgPath);
        
        ctx.restore();
      }

      // --- 繪製右側 .text-box ---
      const textX = itemX + 82; // 74(img) + 8px padding-left
      let textY = itemY + 5;    // 配合 top baseline

      // Title (.text.title)
      ctx.font = '600 15px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#b1b5ff';
      ctx.fillText(item.title, textX, textY);
      textY += 22; // 換行 (line-height 1.5)

      // 裝備名稱與品質
      if (item.name) {
        if (item.qualityName) {
          // 畫品質 [史詩]
          ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
          ctx.fillStyle = qColors.main;
          ctx.fillText(`[${item.qualityName}]`, textX, textY);
          textY += 22;
        }
        
        // 畫物品名稱
        ctx.font = item.qualityName ? 'bold 15px "Noto Sans TC", sans-serif' : '500 15px "Noto Sans TC", sans-serif';
        ctx.fillStyle = item.qualityName ? qColors.main : '#d8daff';
        ctx.fillText(item.name, textX, textY);
      }
    }

    return await canvas.encode('png');
  }
}

module.exports = GameUiRenderer;
