<template>
  <div class="blog-list">
    <div v-for="blog in blogMeta" :key="blog.path" class="blog-item">
      <div>
        <h2>{{ blog.name }}</h2>
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
      <div class="blog-tags" v-if="blog.tags.length">
        <span v-for="tag in blog.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <a :href="blog.path">阅读更多</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { blogMeta } from 'virtual:blog-meta';
</script>

<style scoped>
.blog-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.9em;
}

.blog-tags {
  margin: 0.5rem 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.2rem 0.5rem;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 0.8em;
  color: #666;
}
</style>
