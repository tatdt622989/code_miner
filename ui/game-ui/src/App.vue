<template>
  <div>
    <div class="container">
      <div class="item">
        <div class="img">
          <img :src="getDiscordImgPath(equipped?.mine?.emojiId)" alt="">
        </div>
        <div class="text-box">
          <p class="text title">礦場</p>
          <p class="text">{{ equipped?.mine?.name }}</p>
        </div>
      </div>
      <div class="item">
        <div class="img">
          <img :src="getDiscordImgPath(equipped?.pet?.emojiId)" alt="">
        </div>
        <div class="text-box">
          <p class="text title">寵物</p>
          <p class="text">{{ equipped?.pet?.name }}</p>
        </div>
      </div>
      <div class="item">
        <div class="img">
          <img :src="getDiscordImgPath(equipped?.tool?.emojiId)" alt="">
        </div>
        <div class="text-box">
          <p class="text title">工具</p>
          <p class="text">{{ equipped?.tool?.name }}</p>
        </div>
      </div>
      <div class="item">
        <div class="img" :data-quality="equipped?.weapon?.quality">
          <img :src="getDiscordImgPath(equipped?.weapon?.weapon?.emojiId)" alt="" v-if="userWeapon.weapon">
          <svg v-else fill="#000000" height="800px" width="800px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 454.635 454.635" xml:space="preserve">
            <path d="M286.306,301.929h-17.472L295.141,82.85c0.708-5.89-1.709-13.694-5.621-18.155L236.506,4.255
          C234.134,1.551,230.785,0,227.317,0s-6.816,1.551-9.188,4.255l-53.015,60.439c-3.912,4.461-6.328,12.266-5.621,18.155
          l26.307,219.079h-17.472c-8.412,0-15.256,6.844-15.256,15.256v18.984c0,8.412,6.844,15.256,15.256,15.256h37.118v33.143
          c-10.014,6.95-16.588,18.523-16.588,31.609c0,21.206,17.252,38.458,38.458,38.458s38.458-17.252,38.458-38.458
          c0-13.086-6.574-24.659-16.588-31.609v-33.143h37.118c8.412,0,15.256-6.844,15.256-15.256v-18.984
          C301.562,308.772,294.718,301.929,286.306,301.929z" />
          </svg>
        </div>
        <div class="text-box">
          <p class="text title">武器</p>
          <p class="text quality" v-if="userWeapon.weapon">[{{ equipped?.weapon?.qualityName }}]</p>
          <p class="text name" v-if="userWeapon.weapon">{{ equipped?.weapon?.weapon?.name }} +{{ equipped?.weapon?.level }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const data = ref(null);
const errorMessage = ref('');
const equipped = ref({});
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const userWeapon = ref({});

const getDiscordImgPath = (emojiId) => {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
}

const qualityColor = (quality) => {
  switch (quality) {
    case 1:
      return '#A0A0A0';
    case 2:
      return '#1E90FF';
    case 3:
      return '#8A2BE2';
    case 4:
      return '#FFA500';
    case 5:
      return '#FF4500';
    case 6:
      return '#FFD700';
    default:
      return '#A0A0A0';
  }
}

// 監聽 route.query 的變化
watch(
  () => route.query.discordId,
  async (discordId) => {
    if (!discordId) {
      errorMessage.value = 'Discord ID is missing in the URL.';
      console.warn(errorMessage.value);
      return;
    }

    try {
      // 呼叫 API，根據 discordId 請求資料
      const response = await axios.get(`${apiBaseUrl}/users/${discordId}`);
      data.value = response.data;
      console.log(data.value);
      equipped.value = data.value.equipped;
      userWeapon.value = data.value?.weapons.find(w => w.weapon._id === data.value.equipped.weapon) || {};
      equipped.value = {
        ...equipped.value,
        weapon: userWeapon.value ? userWeapon.value : null
      };
      console.log(data.value);
    } catch (error) {
      errorMessage.value = 'Failed to fetch user data.';
      console.error(error);
    }
  },
  { immediate: true } // 頁面首次加載時執行
);
</script>

<style lang="scss">
// color map
$quality-color-map: (
  1: #A0A0A0,
  // 灰色 - 最低品質
  2: #32CD32,
  // 綠色 - 次級品質 (新增)
  3: #1E90FF,
  // 藍色 - 普通品質
  4: #8A2BE2,
  // 紫色 - 稀有品質
  5: #FF4500,
  // 橘紅色 - 史詩品質
  6: #FFD700 // 金色 - 傳奇品質
);

body {
  background-color: #3f3f3f;
}

#app {
  padding: 0;
}

.container {
  background-color: #3f3f3f;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  flex-wrap: wrap;
  max-width: 400px;
  background: #1b1b1f;

  .item {
    width: 50%;
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;

    &:nth-of-type(3),
    &:nth-of-type(4) {
      margin-bottom: 0;
    }

    .img {
      width: 64px;
      height: 64px;
      background: #d0d3fc;
      border: 2px solid #212131;
      margin: 3px;
      border-radius: 6px;
      box-shadow: 0px 0px 0 3px #b1b5ff;
      overflow: hidden;

      @each $quality, $color in $quality-color-map {
        &[data-quality="#{$quality}"] {
          box-shadow: 0px 0px 0 3px $color;
          background: lighten($color, 20%);

          &+.text-box .text.quality,
          &+.text-box .text.name {
            color: $color;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
        }
      }

      img {
        width: 100%;
        height: 100%;
      }

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(45deg);
        path {
          fill: #8a8fe9;
        }
      }
    }

    .text-box {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 500;
      padding-left: 8px;
      padding-right: 6px;
      letter-spacing: 1px;
      margin: 0;
      color: #d8daff;
      line-height: 1.5;

      &.title {
        color: #b1b5ff;
        font-weight: 600;
      }
    }
  }
}
</style>
