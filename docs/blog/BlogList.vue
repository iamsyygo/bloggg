<template>
  <div
    v-for="(articles, year, index) in articles"
    class="pos-relative classify"
    data-aos="fade-up"
    data-aos-duration="1000"
  >
    <svg width="400" height="100" viewBox="0 0 500 100" class="clip-year">
      <!-- 定义裁剪路径 -->
      <defs>
        <clipPath id="clip-top">
          <rect x="0" y="0" width="500" height="30" />
        </clipPath>
        <clipPath id="clip-bottom">
          <rect x="0" y="30" width="500" height="40" />
        </clipPath>
      </defs>

      <!-- 虚线文本，使用裁剪路径显示上半部分 -->
      <text
        data-aos="fade-right"
        data-aos-offset="300"
        data-aos-duration="1000"
        data-aos-delay="200"
        data-aos-easing="ease-in-sine"
        id="text-top"
        x="10"
        y="60"
        font-size="20"
        font-family="Sans-serif"
        font-weight="bold"
        fill="none"
        stroke="blue"
        stroke-width="2"
        stroke-dasharray="5,5"
        clip-path="url(#clip-top)"
      >
        {{ year }}
      </text>

      <!-- 实线文本，使用裁剪路径显示下半部分 -->
      <text
        id="text-bottom"
        data-aos="fade-right"
        data-aos-offset="300"
        data-aos-duration="1000"
        data-aos-delay="200"
        data-aos-easing="ease-in-sine"
        x="10"
        y="60"
        font-size="20"
        font-family="Sans-serif"
        font-weight="bold"
        fill="var(--vp-c--body-text-1)"
        clip-path="url(#clip-bottom)"
      >
        {{ year }}
      </text>
    </svg>

    <a
      v-for="(article, index) in articles"
      class="article"
      :href="article.path"
      :data-aos-delay="index * 200"
      data-aos="fade-up"
      data-aos-duration="1000"
    >
      <div class="article__title">
        <span class="article__title--translate" v-if="article.isTranslate">翻译</span>
        {{ article.title }}
      </div>
      <div class="article__date">
        <span>📅</span>
        {{ article.createTime }}
      </div>
      <div class="article__time">
        <span>⏳</span>
        {{ article.time }}
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { articles } from './articles';
</script>

<style scoped lang="scss">
.classify {
  margin: 0 auto;
  margin-top: 30px;
  width: 60%;
  position: relative;
}

@media (max-width: 768px) {
  .classify {
    width: 90%;
  }
}

.article {
  text-decoration: none;
  color: var(--vp-c--body-text-1);
  z-index: 99;
  cursor: pointer;
  transition: color 0.3s;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
}
.article + .article {
  margin-top: 30px;
}

.article:hover {
  color: var(--vp-c-indigo-2);
}

.article__title {
  z-index: 99;
  position: relative;
  font-size: 1.3rem;
  font-weight: 600;
  grid-column: 1 / -1;
  grid-row: 1 / 2;
}

.article__title--translate {
  position: absolute;
  left: -40px;
  height: 20px;
  line-height: 20px;
  padding: 0 5px;
  font-size: 12px;
  border-radius: 3px;
  background-color: var(--vp-c-gray-3);
}

.article__date {
  grid-column: 1 / 3;
  grid-row: 2 / -1;
  color: var(--vp-c-text-2);
}
.article__time {
  grid-column: 3 / -1;
  grid-row: 2 / -1;
  text-align: right;
  color: var(--vp-c-text-2);
}
.article__time > span,
.article__date > span {
  margin-right: 3px;
  font-size: 12px;
  vertical-align: 2px;
}

.clip-year {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(120%, -30%);
  z-index: 1;
}

@media (max-width: 768px) {
  .clip-year {
    position: relative;
    transform: translate(0, 0);
  }
}
</style>
