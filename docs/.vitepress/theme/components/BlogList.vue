<template>
  <div class="blog-list">
    <div v-for="blog in blogMeta" :key="blog.path" class="blog-item" data-animate data-normal @click="open(blog.path)">
      <div>
        <div class="blog-title">{{ blog.name }}</div>
        <template v-if="blog.frontmatter?.translated">
          <div>
            翻译自 <a :href="blog.frontmatter.transmittedFrom">{{ blog.frontmatter.transmittedAuthor }}</a>
          </div>
        </template>
      </div>
      <div class="blog-meta">
        <p>创建时间: {{ new Date(blog.createTime).toLocaleDateString() }}</p>
        <p>字数: {{ blog.wordCount }}</p>
        <p>预计阅读时间: {{ blog.readingTime }} 分钟</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { blogMeta as _blogMeta } from 'virtual:blog-meta';
import { useRouter } from 'vitepress';
import { computed } from 'vue';

const blogMeta = computed(() => _blogMeta.filter((blog) => blog.frontmatter?.currentState !== 0));

const router = useRouter();

const open = (path: string) => {
  router.go(path);
};
</script>

<style scoped>
.blog-list {
  margin-top: 3.8rem;
  padding: 0 16px;
}

.blog-item {
  cursor: pointer;
  transition: color 0.3s ease-in-out;

  .blog-title {
    font-size: 1.2em;
    font-weight: 600;
    margin: 18px 0 16px;
    color: var(--vp-c-text-1);
    transition: color 0.3s ease-in-out;
  }

  .blog-meta {
    display: flex;
    gap: 1rem;
    color: var(--vp-c-text-2);
    font-size: 0.9em;
    transition: color 0.3s ease-in-out;
  }

  & + .blog-item {
    border-top: 1px dashed var(--vp-c-text-3);
  }

  &:hover .blog-title,
  &:hover .blog-meta {
    color: var(--vp-c-indigo-1);
  }
}
</style>
