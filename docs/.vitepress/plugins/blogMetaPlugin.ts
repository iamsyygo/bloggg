import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, parse } from 'node:path';
import type { Plugin } from 'vitepress';
// @ts-expect-error
import matter from 'gray-matter';

interface BlogMeta {
  name: string;
  path: string;
  createTime: number;
  updateTime: number;
  readingTime: number;
  wordCount: number;
  frontmatter: Record<string, any>;
}

// 假设平均阅读速度为每分钟 150 个字
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 150;
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime);
}

// 生成博客元数据
function generateBlogMeta(blogDir: string): BlogMeta[] {
  const blogMeta: BlogMeta[] = [];
  const files = readdirSync(blogDir);

  for (const file of files) {
    const filePath = join(blogDir, file);
    const stat = statSync(filePath);

    if (
      stat.isFile() &&
      /\.md$/.test(file) &&
      file !== 'index.md' &&
      !file.includes('/') && // 确保只处理一级目录
      !file.includes('\\') // 兼容 Windows 路径
    ) {
      const content = readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      const readingTime = calculateReadingTime(markdownContent);

      const firstH1 = markdownContent.match(/<h1>(.*?)<\/h1>/)?.[1] || markdownContent.match(/# (.*)/)?.[1];

      blogMeta.push({
        name: firstH1 || parse(file).name,
        path: `/blog/${file.replace(/\.md$/, '')}`,
        createTime: stat.birthtimeMs,
        updateTime: stat.mtimeMs,
        readingTime,
        wordCount: markdownContent.split(/\s+/).length,
        frontmatter: frontmatter,
      });
    }
  }

  return blogMeta.sort((a, b) => b.createTime - a.createTime);
}

export function blogMetaPlugin(blogDir: string): Plugin {
  const virtualModuleId = 'virtual:blog-meta';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  let cachedBlogMeta = generateBlogMeta(blogDir);

  return {
    name: 'vite-plugin-blog-meta',

    configureServer(server) {
      // 使用 vite 的 watcher API
      const watcher = server.watcher;

      function handleChange() {
        cachedBlogMeta = generateBlogMeta(blogDir);

        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (module) {
          // 重置模块
          server.moduleGraph.invalidateModule(module);
          // 通知浏览器刷新
          server.ws.send({
            type: 'full-reload',
          });
        }
      }

      // 监听 md 文件变化
      watcher.on('add', (path) => {
        if (path.endsWith('.md') && !path.includes('index.md')) {
          handleChange();
        }
      });

      watcher.on('unlink', (path) => {
        if (path.endsWith('.md') && !path.includes('index.md')) {
          handleChange();
        }
      });

      watcher.on('change', (path) => {
        if (path.endsWith('.md') && !path.includes('index.md')) {
          handleChange();
        }
      });

      console.log('Blog meta plugin: Initial scan complete.');
    },

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const blogMeta = ${JSON.stringify(cachedBlogMeta, null, 2)};`;
      }
    },
    buildStart() {},

    transform(code, id) {
      if (id === resolvedVirtualModuleId) {
        return {
          code: `export const blogMeta = ${JSON.stringify(cachedBlogMeta, null, 2)};`,
          map: null,
        };
      }
    },
  };
}
