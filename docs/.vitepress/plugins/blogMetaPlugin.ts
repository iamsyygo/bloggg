import type { Plugin } from 'vitepress';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, parse, dirname } from 'node:path';
// @ts-expect-error
import matter from 'gray-matter';
// 用于监听文件变化
import chokidar from 'chokidar';
import { tagMapping } from './tag';

interface BlogMeta {
  name: string;
  path: string;
  createTime: number;
  updateTime: number;
  readingTime: number;
  tags: string[];
  wordCount: number;
}

// 计算阅读时间的函数（假设平均阅读速度为每分钟 100 个字）
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 100;
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime);
}

// 处理标签，将原始标签映射为标准化的标签
function normalizeTags(rawTags: string[]): string[] {
  if (!Array.isArray(rawTags)) return [];

  return rawTags
    .map((tag) => tag.toLowerCase().trim())
    .map((tag) => tagMapping[tag] || tag) // 使用映射表中的标准标签名，如果没有则使用原标签
    .filter((tag, index, self) => self.indexOf(tag) === index);
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
      !file.includes('/') && // 确保是一级目录
      !file.includes('\\') // 兼容 Windows 路径
    ) {
      const content = readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      const readingTime = calculateReadingTime(markdownContent);

      const firstH1 = markdownContent.match(/<h1>(.*?)<\/h1>/)?.[1] || markdownContent.match(/# (.*)/)?.[1];
      const tags = normalizeTags(frontmatter.tags || []);

      blogMeta.push({
        name: firstH1 || parse(file).name,
        path: `/blog/${file.replace(/\.md$/, '')}`,
        createTime: stat.birthtimeMs,
        updateTime: stat.mtimeMs,
        readingTime,
        tags,
        wordCount: markdownContent.split(/\s+/).length,
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
      const watcher = chokidar.watch(join(blogDir, '*.md'), {
        ignored: [
          /(^|[\/\\])\../, // 忽略隐藏文件
          '**/index.md', // 忽略 index.md
          '**/*/**.md', // 忽略子目录中的 md 文件
        ],
        persistent: true,
      });

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

      watcher
        .on('add', handleChange)
        .on('unlink', handleChange)
        .on('unlinkDir', handleChange)
        .on('addDir', handleChange)
        .on('ready', () => {
          console.log('Blog meta plugin: Initial scan complete.');
        });

      return () => {
        watcher.close();
      };
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
    buildStart() {
      cachedBlogMeta = generateBlogMeta(blogDir);
      // 将博客元数据写入到 dist 目录下
      const outputPath = resolve(process.cwd(), '.vitepress/dist/blog-meta.json');
      // 创建目录
      mkdirSync(dirname(outputPath), { recursive: true });
      // 写入文件
      writeFileSync(outputPath, JSON.stringify(cachedBlogMeta));
    },

    transform(code, id) {
      if (id === resolvedVirtualModuleId) {
        if (process.env.NODE_ENV === 'production') {
          // 在生产环境下，将博客元数据从 dist 目录下导入
          return {
            code: `
              import blogMetaJson from '/blog-meta.json';
              export const blogMeta = blogMetaJson;
            `,
            map: null,
          };
        }

        return {
          code: `export const blogMeta = ${JSON.stringify(cachedBlogMeta, null, 2)};`,
          map: null,
        };
      }
    },
  };
}
