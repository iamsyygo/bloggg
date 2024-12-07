---
aside: false
---

# <div class="i-fluent-emoji:abacus"></div> 规划

<script setup>
import ListStateItem from '@theme/components/ListStateItem.vue'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { VPSponsors } from 'vitepress/theme';
import { blogMeta } from 'virtual:blog-meta';
console.log(blogMeta);

// completedAt: 期待完成时间
// currentState: 当前状态 0: 未开始 1: 进行中 2: 已完成
const listStateMap = {
    0: 3, // 未开始
    1: 0, // 进行中
    2: 1 // 已完成
}


function open(path) {
  window.open(path, '_self')
}
const sponsors = ref([
  {
    tier: '',
    items: [
      {
        name: 'Vue',
        url: 'https://vuejs.org/',
        avatar: 'https://vuejs.org/images/logo.png'
      },
      {
        name: 'Vue',
        url: 'https://vuejs.org/',
        avatar: 'https://vuejs.org/images/logo.png'
      },

    ]
  }
])
</script>

## 文章

<div flex gap-4 mb-6 mt-4>
  <div>
     未开始: <div i-carbon:chemistry animate-2s text-blue4 />
  </div>
  <div>
     进行中: <div i-carbon:circle-dash animate-spin animate-2s text-yellow4 />
  </div>
  <div>
     已完成: <div i-carbon:checkmark-outline text-green4  />
  </div>
  <div>
     未完成: <div i-carbon:close-outline text-red4 />
  </div>
</div>

<ListStateItem v-for="item in blogMeta" :state="item.frontmatter?.currentState === 2 ? 1 : dayjs().isBefore(dayjs(item.frontmatter?.completedAt)) ? listStateMap[item.frontmatter?.currentState] : 2" @click="open(item.path)" class="cursor-pointer hover:color-[var(--vp-c-indigo-1)] transition-all duration-300"> {{ item.name }} </ListStateItem>

## 涉猎

<VPSponsors :data="sponsors" />
